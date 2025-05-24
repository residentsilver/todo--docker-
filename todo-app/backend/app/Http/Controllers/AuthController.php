<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * 認証コントローラー
 * 
 * @description ユーザー認証機能（登録、ログイン、ログアウト）を提供
 */
class AuthController extends Controller
{
    /**
     * ユーザー登録
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function register(Request $request)
    {
        // バリデーション
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ], [
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
            
            // パスワードのバリデーションメッセージ
            'password.required' => 'パスワードを入力してください。',
            'password.string' => 'パスワードは文字列で入力してください。',
            'password.min' => 'パスワードは8文字以上で入力してください。',
            'password.confirmed' => 'パスワード確認が一致しません。',
        ]);

        // ユーザー作成
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // トークン生成
        $token = $user->createToken('auth_token')->plainTextToken;

        // レスポンス返却
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }

    /**
     * ユーザーログイン
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(Request $request)
    {
        // バリデーション（メールアドレスまたはユーザー名を受け付ける）
        $request->validate([
            'login' => 'required|string', // emailからloginに変更
            'password' => 'required|string',
        ], [
            'login.required' => 'メールアドレスまたはユーザー名を入力してください。',
            'password.required' => 'パスワードを入力してください。',
        ]);

        // ログイン識別子（メールアドレスまたはユーザー名）
        $loginField = $request->login;
        
        // メールアドレス形式かどうかを判定
        $isEmail = filter_var($loginField, FILTER_VALIDATE_EMAIL);
        
        // ユーザー検索（メールアドレスまたはユーザー名で検索）
        if ($isEmail) {
            $user = User::where('email', $loginField)->first();
        } else {
            $user = User::where('name', $loginField)->first();
        }

        // パスワード確認
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['認証情報が一致しません。メールアドレス（またはユーザー名）とパスワードを確認してください。'],
            ]);
        }

        // トークン生成
        $token = $user->createToken('auth_token')->plainTextToken;

        // レスポンス返却
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * ユーザーログアウト
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function logout(Request $request)
    {
        // トークンの削除
        $request->user()->currentAccessToken()->delete();

        // レスポンス返却
        return response()->json(['message' => 'ログアウトしました。']);
    }

    /**
     * 認証済みユーザー情報取得
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => '認証が必要です。',
                    'error' => 'Unauthenticated'
                ], 401);
            }
            
            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => '認証エラーが発生しました。',
                'error' => $e->getMessage()
            ], 401);
        }
    }

    /**
     * プロフィール更新
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // バリデーション
        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|required|string|min:8|confirmed',
        ], [
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
        ]);

        // 現在のパスワードが提供された場合は確認
        if ($request->has('current_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['現在のパスワードが正しくありません。'],
                ]);
            }
        }

        // プロフィール情報を更新
        $updateData = [];
        
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }
        
        if ($request->has('email')) {
            $updateData['email'] = $request->email;
        }
        
        if ($request->has('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        // 更新されたユーザー情報を返却
        return response()->json([
            'message' => 'プロフィールが正常に更新されました。',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }
}