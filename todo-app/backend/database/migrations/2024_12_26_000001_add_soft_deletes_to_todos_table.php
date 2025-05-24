<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * todosテーブルにソフトデリート機能を追加するマイグレーション
 * 
 * @description このマイグレーションはtodosテーブルにdeleted_atカラムを追加して、
 *              ソフトデリート機能を有効にします。
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
        Schema::table('todos', function (Blueprint $table) {
            // ソフトデリート用のdeleted_atカラムを追加
            $table->softDeletes();
        });
    }

    /**
     * マイグレーションのロールバック
     * 
     * @return void
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            // deleted_atカラムを削除
            $table->dropSoftDeletes();
        });
    }
}; 