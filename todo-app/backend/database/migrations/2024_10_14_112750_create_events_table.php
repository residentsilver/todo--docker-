<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * イベントテーブルのマイグレーション
 */
class CreateEventsTable extends Migration
{
    /**
     * テーブルの作成
     *
     * @return void
     */
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // ユーザーID
            $table->string('name'); // イベント名称
            $table->date('deadline'); // 期限
            $table->timestamps();

            // 外部キー制約
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * テーブルの削除
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('events');
    }
}