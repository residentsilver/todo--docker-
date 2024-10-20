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
        // 毎日深夜にリマインダーを送信
        $schedule->command('reminders:send')->dailyAt('00:00');
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