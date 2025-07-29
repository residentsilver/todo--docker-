<?php

namespace App\Http\Requests\ToDoDetails;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;

class StoreRequest extends FormRequest
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

        // todo_idが指定されている場合、そのTodoが認証されたユーザーのものかチェック
        if ($this->has('todo_id')) {
            $todo = Todo::where('id', $this->todo_id)
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
        return [
            'todo_id' => 'required|exists:todos,id',
            'description' => 'nullable|string|max:1000',
            'completed' => 'boolean',
        ];
    }

    /**
     * カスタムエラーメッセージを定義
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'todo_id.required' => 'Todo IDは必須です。',
            'todo_id.exists' => '指定されたTodoが存在しません。',
            'description.string' => '説明は文字列である必要があります。',
            'description.max' => '説明は1000文字以内で入力してください。',
            'completed.boolean' => '完了状態はtrue/falseで指定してください。',
        ];
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
