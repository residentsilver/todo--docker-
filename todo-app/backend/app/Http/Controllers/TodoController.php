<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use App\Models\TodoDetail;
use Illuminate\Http\Request;
use App\Http\Requests\ToDo\StoreRequest;
use App\Http\Requests\ToDoDetails\StoreRequest as TodoDetailStoreRequest;

/**
 * TodoControllerクラス
 * 
 * @description Todoアイテムの管理を行うコントローラー
 *              作成、読み取り、更新、削除、削除済みアイテム取得機能を提供
 *              ユーザー認証に対応し、ログインユーザーのTodoのみを操作
 */
class TodoController extends Controller
{
    /**
     * 認証されたユーザーのTodoアイテムの一覧を取得します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $todos = Todo::forUser($request->user()->id)
            ->ordered()
            ->with(['todoDetails' => function($query) {
                $query->orderBy('order');
            }])
            ->get();
        return response()->json($todos);
    }

    /**
     * 認証されたユーザーの削除されたTodoアイテムとその詳細を取得します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getDeletedTodos(Request $request)
    {
        try {
            $userId = $request->user()->id;

            // ソフトデリートされたTodoを取得（TodoDetailも含む）
            $deletedTodos = Todo::onlyTrashed()
                ->where('user_id', $userId)
                ->with(['todoDetails' => function($query) {
                    $query->withTrashed()->orderBy('order');
                }])
                ->orderBy('deleted_at', 'desc')
                ->get();

            // 2. 削除されていないTodoで、削除されたTodoDetailを持つものを取得
            $todosWithDeletedDetails = Todo::where('user_id', $userId)
                ->whereHas('todoDetails', function($query) {
                    $query->onlyTrashed();
                })
                ->with(['todoDetails' => function($query) {
                    $query->withTrashed()->orderBy('order');
                }])
                ->get();

            // 結果をマージして、削除状態を明確にする
            $result = [
                'deleted_todos' => $deletedTodos->map(function($todo) {
                    $todo->deletion_type = 'todo_deleted';
                    return $todo;
                }),
                'todos_with_deleted_details' => $todosWithDeletedDetails->map(function($todo) {
                    $todo->deletion_type = 'details_deleted';
                    // 削除されたTodoDetailのみを残す
                    $todo->deleted_todo_details = $todo->todoDetails->filter(function($detail) {
                        return $detail->deleted_at !== null;
                    })->values();
                    // 通常のTodoDetailは削除されていないもののみ
                    $todo->todoDetails = $todo->todoDetails->filter(function($detail) {
                        return $detail->deleted_at === null;
                    })->values();
                    return $todo;
                })
            ];

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => '削除されたTodoアイテムを正常に取得しました。'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => '削除されたTodoアイテムの取得に失敗しました。',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 認証されたユーザーの削除されたTodoアイテムを復元します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function restoreTodo(Request $request, $id)
    {
        try {
            $todo = Todo::onlyTrashed()
                ->where('user_id', $request->user()->id)
                ->findOrFail($id);
            
            // Todoを復元
            $todo->restore();
            
            // 関連するTodoDetailも復元
            $todo->todoDetails()->onlyTrashed()->restore();

            return response()->json([
                'success' => true,
                'data' => $todo->load('todoDetails'),
                'message' => 'Todoアイテムが正常に復元されました。'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Todoアイテムの復元に失敗しました。',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 認証されたユーザーの削除されたTodoDetailを復元します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $todoId
     * @param  int  $detailId
     * @return \Illuminate\Http\Response
     */
    public function restoreTodoDetail(Request $request, $todoId, $detailId)
    {
        try {
            $todo = Todo::where('user_id', $request->user()->id)->findOrFail($todoId);
            $todoDetail = $todo->todoDetails()->onlyTrashed()->findOrFail($detailId);
            
            // TodoDetailを復元
            $todoDetail->restore();

            return response()->json([
                'success' => true,
                'data' => $todo->load('todoDetails'),
                'message' => 'Todo詳細が正常に復元されました。'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Todo詳細の復元に失敗しました。',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 認証されたユーザーの新しいTodoアイテムを作成します。
     *
     * @param  \App\Http\Requests\ToDo\StoreRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreRequest $request)
    {
        // Todoアイテムの作成（ユーザーIDを自動設定）
        $validatedData = $request->validated();
        $validatedData['user_id'] = $request->user()->id;
        
        $todo = Todo::create($validatedData);
        $maxOrder = $todo->todoDetails()->max('order') ?? 0;

        // Todo詳細の作成
        $todo->todoDetails()->create([
            'description' => $request->input('description'),
            'completed' => false,
            'order' => $maxOrder + 1,
        ]);

        return response()->json($todo->load('todoDetails'), 201);
    }

    /**
     * 認証されたユーザーの指定されたTodoアイテムを表示します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, Todo $todo)
    {
        // ユーザーの所有権を確認
        if ($todo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'アクセス権限がありません。'], 403);
        }

        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 認証されたユーザーの指定されたTodoアイテムを更新します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Todo $todo)
    {
        // ユーザーの所有権を確認
        if ($todo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'アクセス権限がありません。'], 403);
        }

        // Todoの更新
        $todo->update($request->only(['title']));

        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 認証されたユーザーの指定されたTodoアイテムを削除します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Todo $todo)
    {
        // ユーザーの所有権を確認
        if ($todo->user_id !== $request->user()->id) {
            return response()->json(['message' => 'アクセス権限がありません。'], 403);
        }

        $todo->delete();
        return response()->json(null, 204);
    }

    /**
     * 認証されたユーザーのTodoアイテムの順序を更新します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateOrder(Request $request)
    {
        $request->validate([
            'todos' => 'required|array',
            'todos.*.id' => 'required|integer|exists:todos,id',
            'todos.*.order' => 'required|integer',
        ]);

        $userId = $request->user()->id;

        foreach ($request->todos as $todoData) {
            // ユーザーの所有権を確認してから更新
            Todo::where('id', $todoData['id'])
                ->where('user_id', $userId)
                ->update(['order' => $todoData['order']]);
        }

        return response()->json(['message' => 'Todo順序が正常に更新されました。']);
    }
}