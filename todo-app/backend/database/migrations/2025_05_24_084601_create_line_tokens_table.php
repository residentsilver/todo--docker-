<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * LINE連携トークン管理テーブルのマイグレーション
     * ユーザーとLINEアカウントの紐付け情報を安全に管理
     */
    public function up(): void
    {
        Schema::create('line_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('line_user_id')->unique(); // LINEユーザーID
            $table->text('access_token'); // LINEアクセストークン（暗号化推奨）
            $table->text('refresh_token')->nullable(); // リフレッシュトークン（暗号化推奨）
            $table->timestamp('token_expires_at')->nullable(); // トークン有効期限
            $table->string('line_display_name')->nullable(); // LINEの表示名
            $table->string('line_picture_url')->nullable(); // LINEのプロフィール画像URL
            $table->json('scope')->nullable(); // 取得したスコープ情報
            $table->boolean('is_active')->default(true); // 連携状態
            $table->timestamp('linked_at'); // 連携開始日時
            $table->timestamp('last_used_at')->nullable(); // 最終利用日時
            $table->timestamps();
            
            // インデックス設定
            $table->index(['user_id', 'is_active']);
            $table->index(['line_user_id']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('line_tokens');
    }
};
