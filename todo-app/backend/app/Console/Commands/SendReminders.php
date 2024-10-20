<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use Carbon\Carbon;
use App\Services\NotificationService;

/**
 * リマインダー送信コマンド
 */
class SendReminders extends Command
{
    /**
     * コマンド名と説明
     *
     * @var string
     */
    protected $signature = 'reminders:send';

    protected $description = '登録されたイベントの1週間前にリマインダーを送信します。';

    /**
     * 通知サービスインスタンス
     *
     * @var \App\Services\NotificationService
     */
    protected $notificationService;

    /**
     * コンストラクタ
     *
     * @param \App\Services\NotificationService $notificationService
     * @return void
     */
    public function __construct(NotificationService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }

    /**
     * コマンドの実行
     *
     * @return int
     */
    public function handle()
    {
        $targetDate = Carbon::now()->addWeek()->toDateString();

        // 期限が1週間後のイベントを取得
        $events = Event::whereDate('deadline', $targetDate)->with('user')->get();

        foreach ($events as $event) {
            $user = $event->user;
            $notificationMethods = $user->notification_methods; // ユーザー設定による通知方法

            foreach ($notificationMethods as $method) {
                $this->notificationService->send($user, $event, $method);
            }
        }

        $this->info('リマインダーを送信しました。');
        return 0;
    }
}