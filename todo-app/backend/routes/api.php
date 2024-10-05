<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TodoController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| ここにAPIルートを登録します。これらのルートは`api`ミドルウェアグループに属します。
|
*/

Route::resource('todos', TodoController::class);