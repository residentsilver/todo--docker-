<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    /**
     * 更新されたTodoアイテムのリストを取得します。
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $todos = Todo::all();
        return response()->json($todos);
    }

    /**
     * 新しいTodoアイテムを作成します。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // バリデーションルールの定義
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        // Todoアイテムの作成
        $todo = Todo::create($validatedData);

        return response()->json($todo, 201);
    }

    /**
     * 指定されたTodoアイテムを表示します。
     *
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function show(Todo $todo)
    {
        return response()->json($todo);
    }

    /**
     * 指定されたTodoアイテムを更新します。
     * 
     * 完了状態を切り替える機能を追加しています。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Todo  $todo
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, Todo $todo)
    {
        // バリデーションルールの定義
        $validatedData = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
        ]);

        // 完了状態を切り替える
        if ($request->has('completed')) {
            $todo->completed = $request->input('completed');
        }

        // その他のフィールドを更新
        if ($request->has('title')) {
            $todo->title = $request->input('title');
        }

        if ($request->has('description')) {
            $todo->description = $request->input('description');
        }

        // 変更を保存
        $todo->save();

        return response()->json($todo);
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