<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TodoDetail; // モデルをインポート
use App\Models\Todo; // 関連モデルを必要に応じてインポート
use Illuminate\Support\Facades\DB;

class ToDoDetailController extends Controller
{
    public function index()
    {
        $todoDetails = TodoDetail::all();
        return response()->json($todoDetails);
    }

    /**
     * 特定のTodoDetailを取得
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $todoDetail = TodoDetail::find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つかりません。'], 404);
        }

        return response()->json($todoDetail);
    }

    /**
     * 新しいTodoDetailを作成
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {

        $validatedData = $request->validate([
            'todo_id' => 'required|exists:todos,id',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        // Todoモデルを取得
        $todo = Todo::findOrFail($validatedData['todo_id']);

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
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $todoDetail = TodoDetail::find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つかりません。'], 404);
        }

        $validatedData = $request->validate([
            'todo_id' => 'sometimes|required|exists:todos,id',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        $todoDetail->update($validatedData);

        return response()->json($todoDetail);
    }

    /**
     * 特定のTodoDetailを削除
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        $todoDetail = TodoDetail::find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つかりません。'], 404);
        }

        $todoDetail->delete();

        return response()->json(['message' => 'TodoDetailを削除しました。'], 200);
    }

    public function updateOrder(Request $request, Todo $todo)
    {
        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:todo_details,id',
        ]);

        // トランザクションを追加して、一連の更新を安全に行う
        DB::transaction(function () use ($request, $todo) {
            foreach ($request->order as $index => $id) {
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