<?php

namespace App\Http\Requests\ToDoDetails;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\TodoDetail;

class BaseRequest extends FormRequest
{
    /**
     * 認証チェック - ユーザーがログインしており、指定されたTodoDetailにアクセス権限があるかを確認
     *
     * @return bool
     */
    public function authorize(): bool
    {
        // Sanctum認証チェック
        if (!Auth::guard('sanctum')->check()) {
            return false;
        }

        // 特定のTodoDetailに対する操作の場合、アクセス権限をチェック
        $todoDetailId = $this->route('id') ?? $this->route('todoDetail');
        if ($todoDetailId) {
            $todoDetail = TodoDetail::whereHas('todo', function ($query) {
                $query->where('user_id', Auth::id());
            })->find($todoDetailId);
            
            return $todoDetail !== null;
        }

        return true;
    }

    /**
     * バリデーションルールを取得（基本的には空）
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
        abort(403, '指定されたTodoDetailにアクセスする権限がありません。');
    }
} 