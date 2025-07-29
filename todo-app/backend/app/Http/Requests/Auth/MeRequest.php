<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class MeRequest extends FormRequest
{
    /**
     * 認証チェック - ユーザー情報取得には認証が必要
     *
     * @return bool
     */
    public function authorize(): bool
    {
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