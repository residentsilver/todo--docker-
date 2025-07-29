<?php

namespace App\Http\Requests\ToDo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use App\Models\Todo;

class UpdateOrderRequest extends FormRequest
{
    /**
     * 認証チェック - ユーザーがログインしており、指定されたTodoが全て認証ユーザーのものかを確認
     *
     * @return bool
     */
    public function authorize(): bool
    {
        // Sanctum認証チェック
        if (!Auth::guard('sanctum')->check()) {
            return false;
        }

        // 指定されたTodoが全て認証されたユーザーのものかチェック
        if ($this->has('todos') && is_array($this->todos)) {
            $todoIds = collect($this->todos)->pluck('id')->toArray();
            $validTodoCount = Todo::whereIn('id', $todoIds)
                ->where('user_id', Auth::id())
                ->count();

            return $validTodoCount === count($todoIds);
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
            'todos' => 'required|array|min:1',
            'todos.*.id' => 'required|integer|exists:todos,id',
            'todos.*.order' => 'required|integer|min:0',
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
            'todos.required' => 'Todo配列は必須です。',
            'todos.array' => 'Todoは配列形式で指定してください。',
            'todos.min' => '最低1つのTodoを指定してください。',
            'todos.*.id.required' => 'Todo IDは必須です。',
            'todos.*.id.integer' => 'Todo IDは整数である必要があります。',
            'todos.*.id.exists' => '指定されたTodoが存在しません。',
            'todos.*.order.required' => '順序は必須です。',
            'todos.*.order.integer' => '順序は整数である必要があります。',
            'todos.*.order.min' => '順序は0以上である必要があります。',
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