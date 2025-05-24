<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * todosテーブルにuser_idカラムを追加するマイグレーション
 * ログイン機能実装のため、各TODOをユーザーに関連付ける
 * 既存データがある場合を考慮した安全な実装
 */
return new class extends Migration
{
    /**
     * マイグレーションの実行
     * 1. デフォルトユーザーを作成
     * 2. 無効なuser_idを持つデータにデフォルトユーザーIDを設定
     * 3. user_idをNOT NULLに変更
     * 4. 外部キー制約を追加
     */
    public function up(): void
    {
        // 1. デフォルトユーザーが存在しない場合は作成
        $defaultUser = DB::table('users')->where('email', 'default@example.com')->first();
        if (!$defaultUser) {
            $defaultUserId = DB::table('users')->insertGetId([
                'name' => 'デフォルトユーザー',
                'email' => 'default@example.com',
                'password' => Hash::make('password'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $defaultUserId = $defaultUser->id;
        }

        // 2. user_idカラムが既に存在するかチェック
        if (!Schema::hasColumn('todos', 'user_id')) {
            Schema::table('todos', function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
            });
        }

        // 3. 無効なuser_idを持つtodosにデフォルトユーザーIDを設定
        // NULLまたは存在しないユーザーIDを持つレコードを更新
        $validUserIds = DB::table('users')->pluck('id')->toArray();
        
        DB::table('todos')
            ->where(function($query) use ($validUserIds) {
                $query->whereNull('user_id')
                      ->orWhereNotIn('user_id', $validUserIds);
            })
            ->update(['user_id' => $defaultUserId]);

        // 4. user_idをNOT NULLに変更し、外部キー制約を追加（まだ存在しない場合のみ）
        Schema::table('todos', function (Blueprint $table) {
            // 外部キー制約が既に存在するかチェック
            $foreignKeys = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'todos' 
                AND COLUMN_NAME = 'user_id' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ");

            if (empty($foreignKeys)) {
                $table->unsignedBigInteger('user_id')->nullable(false)->change();
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            }
        });
    }

    /**
     * マイグレーションのロールバック
     * user_idカラムと外部キー制約を削除
     */
    public function down(): void
    {
        Schema::table('todos', function (Blueprint $table) {
            // 外部キー制約を削除してからカラムを削除
            $foreignKeys = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'todos' 
                AND COLUMN_NAME = 'user_id' 
                AND REFERENCED_TABLE_NAME IS NOT NULL
            ");

            if (!empty($foreignKeys)) {
                $table->dropForeign(['user_id']);
            }
            
            if (Schema::hasColumn('todos', 'user_id')) {
                $table->dropColumn('user_id');
            }
        });

        // デフォルトユーザーを削除（他にtodosがない場合のみ）
        $defaultUser = DB::table('users')->where('email', 'default@example.com')->first();
        if ($defaultUser) {
            $hasOtherTodos = DB::table('todos')->where('user_id', $defaultUser->id)->exists();
            if (!$hasOtherTodos) {
                DB::table('users')->where('id', $defaultUser->id)->delete();
            }
        }
    }
}; 