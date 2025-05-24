<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ユーザー設定テーブルのマイグレーション
     * ユーザーごとのデフォルト設定や通知設定を管理
     */
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('default_reminder_days')->nullable(); // デフォルトのリマインド日数 例：[30, 7, 1]
            $table->time('default_reminder_time')->default('09:00:00'); // デフォルトの通知時間
            $table->string('timezone')->default('Asia/Tokyo'); // タイムゾーン
            $table->text('default_custom_message')->nullable(); // デフォルトのカスタムメッセージ
            $table->boolean('notification_enabled')->default(true); // 全体の通知有効/無効
            $table->boolean('line_notification_enabled')->default(true); // LINE通知有効/無効
            $table->string('currency')->default('JPY'); // 通貨設定
            $table->string('date_format')->default('Y-m-d'); // 日付表示形式
            $table->string('theme')->default('light'); // ダークモード/ライトモード
            $table->boolean('email_notification_enabled')->default(false); // メール通知有効/無効（将来拡張用）
            $table->timestamps();
            
            // インデックス設定
            $table->unique('user_id'); // 1ユーザーに1つの設定
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
