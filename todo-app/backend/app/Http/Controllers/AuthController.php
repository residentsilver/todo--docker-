<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\LogoutRequest;
use App\Http\Requests\Auth\MeRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;

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
     * @param  \App\Http\Requests\Auth\RegisterRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function register(RegisterRequest $request)
    {
        $validatedData = $request->validated();

        // ユーザー作成
        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
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
     * @param  \App\Http\Requests\Auth\LoginRequest  $request
     * @return \Illuminate\Http\Response
     * @throws \Illuminate\Validation\ValidationException
     */
    public function login(LoginRequest $request)
    {
        $validatedData = $request->validated();

        // ログイン識別子（メールアドレスまたはユーザー名）
        $loginField = $validatedData['login'];
        
        // メールアドレス形式かどうかを判定
        $isEmail = filter_var($loginField, FILTER_VALIDATE_EMAIL);
        
        // ユーザー検索（メールアドレスまたはユーザー名で検索）
        if ($isEmail) {
            $user = User::where('email', $loginField)->first();
        } else {
            $user = User::where('name', $loginField)->first();
        }

        // パスワード確認
        if (! $user || ! Hash::check($validatedData['password'], $user->password)) {
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
     * @param  \App\Http\Requests\Auth\LogoutRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function logout(LogoutRequest $request)
    {
        // トークンの削除
        $request->user()->currentAccessToken()->delete();

        // レスポンス返却
        return response()->json(['message' => 'ログアウトしました。']);
    }

    /**
     * 認証済みユーザー情報取得
     *
     * @param  \App\Http\Requests\Auth\MeRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function me(MeRequest $request)
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
     * @param  \App\Http\Requests\Auth\UpdateProfileRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $validatedData = $request->validated();

        // プロフィール情報を更新
        $updateData = [];
        
        if (isset($validatedData['name'])) {
            $updateData['name'] = $validatedData['name'];
        }
        
        if (isset($validatedData['email'])) {
            $updateData['email'] = $validatedData['email'];
        }
        
        if (isset($validatedData['password'])) {
            $updateData['password'] = Hash::make($validatedData['password']);
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