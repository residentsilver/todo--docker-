<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateReminderHistoriesStatusEnum extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // ENUM定義を更新して'test'を追加
        DB::statement("ALTER TABLE reminder_histories MODIFY COLUMN status ENUM('pending', 'sent', 'failed', 'cancelled', 'test') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // 元のENUM定義に戻す
        DB::statement("ALTER TABLE reminder_histories MODIFY COLUMN status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending'");
    }
}