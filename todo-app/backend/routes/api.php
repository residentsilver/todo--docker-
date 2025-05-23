<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\ToDoDetailController;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

// Todo関連のルート
Route::put('/todos/order', [TodoController::class, 'updateOrder']);
Route::put('/todoDetails/{todo}/order', [TodoDetailController::class, 'updateOrder']);
Route::resource('todos', TodoController::class);
Route::resource('tododetails', ToDoDetailController::class);

// 削除されたTodo関連のルート
Route::get('/todos-deleted', [TodoController::class, 'getDeletedTodos']);
Route::post('/todos/{id}/restore', [TodoController::class, 'restoreTodo']);
Route::post('/todos/{todoId}/details/{detailId}/restore', [TodoController::class, 'restoreTodoDetail']);

//remind機能
// 認証ルート
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// 認証が必要なルート
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // イベントCRUDルート
    Route::apiResource('events', EventController::class);
});