<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UpdateProfileRequest extends FormRequest
{
    /**
     * 認証チェック - プロフィール更新には認証が必要
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
        $user = $this->user();
        
        return [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|required|string|min:8|confirmed',
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
            // 名前のバリデーションメッセージ
            'name.required' => 'ユーザー名を入力してください。',
            'name.string' => 'ユーザー名は文字列で入力してください。',
            'name.max' => 'ユーザー名は255文字以内で入力してください。',
            
            // メールアドレスのバリデーションメッセージ
            'email.required' => 'メールアドレスを入力してください。',
            'email.string' => 'メールアドレスは文字列で入力してください。',
            'email.email' => '有効なメールアドレスを入力してください。',
            'email.max' => 'メールアドレスは255文字以内で入力してください。',
            'email.unique' => 'このメールアドレスは既に使用されています。',
            
            // 現在のパスワードのバリデーションメッセージ
            'current_password.required_with' => 'パスワードを変更する場合は、現在のパスワードを入力してください。',
            'current_password.string' => '現在のパスワードは文字列で入力してください。',
            
            // 新しいパスワードのバリデーションメッセージ
            'password.required' => '新しいパスワードを入力してください。',
            'password.string' => 'パスワードは文字列で入力してください。',
            'password.min' => 'パスワードは8文字以上で入力してください。',
            'password.confirmed' => 'パスワード確認が一致しません。',
        ];
    }

    /**
     * バリデーション後の追加チェック
     *
     * @return void
     * @throws \Illuminate\Validation\ValidationException
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // 現在のパスワードが提供された場合は確認
            if ($this->has('current_password')) {
                $user = $this->user();
                if (!Hash::check($this->current_password, $user->password)) {
                    $validator->errors()->add('current_password', '現在のパスワードが正しくありません。');
                }
            }
        });
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