<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use App\Models\TodoDetail;
use Illuminate\Http\Request;
use App\Http\Requests\ToDo\IndexRequest;
use App\Http\Requests\ToDo\StoreRequest;
use App\Http\Requests\ToDo\ShowRequest;
use App\Http\Requests\ToDo\UpdateRequest;
use App\Http\Requests\ToDo\DestroyRequest;
use App\Http\Requests\ToDo\UpdateOrderRequest;
use App\Http\Requests\ToDo\RestoreRequest;
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
     * @param  \App\Http\Requests\ToDo\IndexRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function index(IndexRequest $request)
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
     * @param  \App\Http\Requests\ToDo\IndexRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function getDeletedTodos(IndexRequest $request)
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
     * @param  \App\Http\Requests\ToDo\RestoreRequest  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function restoreTodo(RestoreRequest $request, $id)
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
     * @param  \App\Http\Requests\ToDo\RestoreRequest  $request
     * @param  int  $todoId
     * @param  int  $detailId
     * @return \Illuminate\Http\Response
     */
    public function restoreTodoDetail(RestoreRequest $request, $todoId, $detailId)
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
     * @param  \App\Http\Requests\ToDo\ShowRequest  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function show(ShowRequest $request, Todo $todo)
    {
        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 認証されたユーザーの指定されたTodoアイテムを更新します。
     *
     * @param  \App\Http\Requests\ToDo\UpdateRequest  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function update(UpdateRequest $request, Todo $todo)
    {
        // Todoの更新
        $validatedData = $request->validated();
        $todo->update($validatedData);

        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 認証されたユーザーの指定されたTodoアイテムを削除します。
     *
     * @param  \App\Http\Requests\ToDo\DestroyRequest  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function destroy(DestroyRequest $request, Todo $todo)
    {
        $todo->delete();
        return response()->json(null, 204);
    }

    /**
     * 認証されたユーザーのTodoアイテムの順序を更新します。
     *
     * @param  \App\Http\Requests\ToDo\UpdateOrderRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function updateOrder(UpdateOrderRequest $request)
    {
        $validatedData = $request->validated();
        $userId = $request->user()->id;

        foreach ($validatedData['todos'] as $todoData) {
            // ユーザーの所有権を確認してから更新（Form Requestで既にチェック済み）
            Todo::where('id', $todoData['id'])
                ->where('user_id', $userId)
                ->update(['order' => $todoData['order']]);
        }

        return response()->json(['message' => 'Todo順序が正常に更新されました。']);
    }

    /**
     * 認証されたユーザーの削除されたTodoアイテムを完全に削除（ハードデリート）します。
     *
     * @param  \App\Http\Requests\ToDo\RestoreRequest  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function forceDeleteTodo(RestoreRequest $request, $id)
    {
        try {
            $todo = Todo::onlyTrashed()
                ->where('user_id', $request->user()->id)
                ->findOrFail($id);
            
            // 関連するTodoDetailも完全に削除
            $todo->todoDetails()->withTrashed()->forceDelete();
            
            // Todoを完全に削除
            $todo->forceDelete();

            return response()->json([
                'success' => true,
                'message' => 'Todoアイテムが完全に削除されました。'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Todoアイテムの完全削除に失敗しました。',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 認証されたユーザーの削除されたTodoDetailを完全に削除（ハードデリート）します。
     *
     * @param  \App\Http\Requests\ToDo\RestoreRequest  $request
     * @param  int  $todoId
     * @param  int  $detailId
     * @return \Illuminate\Http\Response
     */
    public function forceDeleteTodoDetail(RestoreRequest $request, $todoId, $detailId)
    {
        try {
            $todo = Todo::where('user_id', $request->user()->id)->findOrFail($todoId);
            $todoDetail = $todo->todoDetails()->onlyTrashed()->findOrFail($detailId);
            
            // TodoDetailを完全に削除
            $todoDetail->forceDelete();

            return response()->json([
                'success' => true,
                'message' => 'Todo詳細が完全に削除されました。'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Todo詳細の完全削除に失敗しました。',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}