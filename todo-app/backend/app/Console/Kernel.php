<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\SendReminders;

/**
 * コンソールカーネル
 */
class Kernel extends ConsoleKernel
{
    /**
     * コマンドの登録
     *
     * @var array
     */
    protected $commands = [
        SendReminders::class,
    ];

    /**
     * スケジュールの定義
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // イベントリマインダーを毎日深夜に送信
        $schedule->command('reminders:send --type=events')
            ->dailyAt('00:00')
            ->withoutOverlapping()
            ->runInBackground();

        // サブスクリプションリマインダーを毎時間チェック（より細かい制御のため）
        $schedule->command('reminders:send --type=subscriptions')
            ->dailyAt('09:00')
            ->timezone('Asia/Tokyo')
            ->withoutOverlapping()
            ->runInBackground();

        // 全てのリマインダーを毎日朝9時に送信（バックアップとして）
        $schedule->command('reminders:send --type=all')
            ->dailyAt('09:00')
            ->withoutOverlapping()
            ->runInBackground();
    }

    /**
     * 登録するコマンド
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}