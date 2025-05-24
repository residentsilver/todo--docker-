<?php

namespace App\Http\Requests\ToDo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;

class RestoreRequest extends FormRequest
{
    /**
     * 認証チェック - ユーザーがログインしており、指定されたTodoにアクセス権限があるかを確認
     *
     * @return bool
     */
    public function authorize(): bool
    {
        // Sanctum認証チェック
        if (!Auth::guard('sanctum')->check()) {
            return false;
        }

        // 削除済みTodoの所有権チェック（restoreTodo用）
        $todoId = $this->route('id');
        if ($todoId) {
            $todo = Todo::onlyTrashed()
                ->where('id', $todoId)
                ->where('user_id', Auth::id())
                ->exists();
            return $todo;
        }

        // TodoDetailの復元の場合（restoreTodoDetail用）
        $todoId = $this->route('todoId');
        if ($todoId) {
            $todo = Todo::where('id', $todoId)
                ->where('user_id', Auth::id())
                ->exists();
            return $todo;
        }

        return true;
    }

    /**
     * バリデーションルールを取得
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }

    /**
     * 認証失敗時のエラーメッセージをカスタマイズ
     *
     * @return void
     */
    protected function failedAuthorization()
    {
        abort(403, '指定されたTodoにアクセスする権限がありません。');
    }
} 