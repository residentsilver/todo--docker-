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
 * @author システム開発者
 * @version 1.2
 */
class TodoController extends Controller
{
    /**
     * Todoアイテムの一覧を取得します。
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $todos = Todo::ordered()->with(['todoDetails' => function($query) {
            $query->orderBy('order');
        }])->get();
        return response()->json($todos);
    }

    /**
     * 削除されたTodoアイテムとその詳細を取得します。
     *
     * @return \Illuminate\Http\Response
     */
    public function getDeletedTodos()
    {
        try {
            // ソフトデリートされたTodoを取得（TodoDetailも含む）
            $deletedTodos = Todo::onlyTrashed()
                ->with(['todoDetails' => function($query) {
                    $query->withTrashed()->orderBy('order');
                }])
                ->orderBy('deleted_at', 'desc')
                ->get();

            // 2. 削除されていないTodoで、削除されたTodoDetailを持つものを取得
            $todosWithDeletedDetails = Todo::whereHas('todoDetails', function($query) {
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
     * 削除されたTodoアイテムを復元します。
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function restoreTodo($id)
    {
        try {
            $todo = Todo::onlyTrashed()->findOrFail($id);
            
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
     * 削除されたTodoアイテムを復元します。
     *
     * @param  int  $todoId
     * @param  int  $detailId
     * @return \Illuminate\Http\Response
     */
    public function restoreTodoDetail($todoId, $detailId)
    {
        try {
            $todo = Todo::findOrFail($todoId);
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
     * 新しいTodoアイテムを作成します。
     *
     * @param  \App\Http\Requests\ToDo\StoreRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(StoreRequest $request)
    {
        // Todoアイテムの作成
        $validatedData = $request->validated();
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
     * 指定されたTodoアイテムを表示します。
     *
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function show(Todo $todo)
    {
        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 指定されたTodoアイテムを更新します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Todo $todo)
    {
        // Todoの更新
        $validatedData = $request->validate([
            'title' => 'sometimes|required|string|max:255',
        ]);

        $todo->update($validatedData);

        // Todo詳細の更新
        if ($request->has('description') || $request->has('completed')) {
            $detail = $todo->todoDetails()->firstOrCreate([]);
            if ($request->has('description')) {
                $detail->description = $request->input('description');
            }
            if ($request->has('completed')) {
                $detail->completed = $request->input('completed');
            }
            $detail->save();
        }

        return response()->json($todo->load('todoDetails'));
    }

    /**
     * 指定されたTodoアイテムを削除します。
     *
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function destroy(Todo $todo)
    {
        $todo->delete();
        return response()->json(null, 204);
    }

    /**
     * Todoアイテムの順序を更新します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateOrder(Request $request)
    {
        try {
            // リクエストデータをログに記録
            \Log::info('Todo順序更新リクエスト開始', [
                'request_data' => $request->all(),
                'content_type' => $request->header('Content-Type'),
                'method' => $request->method()
            ]);

            // フロントエンドからの形式に対応（orderまたはtodos）
            $requestData = $request->all();
            $todosData = [];

            if (isset($requestData['order']) && is_array($requestData['order'])) {
                // フロントエンドから order: [id1, id2, id3] 形式で送信された場合
                \Log::info('order形式のデータを検出', ['order' => $requestData['order']]);
                
                foreach ($requestData['order'] as $index => $todoId) {
                    $todosData[] = [
                        'id' => $todoId,
                        'order' => $index + 1
                    ];
                }
            } elseif (isset($requestData['todos']) && is_array($requestData['todos'])) {
                // todos: [{id: 1, order: 1}, {id: 2, order: 2}] 形式の場合
                \Log::info('todos形式のデータを検出', ['todos' => $requestData['todos']]);
                $todosData = $requestData['todos'];
            } else {
                \Log::error('無効なリクエスト形式', ['request_data' => $requestData]);
                return response()->json([
                    'success' => false,
                    'message' => '無効なリクエスト形式です。orderまたはtodosが必要です。',
                    'received_data' => $requestData
                ], 422);
            }

            \Log::info('変換後のTodoデータ', ['todos_data' => $todosData]);

            // バリデーション
            $validatedData = validator(['todos' => $todosData], [
                'todos' => 'required|array',
                'todos.*.id' => 'required|integer|exists:todos,id',
                'todos.*.order' => 'required|integer|min:1',
            ])->validate();

            \Log::info('バリデーション成功', ['validated_data' => $validatedData]);

            // トランザクション内で順序を更新
            \DB::transaction(function () use ($validatedData) {
                foreach ($validatedData['todos'] as $todoData) {
                    \Log::info('Todo順序更新中', [
                        'todo_id' => $todoData['id'],
                        'new_order' => $todoData['order']
                    ]);
                    
                    $updated = Todo::where('id', $todoData['id'])
                        ->update(['order' => $todoData['order']]);
                    
                    \Log::info('Todo順序更新結果', [
                        'todo_id' => $todoData['id'],
                        'updated_rows' => $updated
                    ]);
                }
            });

            // 更新後のTodoリストを取得
            $todos = Todo::ordered()->with(['todoDetails' => function($query) {
                $query->orderBy('order');
            }])->get();

            \Log::info('Todo順序更新完了', [
                'updated_todos_count' => $todos->count(),
                'final_order' => $todos->pluck('order', 'id')->toArray()
            ]);

            return response()->json([
                'success' => true,
                'data' => $todos,
                'message' => 'Todoの順序が正常に更新されました。'
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Todo順序更新バリデーションエラー', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'バリデーションエラーが発生しました。',
                'errors' => $e->errors(),
                'received_data' => $request->all()
            ], 422);

        } catch (\Exception $e) {
            \Log::error('Todo順序更新エラー', [
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Todoの順序更新に失敗しました。',
                'error' => $e->getMessage(),
                'received_data' => $request->all()
            ], 500);
        }
    }
}