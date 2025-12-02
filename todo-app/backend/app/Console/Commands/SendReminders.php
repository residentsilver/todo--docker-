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
use Illuminate\Database\QueryException;

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
            $currentDate = $now->format('Y-m-d');
            $currentTime = $now->format('H:i');

            // reminder_historiesテーブルから、現在の日時分（秒は無視）と一致するscheduled_atを持つ
            // statusがpendingのレコードを取得
            $pendingReminders = ReminderHistory::with(['subscription.user.activeLineToken'])
                ->where('status', 'pending')
                ->whereDate('scheduled_at', $currentDate)
                ->whereRaw("DATE_FORMAT(scheduled_at, '%H:%i') = ?", [$currentTime])
                ->get();

            $this->line("送信対象のリマインダー: {$pendingReminders->count()}件");

            foreach ($pendingReminders as $reminder) {
                try {
                    $subscription = $reminder->subscription;
                    $user = $reminder->user;

                    // サブスクリプションが有効かチェック
                    if (!$subscription || $subscription->status !== 'active' || !$subscription->notification_enabled) {
                        $this->line("サブスクリプションID {$reminder->subscription_id} は無効または通知が無効です");
                        continue;
                    }

                    // ユーザーが有効なLINEトークンを持っているかチェック
                    if (!$user->activeLineToken || !$user->activeLineToken->is_valid) {
                        $this->line("ユーザーID {$user->id} の有効なLINEトークンが見つかりません");
                        continue;
                    }

                    // LINEメッセージを送信
                    try {
                        $success = $this->lineMessagingService->sendReminderMessage($reminder);
                        
                        if ($success) {
                            $sent++;
                            $this->line("サブスクリプション '{$subscription->service_name}' のリマインダーを送信しました (残り{$reminder->days_before}日)");
                        } else {
                            $failed++;
                            $this->error("サブスクリプション '{$subscription->service_name}' のリマインダー送信に失敗しました");
                        }
                    } catch (\Exception $e) {
                        $failed++;
                        $this->error("サブスクリプション '{$subscription->service_name}' のリマインダー送信処理でエラーが発生しました: " . $e->getMessage());
                        
                        Log::error('リマインダー送信処理中にエラーが発生しました', [
                            'subscription_id' => $subscription->id,
                            'reminder_history_id' => $reminder->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                    
                } catch (\Exception $e) {
                    $failed++;
                    $this->error("リマインダー履歴ID {$reminder->id} の処理に失敗しました: " . $e->getMessage());
                    
                    Log::error('リマインダー履歴処理中にエラーが発生しました', [
                        'reminder_history_id' => $reminder->id,
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