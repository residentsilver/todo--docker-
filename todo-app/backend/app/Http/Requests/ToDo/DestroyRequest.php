<?php

namespace App\Http\Requests\ToDo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;

class DestroyRequest extends FormRequest
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