<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TodoDetail; // モデルをインポート
use App\Models\Todo; // 関連モデルを必要に応じてインポート
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\ToDoDetails\IndexRequest;
use App\Http\Requests\ToDoDetails\StoreRequest;
use App\Http\Requests\ToDoDetails\UpdateRequest;
use App\Http\Requests\ToDoDetails\BaseRequest;
use App\Http\Requests\ToDoDetails\UpdateOrderRequest;

class ToDoDetailController extends Controller
{
    public function index(IndexRequest $request)
    {
        // 認証されたユーザーのTodoDetailのみを取得
        $todoDetails = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->get();
        
        return response()->json($todoDetails);
    }

    /**
     * 特定のTodoDetailを取得
     * 
     * @param \App\Http\Requests\ToDoDetails\BaseRequest $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(BaseRequest $request, $id)
    {
        $todoDetail = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つかりません。'], 404);
        }

        return response()->json($todoDetail);
    }

    /**
     * 新しいTodoDetailを作成
     * 
     * @param \App\Http\Requests\ToDoDetails\StoreRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreRequest $request)
    {
        $validatedData = $request->validated();

        // Todoを取得（Form Requestで既に認証済み）
        $todo = Todo::where('id', $validatedData['todo_id'])
                   ->where('user_id', Auth::id())
                   ->first();

        // 現在の最大orderを取得
        $maxOrder = $todo->todoDetails()->max('order') ?? 0;

        // orderを設定
        $validatedData['order'] = $maxOrder + 1;

        $todoDetail = TodoDetail::create($validatedData);

        return response()->json($todoDetail, 201);
    }

    /**
     * 特定のTodoDetailを更新
     * 
     * @param \App\Http\Requests\ToDoDetails\UpdateRequest $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(UpdateRequest $request, $id)
    {
        $todoDetail = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つからないか、アクセス権限がありません。'], 404);
        }

        $validatedData = $request->validated();
        $todoDetail->update($validatedData);

        return response()->json($todoDetail);
    }

    /**
     * 特定のTodoDetailを削除
     * 
     * @param \App\Http\Requests\ToDoDetails\BaseRequest $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(BaseRequest $request, $id)
    {
        $todoDetail = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つからないか、アクセス権限がありません。'], 404);
        }

        $todoDetail->delete();

        return response()->json(['message' => 'TodoDetailを削除しました。'], 200);
    }

    public function updateOrder(UpdateOrderRequest $request, Todo $todo)
    {
        $validatedData = $request->validated();

        // トランザクションを追加して、一連の更新を安全に行う
        DB::transaction(function () use ($validatedData, $todo) {
            foreach ($validatedData['order'] as $index => $id) {
                TodoDetail::where('id', $id)
                    ->where('todo_id', $todo->id)
                    ->update(['order' => $index]);
            }
        });

        // 更新後のTodoDetailを返す
        $updatedDetails = TodoDetail::where('todo_id', $todo->id)
            ->orderBy('order')
            ->get();

        return response()->json([
            'message' => 'タスクの順序を更新しました。',
            'data' => $updatedDetails
        ]);
    }
}