<?php

namespace App\Http\Requests\ToDo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;

class UpdateRequest extends FormRequest
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

        // ルートパラメータからTodoを取得
        $todo = $this->route('todo');
        if ($todo && $todo->user_id !== Auth::id()) {
            return false;
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
            'title' => 'sometimes|required|string|max:255',
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
            'title.required' => 'タイトルは必須です。',
            'title.string' => 'タイトルは文字列である必要があります。',
            'title.max' => 'タイトルは255文字以内で入力してください。',
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