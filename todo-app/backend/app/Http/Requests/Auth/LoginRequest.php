<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * 認証チェック - ログインは誰でも可能
     *
     * @return bool
     */
    public function authorize(): bool
    {
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
            'login' => 'required|string',
            'password' => 'required|string',
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
            'login.required' => 'メールアドレスまたはユーザー名を入力してください。',
            'login.string' => 'メールアドレスまたはユーザー名は文字列で入力してください。',
            'password.required' => 'パスワードを入力してください。',
            'password.string' => 'パスワードは文字列で入力してください。',
        ];
    }
} 