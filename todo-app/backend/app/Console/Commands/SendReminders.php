<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\ReminderHistory;
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

            // 送信予定時刻が現在時刻以前で、まだ送信されていないリマインダーを取得
            $pendingReminders = ReminderHistory::with(['subscription.user', 'user'])
                ->where('status', 'pending')
                ->where('scheduled_at', '<=', $now)
                ->get();

            $this->line("送信対象のサブスクリプションリマインダー: {$pendingReminders->count()}件");

            foreach ($pendingReminders as $reminder) {
                try {
                    $subscription = $reminder->subscription;
                    
                    // サブスクリプションが無効または通知が無効の場合はスキップ
                    if (!$subscription || !$subscription->notification_enabled || $subscription->status !== 'active') {
                        $reminder->update(['status' => 'cancelled']);
                        continue;
                    }

                    // LINEメッセージを送信
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
                    $this->error("リマインダーID {$reminder->id} の送信に失敗しました: " . $e->getMessage());
                    
                    // エラー情報を記録
                    $reminder->update([
                        'status' => 'failed',
                        'error_message' => $e->getMessage(),
                    ]);
                }
            }

        } catch (\Exception $e) {
            $this->error('サブスクリプションリマインダー処理中にエラーが発生しました: ' . $e->getMessage());
        }

        return ['sent' => $sent, 'failed' => $failed];
    }
}