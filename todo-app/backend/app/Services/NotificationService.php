<?php

namespace App\Services;

use App\Models\User;
use App\Models\Event;

/**
 * 通知サービス
 */
class NotificationService
{
    /**
     * リマインダー送信
     *
     * @param \App\Models\User $user
     * @param \App\Models\Event $event
     * @param string $method
     * @return void
     */
    public function send(User $user, Event $event, string $method)
    {
        switch ($method) {
            case 'line':
                $this->sendLineNotification($user, $event);
                break;
            case 'slack':
                $this->sendSlackNotification($user, $event);
                break;
            default:
                // その他の通知方法
                break;
        }
    }

    /**
     * Line通知送信
     *
     * @param \App\Models\User $user
     * @param \App\Models\Event $event
     * @return void
     */
    protected function sendLineNotification(User $user, Event $event)
    {
        // Line APIを使用した通知送信ロジック
        // 例: GuzzleHTTPクライアントを使用してPOSTリクエストを送信
    }

    /**
     * Slack通知送信
     *
     * @param \App\Models\User $user
     * @param \App\Models\Event $event
     * @return void
     */
    protected function sendSlackNotification(User $user, Event $event)
    {
        // Slack APIを使用した通知送信ロジック
        // 例: Webhook URLにメッセージを送信
    }
}