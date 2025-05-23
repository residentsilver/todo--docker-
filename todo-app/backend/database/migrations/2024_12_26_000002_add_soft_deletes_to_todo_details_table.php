<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * todo_detailsテーブルにソフトデリート機能を追加するマイグレーション
 * 
 * @description このマイグレーションはtodo_detailsテーブルにdeleted_atカラムを追加して、
 *              ソフトデリート機能を有効にし、外部キー制約を調整します。
 * @author システム開発者
 * @version 1.0
 */
return new class extends Migration
{
    /**
     * マイグレーションの実行
     * 
     * @return void
     */
    public function up(): void
    {
        Schema::table('todo_details', function (Blueprint $table) {
            // 既存の外部キー制約を削除
            $table->dropForeign(['todo_id']);
            
            // ソフトデリート用のdeleted_atカラムを追加
            $table->softDeletes();
            
            // 外部キー制約を再作成（cascadeではなくrestrictに変更）
            $table->foreign('todo_id')
                  ->references('id')
                  ->on('todos')
                  ->onDelete('restrict');
        });
    }

    /**
     * マイグレーションのロールバック
     * 
     * @return void
     */
    public function down(): void
    {
        Schema::table('todo_details', function (Blueprint $table) {
            // 外部キー制約を削除
            $table->dropForeign(['todo_id']);
            
            // deleted_atカラムを削除
            $table->dropSoftDeletes();
            
            // 元の外部キー制約を復元
            $table->foreign('todo_id')
                  ->references('id')
                  ->on('todos')
                  ->onDelete('cascade');
        });
    }
}; 