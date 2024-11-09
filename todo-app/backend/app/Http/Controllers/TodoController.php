<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use App\Models\TodoDetail;
use Illuminate\Http\Request;
use App\Http\Requests\ToDo\StoreRequest;
use App\Http\Requests\ToDoDetails\StoreRequest as TodoDetailStoreRequest;

class TodoController extends Controller
{
    /**
     * Todoアイテムの一覧を取得します。
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $todos = Todo::with(['todoDetails' => function($query) {
            $query->orderBy('order');
        }])->get();
        return response()->json($todos);
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
}