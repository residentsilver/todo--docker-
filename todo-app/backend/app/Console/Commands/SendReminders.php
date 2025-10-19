<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\ReminderHistory;
use App\Models\Subscription;
use Carbon\Carbon;
use App\Services\NotificationService;
use App\Services\LineMessagingService;
use Illuminate\Support\Facades\Log;

/**
 * リマインダー送信コマンド
 * イベントとサブスクリプションの両方のリマインダーを送信
 */
class SendReminders extends Command
{
    /**
     * コマンド名と説明
     *
     * @var string
     */
    protected $signature = 'reminders:send {--type=all : 送信するリマインダーのタイプ (all, events, subscriptions)}';

    protected $description = '登録されたイベントとサブスクリプションのリマインダーを送信します。';

    /**
     * 通知サービスインスタンス
     *
     * @var \App\Services\NotificationService
     */
    protected $notificationService;

    /**
     * LINE Messaging サービスインスタンス
     *
     * @var \App\Services\LineMessagingService
     */
    protected $lineMessagingService;

    /**
     * コンストラクタ
     *
     * @param \App\Services\NotificationService $notificationService
     * @param \App\Services\LineMessagingService $lineMessagingService
     * @return void
     */
    public function __construct(NotificationService $notificationService, LineMessagingService $lineMessagingService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
        $this->lineMessagingService = $lineMessagingService;
    }

    /**
     * コマンドの実行
     *
     * @return int
     */
    public function handle()
    {
        $type = $this->option('type');
        $sentCount = 0;
        $failedCount = 0;

        try {
            // イベントリマインダーの送信
            if ($type === 'all' || $type === 'events') {
                $this->info('イベントリマインダーを送信中...');
                $eventResults = $this->sendEventReminders();
                $sentCount += $eventResults['sent'];
                $failedCount += $eventResults['failed'];
            }

            // サブスクリプションリマインダーの送信
            if ($type === 'all' || $type === 'subscriptions') {
                $this->info('サブスクリプションリマインダーを送信中...');
                $subscriptionResults = $this->sendSubscriptionReminders();
                $sentCount += $subscriptionResults['sent'];
                $failedCount += $subscriptionResults['failed'];
            }

            $this->info("リマインダー送信完了: 成功 {$sentCount}件, 失敗 {$failedCount}件");
            
            Log::info('リマインダー送信コマンド実行完了', [
                'type' => $type,
                'sent_count' => $sentCount,
                'failed_count' => $failedCount
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error('リマインダー送信中にエラーが発生しました: ' . $e->getMessage());
            
            Log::error('リマインダー送信コマンドでエラーが発生しました', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return 1;
        }
    }

    /**
     * イベントリマインダーを送信
     *
     * @return array
     */
    private function sendEventReminders(): array
    {
        $sent = 0;
        $failed = 0;

        try {
            $targetDate = Carbon::now()->addWeek()->toDateString();

            // 期限が1週間後のイベントを取得
            $events = Event::whereDate('deadline', $targetDate)->with('user')->get();

            foreach ($events as $event) {
                try {
                    $user = $event->user;
                    $notificationMethods = $user->notification_methods ?? ['email']; // デフォルトはメール

                    foreach ($notificationMethods as $method) {
                        $this->notificationService->send($user, $event, $method);
                    }
                    
                    $sent++;
                    $this->line("イベント '{$event->title}' のリマインダーを送信しました");
                    
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("イベント '{$event->title}' のリマインダー送信に失敗しました: " . $e->getMessage());
                }
            }

        } catch (\Exception $e) {
            $this->error('イベントリマインダー処理中にエラーが発生しました: ' . $e->getMessage());
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    /**
     * サブスクリプションリマインダーを送信
     *
     * @return array
     */
    private function sendSubscriptionReminders(): array
    {
        $sent = 0;
        $failed = 0;

        try {
            $now = Carbon::now();
            $currentTime = $now->format('H:i');

            // 条件に一致するサブスクリプションを取得
            $subscriptions = Subscription::with(['user.activeLineToken'])
                ->where('notification_enabled', true)
                ->where('status', 'active')
                ->whereNotNull('reminder_days')
                ->whereNotNull('reminder_time')
                ->get();

            $this->line("チェック対象のサブスクリプション: {$subscriptions->count()}件");

            foreach ($subscriptions as $subscription) {
                try {
                    // ユーザーが有効なLINEトークンを持っているかチェック
                    if (!$subscription->user->activeLineToken || !$subscription->user->activeLineToken->is_valid) {
                        $this->line("ユーザーID {$subscription->user->id} の有効なLINEトークンが見つかりません");
                        continue;
                    }

                    // リマインド時間の確認（現在時刻がリマインド時間と一致するかチェック）
                    $reminderTime = Carbon::parse($subscription->reminder_time)->format('H:i');
                    if ($currentTime !== $reminderTime) {
                        $this->line("サブスクリプション '{$subscription->service_name}' のリマインド時間 ({$reminderTime}) と現在時刻 ({$currentTime}) が一致しません");
                        continue;
                    }

                    // reminder_daysの各値に対してチェック
                    $reminderDays = $subscription->reminder_days;
                    if (!is_array($reminderDays)) {
                        continue;
                    }

                    foreach ($reminderDays as $daysBefore) {
                        // 指定日数前の日付を計算
                        $targetDate = Carbon::parse($subscription->end_date)->subDays($daysBefore)->toDateString();
                        $today = $now->toDateString();
                        
                        // 今日の日付と一致するかチェック
                        if ($targetDate === $today) {
                            // 既に送信済みかチェック（ユニーク制約に合わせてuser_idも含める）
                            $existingReminder = ReminderHistory::forSubscriptionUser(
                                $subscription->id, 
                                $daysBefore, 
                                $subscription->user_id
                            )->where('status', 'sent')->first();

                            if ($existingReminder) {
                                $this->line("サブスクリプション '{$subscription->service_name}' の {$daysBefore}日前リマインダーは既に送信済みです");
                                continue;
                            }

                            // リマインダー履歴を作成
                            $reminder = ReminderHistory::create([
                                'subscription_id' => $subscription->id,
                                'user_id' => $subscription->user_id,
                                'days_before' => $daysBefore,
                                'scheduled_at' => $now,
                                'status' => 'pending',
                            ]);

                            // LINEメッセージを送信
                            $success = $this->lineMessagingService->sendReminderMessage($reminder);
                            
                            if ($success) {
                                $sent++;
                                $this->line("サブスクリプション '{$subscription->service_name}' のリマインダーを送信しました (残り{$daysBefore}日)");
                            } else {
                                $failed++;
                                $this->error("サブスクリプション '{$subscription->service_name}' のリマインダー送信に失敗しました");
                            }
                        }
                    }
                    
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("サブスクリプションID {$subscription->id} の処理に失敗しました: " . $e->getMessage());
                    
                    Log::error('サブスクリプションリマインダー処理中にエラーが発生しました', [
                        'subscription_id' => $subscription->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }

        } catch (\Exception $e) {
            $this->error('サブスクリプションリマインダー処理中にエラーが発生しました: ' . $e->getMessage());
            
            Log::error('サブスクリプションリマインダー処理中にエラーが発生しました', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }

        return ['sent' => $sent, 'failed' => $failed];
    }
}