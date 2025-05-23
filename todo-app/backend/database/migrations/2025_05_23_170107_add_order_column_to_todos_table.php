<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * todosテーブルにorderカラムを追加するマイグレーション
     * 
     * @return void
     */
    public function up(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            // orderカラムを追加（整数型、デフォルト値0、インデックス付き）
            $table->integer('order')->default(0)->index()->after('title');
        });
    }

    /**
     * マイグレーションをロールバックする
     * 
     * @return void
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            // orderカラムを削除
            $table->dropColumn('order');
        });
    }
};