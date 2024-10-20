<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * 認証コントローラー
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
            'email' => 'required|string|email|max:unique:users',
            'password' => 'required|string|min:8|confirmed',
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
        // バリデーション
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // ユーザー確認
        $user = User::where('email', $request->email)->first();

        // パスワード確認
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['認証情報が一致しません。'],
            ]);
        }

        // トークン生成
        $token = $user->createToken('auth_token')->plainTextToken;

        // レスポンス返却
        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
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
}