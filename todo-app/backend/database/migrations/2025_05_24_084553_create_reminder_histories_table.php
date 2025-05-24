<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * リマインド通知履歴テーブルのマイグレーション
     * 送信された通知の履歴を管理し、重複送信を防ぐ
     */
    public function up(): void
    {
        Schema::create('reminder_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('days_before'); // 何日前の通知か
            $table->timestamp('scheduled_at'); // 送信予定日時
            $table->timestamp('sent_at')->nullable(); // 実際の送信日時
            $table->enum('status', ['pending', 'sent', 'failed', 'cancelled'])->default('pending'); // 送信ステータス
            $table->text('message')->nullable(); // 送信されたメッセージ内容
            $table->text('error_message')->nullable(); // エラーメッセージ（送信失敗時）
            $table->string('line_message_id')->nullable(); // LINEメッセージID
            $table->boolean('is_read')->default(false); // 既読・未読管理
            $table->timestamps();
            
            // インデックス設定
            $table->index(['subscription_id', 'days_before']); // 重複チェック用
            $table->index(['user_id', 'status']);
            $table->index(['scheduled_at', 'status']);
            $table->index(['sent_at']);
            
            // 同じサブスクリプションの同じ日数前通知は一度だけ送信されるよう制約
            $table->unique(['subscription_id', 'days_before'], 'unique_subscription_reminder');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminder_histories');
    }
};
