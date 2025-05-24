<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\ToDoDetailController;
use App\Http\Controllers\AuthController;

// 認証不要のルート
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// API接続テスト用エンドポイント
Route::get('/test-connection', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API server is running',
        'timestamp' => now()->toISOString()
    ]);
});

// 認証が必要なルート
Route::middleware('auth:sanctum')->group(function () {
    // ユーザー情報
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Todo関連のルート
    Route::put('/todos/order', [TodoController::class, 'updateOrder']);
    Route::put('/todoDetails/{todo}/order', [ToDoDetailController::class, 'updateOrder']);
    Route::resource('todos', TodoController::class);
    Route::resource('tododetails', ToDoDetailController::class);

    // 削除されたTodo関連のルート
    Route::get('/todos-deleted', [TodoController::class, 'getDeletedTodos']);
    Route::post('/todos/{id}/restore', [TodoController::class, 'restoreTodo']);
    Route::post('/todos/{todoId}/details/{detailId}/restore', [TodoController::class, 'restoreTodoDetail']);
});