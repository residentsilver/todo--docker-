<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('todo_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('todo_id')->constrained('todos')->onDelete('cascade');
            $table->text('description')->nullable();
            $table->integer('order')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamps();
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('todo_details');
    }
};
