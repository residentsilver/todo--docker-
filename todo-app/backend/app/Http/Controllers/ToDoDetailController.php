<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TodoDetail; // モデルをインポート
use App\Models\Todo; // 関連モデルを必要に応じてインポート
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ToDoDetailController extends Controller
{
    /**
     * コンストラクタ - 認証ミドルウェアを適用
     */
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index()
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
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
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

        // Todoが認証されたユーザーのものかチェック
        $todo = Todo::where('id', $validatedData['todo_id'])
                   ->where('user_id', Auth::id())
                   ->first();

        if (!$todo) {
            return response()->json(['message' => '指定されたTodoが見つからないか、アクセス権限がありません。'], 403);
        }

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
        $todoDetail = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つからないか、アクセス権限がありません。'], 404);
        }

        $validatedData = $request->validate([
            'todo_id' => 'sometimes|required|exists:todos,id',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        // todo_idが変更される場合、新しいTodoも認証されたユーザーのものかチェック
        if (isset($validatedData['todo_id'])) {
            $newTodo = Todo::where('id', $validatedData['todo_id'])
                          ->where('user_id', Auth::id())
                          ->first();
            
            if (!$newTodo) {
                return response()->json(['message' => '指定されたTodoが見つからないか、アクセス権限がありません。'], 403);
            }
        }

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
        $todoDetail = TodoDetail::whereHas('todo', function ($query) {
            $query->where('user_id', Auth::id());
        })->find($id);

        if (!$todoDetail) {
            return response()->json(['message' => 'TodoDetailが見つからないか、アクセス権限がありません。'], 404);
        }

        $todoDetail->delete();

        return response()->json(['message' => 'TodoDetailを削除しました。'], 200);
    }

    public function updateOrder(Request $request, Todo $todo)
    {
        // Todoが認証されたユーザーのものかチェック
        if ($todo->user_id !== Auth::id()) {
            return response()->json(['message' => 'アクセス権限がありません。'], 403);
        }

        $request->validate([
            'order' => 'required|array',
            'order.*' => 'integer|exists:todo_details,id',
        ]);

        // 指定されたTodoDetailが全て認証されたユーザーのTodoに属するかチェック
        $todoDetailIds = $request->order;
        $validTodoDetailCount = TodoDetail::whereIn('id', $todoDetailIds)
            ->where('todo_id', $todo->id)
            ->count();

        if ($validTodoDetailCount !== count($todoDetailIds)) {
            return response()->json(['message' => '無効なTodoDetailが含まれています。'], 400);
        }

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