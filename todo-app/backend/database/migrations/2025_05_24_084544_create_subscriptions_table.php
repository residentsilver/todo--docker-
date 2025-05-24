<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * サブスクリプション情報テーブルのマイグレーション
     * ユーザーが契約しているサブスクリプションサービスの情報を管理
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('service_name'); // サービス名
            $table->text('description')->nullable(); // サービスの説明
            $table->date('start_date'); // 契約開始日
            $table->date('end_date'); // 契約終了日
            $table->decimal('amount', 10, 2); // 金額（日本円）
            $table->enum('contract_type', ['monthly', 'yearly', 'free_trial', 'one_time', 'other']); // 契約タイプ
            $table->string('url')->nullable(); // サービスの公式サイトや解約ページのURL
            $table->enum('status', ['active', 'expired', 'cancelled', 'paused', 'pending_renewal'])->default('active'); // 契約ステータス
            $table->json('reminder_days')->nullable(); // リマインド日数（JSON形式で複数設定可能）例：[30, 7, 1]
            $table->time('reminder_time')->nullable(); // リマインド通知時間
            $table->string('timezone')->default('Asia/Tokyo'); // タイムゾーン
            $table->text('custom_message')->nullable(); // カスタム通知メッセージ
            $table->boolean('notification_enabled')->default(true); // 通知有効/無効
            $table->timestamps();
            
            // インデックス設定
            $table->index(['user_id', 'status']);
            $table->index(['end_date', 'status']);
            $table->index(['user_id', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
