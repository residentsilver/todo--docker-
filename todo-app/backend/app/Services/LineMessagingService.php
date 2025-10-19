<?php

namespace App\Services;

use App\Models\LineToken;
use App\Models\ReminderHistory;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * LINE Messaging APIサービス
 * LINEメッセージの送信とトークン管理を行う
 */
class LineMessagingService
{
    /**
     * LINE Messaging APIのベースURL
     */
    private const LINE_API_BASE_URL = 'https://api.line.me/v2/bot';

    /**
     * LINE Messaging APIのチャンネルアクセストークン
     */
    private ?string $channelAccessToken;

    /**
     * コンストラクタ
     */
    public function __construct()
    {
        $this->channelAccessToken = config('services.line.channel_access_token');
    }

    /**
     * リマインドメッセージを送信
     * 
     * @param ReminderHistory $reminderHistory
     * @param bool $isTest テスト送信かどうか
     * @return bool
     */
    public function sendReminderMessage(ReminderHistory $reminderHistory, bool $isTest = false): bool
    {
        try {
            $subscription = $reminderHistory->subscription;
            $user = $reminderHistory->user;
            
            // ユーザーのアクティブなLINEトークンを取得
            $lineToken = $user->activeLineToken;
            if (!$lineToken || !$lineToken->is_valid) {
                Log::warning('有効なLINEトークンが見つかりません', [
                    'user_id' => $user->id,
                    'reminder_history_id' => $reminderHistory->id
                ]);
                return false;
            }

            // メッセージ内容を生成
            $message = $this->generateReminderMessage($subscription, $reminderHistory->days_before);
            
            // テスト送信の場合はメッセージにプレフィックスを追加
            if ($isTest) {
                $message = "【テスト送信】\n" . $message;
            }
            
            // LINEメッセージを送信
            $response = $this->sendMessage($lineToken->line_user_id, $message);
            
            if ($response['success']) {
                // 送信成功時の処理
                $reminderHistory->update([
                    'status' => $isTest ? 'test' : 'sent',  // テスト送信の場合は'test'
                    'sent_at' => Carbon::now(),
                    'scheduled_at' => Carbon::now(),
                    'message' => $message,
                    'line_message_id' => $response['message_id'] ?? null,
                ]);
                
                // LINEトークンの最終利用日時を更新
                $lineToken->updateLastUsed();
                
                Log::info('リマインドメッセージを送信しました', [
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'reminder_history_id' => $reminderHistory->id,
                    'days_before' => $reminderHistory->days_before,
                    'is_test' => $isTest
                ]);
                
                return true;
            } else {
                // 送信失敗時の処理
                $reminderHistory->update([
                    'status' => 'failed',
                    'error_message' => $response['error'] ?? 'メッセージ送信に失敗しました',
                ]);
                
                Log::error('リマインドメッセージの送信に失敗しました', [
                    'user_id' => $user->id,
                    'subscription_id' => $subscription->id,
                    'reminder_history_id' => $reminderHistory->id,
                    'error' => $response['error'] ?? 'Unknown error'
                ]);
                
                return false;
            }
            
        } catch (\Exception $e) {
            Log::error('リマインドメッセージ送信中にエラーが発生しました', [
                'reminder_history_id' => $reminderHistory->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $reminderHistory->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * LINEメッセージを送信
     * 
     * @param string $lineUserId
     * @param string $message
     * @return array
     */
    private function sendMessage(string $lineUserId, string $message): array
    {
        try {
            // チャンネルアクセストークンが設定されていない場合
            if (!$this->channelAccessToken) {
                return [
                    'success' => false,
                    'error' => 'LINE Channel Access Token is not configured',
                ];
            }

            // HTTP設定を取得
            $httpOptions = config('services.line.http_options', []);
            
            $response = Http::withOptions($httpOptions)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->channelAccessToken,
                    'Content-Type' => 'application/json',
                ])
                ->post(self::LINE_API_BASE_URL . '/message/push', [
                    'to' => $lineUserId,
                    'messages' => [
                        [
                            'type' => 'text',
                            'text' => $message,
                        ]
                    ]
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message_id' => $response->header('X-Line-Request-Id'),
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'HTTP ' . $response->status() . ': ' . $response->body(),
                ];
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * リマインドメッセージを生成
     * 
     * @param Subscription $subscription
     * @param int $daysBefore
     * @return string
     */
    private function generateReminderMessage(Subscription $subscription, int $daysBefore): string
    {
        // カスタムメッセージがある場合はそれを使用
        if ($subscription->custom_message) {
            return $this->replaceMessagePlaceholders($subscription->custom_message, $subscription, $daysBefore);
        }

        // デフォルトメッセージを生成
        $endDate = $subscription->end_date->format('Y年m月d日');
        $serviceName = $subscription->service_name;
        $amount = number_format($subscription->amount);
        
        $message = "🔔 サブスクリプション終了のお知らせ\n\n";
        $message .= "サービス名: {$serviceName}\n";
        $message .= "終了日: {$endDate}\n";
        $message .= "金額: ¥{$amount}\n";
        $message .= "残り: {$daysBefore}日\n\n";
        
        if ($subscription->url) {
            $message .= "解約・更新はこちら:\n{$subscription->url}\n\n";
        }
        
        $message .= "必要に応じて解約手続きを行ってください。";
        
        return $message;
    }

    /**
     * メッセージ内のプレースホルダーを置換
     * 
     * @param string $message
     * @param Subscription $subscription
     * @param int $daysBefore
     * @return string
     */
    private function replaceMessagePlaceholders(string $message, Subscription $subscription, int $daysBefore): string
    {
        $placeholders = [
            '{service_name}' => $subscription->service_name,
            '{end_date}' => $subscription->end_date->format('Y年m月d日'),
            '{amount}' => number_format($subscription->amount),
            '{days_before}' => $daysBefore,
            '{url}' => $subscription->url ?? '',
            '{contract_type}' => $subscription->contract_type_name,
        ];

        return str_replace(array_keys($placeholders), array_values($placeholders), $message);
    }

    /**
     * LINEユーザープロフィールを取得
     * 
     * @param string $lineUserId
     * @return array|null
     */
    public function getUserProfile(string $lineUserId): ?array
    {
        try {
            // チャンネルアクセストークンが設定されていない場合
            if (!$this->channelAccessToken) {
                Log::error('LINE Channel Access Token is not configured');
                return null;
            }

            // HTTP設定を取得
            $httpOptions = config('services.line.http_options', []);

            $response = Http::withOptions($httpOptions)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->channelAccessToken,
                ])
                ->get(self::LINE_API_BASE_URL . '/profile/' . $lineUserId);

            if ($response->successful()) {
                return $response->json();
            }
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('LINEユーザープロフィールの取得に失敗しました', [
                'line_user_id' => $lineUserId,
                'error' => $e->getMessage()
            ]);
            
            return null;
        }
    }

    /**
     * メッセージプレビューを生成
     * 
     * @param Subscription $subscription
     * @param int $daysBefore
     * @return string
     */
    public function generateMessagePreview(Subscription $subscription, int $daysBefore): string
    {
        return $this->generateReminderMessage($subscription, $daysBefore);
    }

    /**
     * LINE連携の検証
     * 
     * @param string $lineUserId
     * @return bool
     */
    public function validateLineConnection(string $lineUserId): bool
    {
        $profile = $this->getUserProfile($lineUserId);
        return $profile !== null;
    }
} 