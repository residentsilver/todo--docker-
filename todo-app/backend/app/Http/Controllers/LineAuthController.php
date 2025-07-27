<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\LineToken;
use App\Services\LineMessagingService;

/**
 * LINE認証コントローラー
 */
class LineAuthController extends Controller
{
    /**
     * LINE Loginの認証URLを生成
     */
    public function getAuthUrl(): JsonResponse
    {
        $state = bin2hex(random_bytes(16));
        
        // セッションではなくキャッシュでstateを管理
        cache()->put("line_oauth_state_{$state}", Auth::id(), 600); // 10分間有効
        
        // フロントエンドのコールバックURLを使用
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        $redirectUri = $frontendUrl . '/line-callback';
        
        $params = [
            'response_type' => 'code',
            'client_id' => config('services.line.login_channel_id'),
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => 'profile openid',
        ];
        
        $authUrl = 'https://access.line.me/oauth2/v2.1/authorize?' . http_build_query($params);
        
        return response()->json([
            'status' => 'success',
            'data' => [
                'auth_url' => $authUrl,
                'state' => $state
            ]
        ]);
    }
    
    /**
     * LINE Login コールバック処理
     */
    public function handleCallback(Request $request): JsonResponse
    {
        try {
            $code = $request->get('code');
            $state = $request->get('state');
            
            \Log::info('LINE Callback received', [
                'code' => $code ? substr($code, 0, 10) . '...' : null,
                'state' => $state,
                'all_params' => $request->all()
            ]);
            
            if (!$code || !$state) {
                return response()->json([
                    'status' => 'error',
                    'message' => '認証パラメータが不正です'
                ], 400);
            }
            
            // キャッシュからstateを確認
            $userId = cache()->get("line_oauth_state_{$state}");
            if (!$userId) {
                \Log::error('Invalid state in LINE callback', ['state' => $state]);
                return response()->json([
                    'status' => 'error',
                    'message' => '認証状態が無効です'
                ], 400);
            }
            
            // stateを削除（一度だけ使用）
            cache()->forget("line_oauth_state_{$state}");
            
            // フロントエンドのコールバックURLを使用（認証URLと同じものを使用）
            $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
            $redirectUri = $frontendUrl . '/line-callback';
            
            \Log::info('Requesting LINE token', [
                'redirect_uri' => $redirectUri,
                'client_id' => config('services.line.login_channel_id'),
                'user_id' => $userId
            ]);
            
            // アクセストークンを取得
            $tokenResponse = Http::asForm()->post('https://api.line.me/oauth2/v2.1/token', [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $redirectUri,
                'client_id' => config('services.line.login_channel_id'),
                'client_secret' => config('services.line.login_channel_secret'),
            ]);
            
            if (!$tokenResponse->successful()) {
                $errorBody = $tokenResponse->body();
                \Log::error('LINE token request failed', [
                    'status' => $tokenResponse->status(),
                    'body' => $errorBody
                ]);
                throw new \Exception("トークン取得に失敗しました: {$errorBody}");
            }
            
            $tokenData = $tokenResponse->json();
            \Log::info('LINE token obtained successfully');
            
            // ユーザープロフィールを取得
            $profileResponse = Http::withToken($tokenData['access_token'])
                ->get('https://api.line.me/v2/profile');
            
            if (!$profileResponse->successful()) {
                throw new \Exception('プロフィール取得に失敗しました');
            }
            
            $profile = $profileResponse->json();
            \Log::info('LINE profile obtained', [
                'display_name' => $profile['displayName'],
                'user_id' => $profile['userId']
            ]);
            
            // 指定されたユーザーを取得
            $user = \App\Models\User::find($userId);
            if (!$user) {
                throw new \Exception('ユーザーが見つかりません');
            }
            
            \Log::info('User found', [
                'user_id' => $user->id,
                'user_name' => $user->name
            ]);
            
            // 既存のアクティブなトークンを無効化
            try {
                $deactivatedCount = $user->lineTokens()->update(['is_active' => false]);
                \Log::info('Deactivated existing tokens', ['count' => $deactivatedCount]);
            } catch (\Exception $e) {
                \Log::error('Failed to deactivate existing tokens', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id
                ]);
                // 既存トークンの無効化に失敗しても処理は続行
            }
            
            // 新しいLINEトークンを保存
            try {
                \Log::info('Attempting to save LINE token', [
                    'user_id' => $user->id,
                    'line_user_id' => $profile['userId'],
                    'line_display_name' => $profile['displayName']
                ]);
                
                // 一度モデルを直接作成してみる
                $lineToken = new LineToken();
                $lineToken->user_id = $user->id;
                $lineToken->line_user_id = $profile['userId'];
                $lineToken->access_token = $tokenData['access_token'];
                $lineToken->refresh_token = $tokenData['refresh_token'] ?? null;
                $lineToken->token_expires_at = isset($tokenData['expires_in']) 
                    ? now()->addSeconds($tokenData['expires_in']) 
                    : null;
                $lineToken->line_display_name = $profile['displayName'];
                $lineToken->line_picture_url = $profile['pictureUrl'] ?? null;
                $lineToken->scope = explode(' ', $tokenData['scope'] ?? '');
                $lineToken->is_active = true;
                $lineToken->linked_at = now();
                
                $lineToken->save();
                
                \Log::info('LINE token saved successfully', [
                    'line_token_id' => $lineToken->id,
                    'user_id' => $user->id
                ]);
                
            } catch (\Exception $e) {
                \Log::error('Failed to save LINE token', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'user_id' => $user->id,
                    'line_user_id' => $profile['userId'] ?? null
                ]);
                throw new \Exception('LINE情報の保存に失敗しました: ' . $e->getMessage());
            }
            
            return response()->json([
                'status' => 'success',
                'data' => [
                    'connected' => true,
                    'display_name' => $profile['displayName'],
                    'picture_url' => $profile['pictureUrl'] ?? null,
                    'linked_at' => $lineToken->linked_at,
                ],
                'message' => 'LINE連携が完了しました'
            ]);
            
        } catch (\Exception $e) {
            \Log::error('LINE callback error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'LINE連携に失敗しました: ' . $e->getMessage()
            ], 500);
        }
    }
} 