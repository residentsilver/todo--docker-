<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TodoDetail; // モデルをインポート
use App\Models\Todo; // 関連モデルを必要に応じてインポート
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
}