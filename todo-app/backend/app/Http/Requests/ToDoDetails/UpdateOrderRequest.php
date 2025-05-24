<?php

namespace App\Http\Requests\ToDoDetails;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;
use App\Models\TodoDetail;

class UpdateOrderRequest extends FormRequest
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

        // 指定されたTodoDetailが全て認証されたユーザーのTodoに属するかチェック
        if ($this->has('order') && is_array($this->order)) {
            $todoDetailIds = $this->order;
            $validTodoDetailCount = TodoDetail::whereIn('id', $todoDetailIds)
                ->whereHas('todo', function ($query) {
                    $query->where('user_id', Auth::id());
                })
                ->count();

            return $validTodoDetailCount === count($todoDetailIds);
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
            'order' => 'required|array|min:1',
            'order.*' => 'integer|exists:todo_details,id',
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
            'order.required' => '順序配列は必須です。',
            'order.array' => '順序は配列形式で指定してください。',
            'order.min' => '最低1つのTodoDetailを指定してください。',
            'order.*.integer' => '順序の各要素は整数である必要があります。',
            'order.*.exists' => '指定されたTodoDetailが存在しません。',
        ];
    }

    /**
     * 認証失敗時のエラーメッセージをカスタマイズ
     *
     * @return void
     */
    protected function failedAuthorization()
    {
        abort(403, '指定されたTodoまたはTodoDetailにアクセスする権限がありません。');
    }
} 