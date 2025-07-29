<?php

namespace App\Http\Requests\ToDo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class IndexRequest extends FormRequest
{
    /**
     * 認証チェック - ユーザーがログインしているかを確認
     *
     * @return bool
     */
    public function authorize(): bool
    {
        // Sanctumミドルウェアで既に認証されているため、デフォルトガードを使用
        return Auth::check();
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
        abort(401, '認証が必要です。');
    }
} 