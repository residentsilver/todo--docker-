<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\ToDoDetailController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\LineAuthController;

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

// デバッグ用エンドポイント（本番環境では削除すること）
Route::get('/debug-auth', function () {
    try {
        return response()->json([
            'status' => 'success',
            'auth_default_guard' => config('auth.defaults.guard'),
            'auth_guards' => array_keys(config('auth.guards')),
            'sanctum_guard' => config('sanctum.guard'),
            'user_model' => config('auth.providers.users.model'),
            'app_env' => app()->environment(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
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

    // LINE認証関連
    Route::prefix('line')->group(function () {
        Route::get('/auth-url', [LineAuthController::class, 'getAuthUrl']);
        Route::get('/callback', [LineAuthController::class, 'handleCallback']);
    });

    // リマインド機能のルート
    Route::prefix('remind')->group(function () {
        // サブスクリプション管理
        Route::get('/subscriptions', [ReminderController::class, 'index']);
        Route::post('/subscriptions', [ReminderController::class, 'store']);
        Route::get('/subscriptions/{id}', [ReminderController::class, 'show']);
        Route::put('/subscriptions/{id}', [ReminderController::class, 'update']);
        Route::delete('/subscriptions/{id}', [ReminderController::class, 'destroy']);
        
        // メッセージプレビューとテスト送信
        Route::get('/subscriptions/{id}/preview', [ReminderController::class, 'messagePreview']);
        Route::post('/subscriptions/{id}/test', [ReminderController::class, 'sendTestReminder']);
        
        // リマインド履歴
        Route::get('/history', [ReminderController::class, 'getHistory']);
        Route::get('/histories', [ReminderController::class, 'reminderHistories']);
        
        // 統計・分析
        Route::get('/analytics', [ReminderController::class, 'getAnalytics']);
        Route::get('/monthly-totals', [ReminderController::class, 'monthlyTotals']);
        
        // ユーザー設定
        Route::get('/settings', [ReminderController::class, 'getSettings']);
        Route::put('/settings', [ReminderController::class, 'updateSettings']);
        
        // LINE連携
        Route::get('/line/status', [ReminderController::class, 'checkLineConnection']);
        Route::post('/line/connect', [ReminderController::class, 'connectLine']);
        Route::delete('/line/disconnect', [ReminderController::class, 'disconnectLine']);
    });
});

// 一時的なテスト用エンドポイント（認証なし）
Route::get('/test-todos', function () {
    try {
        $todos = \App\Models\Todo::with('todoDetails')->take(5)->get();
        return response()->json([
            'status' => 'success',
            'count' => $todos->count(),
            'sample' => $todos->map(function($todo) {
                return [
                    'id' => $todo->id,
                    'title' => $todo->title,
                    'user_id' => $todo->user_id
                ];
            })
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});