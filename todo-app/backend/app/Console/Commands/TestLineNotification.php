<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\LineToken;
use App\Services\LineMessagingService;

/**
 * LINE通知テストコマンド
 */
class TestLineNotification extends Command
{
    /**
     * コマンド名
     */
    protected $signature = 'line:test-notification 
                            {--user-id= : テスト対象のユーザーID}
                            {--message= : 送信するテストメッセージ}
                            {--line-user-id= : 直接LINE User IDを指定}';

    /**
     * コマンドの説明
     */
    protected $description = 'LINE通知のテスト送信を行います';

    /**
     * LINE Messaging Service
     */
    protected LineMessagingService $lineService;

    /**
     * コンストラクタ
     */
    public function __construct(LineMessagingService $lineService)
    {
        parent::__construct();
        $this->lineService = $lineService;
    }

    /**
     * コマンド実行
     */
    public function handle()
    {
        $this->info('🚀 LINE通知テストを開始します...');
        $this->newLine();

        // 設定確認
        if (!$this->checkConfiguration()) {
            return 1;
        }

        // テスト方法を選択
        $testMethod = $this->choice(
            'テスト方法を選択してください',
            [
                'user' => 'ユーザーIDを指定してテスト',
                'direct' => 'LINE User IDを直接指定してテスト',
                'list' => '連携済みユーザー一覧を表示'
            ],
            'user'
        );

        switch ($testMethod) {
            case 'user':
                return $this->testByUserId();
            case 'direct':
                return $this->testByLineUserId();
            case 'list':
                return $this->listConnectedUsers();
            default:
                $this->error('無効な選択です');
                return 1;
        }
    }

    /**
     * 設定確認
     */
    private function checkConfiguration(): bool
    {
        $this->info('📋 設定確認中...');

        $channelAccessToken = config('services.line.channel_access_token');
        $channelSecret = config('services.line.channel_secret');

        if (!$channelAccessToken) {
            $this->error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
            return false;
        }

        if (!$channelSecret) {
            $this->error('❌ LINE_CHANNEL_SECRET が設定されていません');
            return false;
        }

        $this->info('✅ LINE設定が正常に読み込まれました');
        $this->line('   Channel Access Token: ' . substr($channelAccessToken, 0, 20) . '...');
        $this->line('   Channel Secret: ' . substr($channelSecret, 0, 10) . '...');
        $this->newLine();

        return true;
    }

    /**
     * ユーザーIDを指定してテスト
     */
    private function testByUserId(): int
    {
        $userId = $this->option('user-id') ?? $this->ask('ユーザーIDを入力してください');

        if (!$userId) {
            $this->error('ユーザーIDが指定されていません');
            return 1;
        }

        $user = User::find($userId);
        if (!$user) {
            $this->error("ユーザーID {$userId} が見つかりません");
            return 1;
        }

        $this->info("👤 ユーザー: {$user->name} ({$user->email})");

        $lineToken = $user->activeLineToken;
        if (!$lineToken) {
            $this->error('このユーザーはLINE連携していません');
            $this->line('LINE連携を行ってからテストしてください');
            return 1;
        }

        $this->info("🔗 LINE連携情報:");
        $this->line("   表示名: {$lineToken->line_display_name}");
        $this->line("   LINE User ID: {$lineToken->line_user_id}");
        $this->line("   連携日時: {$lineToken->linked_at}");
        $this->newLine();

        return $this->sendTestMessage($lineToken->line_user_id, $user->name);
    }

    /**
     * LINE User IDを直接指定してテスト
     */
    private function testByLineUserId(): int
    {
        $lineUserId = $this->option('line-user-id') ?? $this->ask('LINE User IDを入力してください');

        if (!$lineUserId) {
            $this->error('LINE User IDが指定されていません');
            return 1;
        }

        $this->info("📱 LINE User ID: {$lineUserId}");
        $this->newLine();

        return $this->sendTestMessage($lineUserId, 'テストユーザー');
    }

    /**
     * テストメッセージ送信
     */
    private function sendTestMessage(string $lineUserId, string $userName): int
    {
        $message = $this->option('message') ?? $this->ask(
            '送信するメッセージを入力してください',
            "🧪 LINE通知テスト\n\nこんにちは、{$userName}さん！\n\nLINE Messaging APIの通知テストです。\n\n送信日時: " . now()->format('Y-m-d H:i:s')
        );

        $this->info('📤 メッセージ送信中...');
        $this->line("送信先: {$lineUserId}");
        $this->line("メッセージ:");
        $this->line("---");
        $this->line($message);
        $this->line("---");
        $this->newLine();

        try {
            $result = $this->sendDirectMessage($lineUserId, $message);

            if ($result['success']) {
                $this->info('✅ メッセージ送信成功！');
                if (isset($result['message_id'])) {
                    $this->line("メッセージID: {$result['message_id']}");
                }
                return 0;
            } else {
                $this->error('❌ メッセージ送信失敗');
                $this->line("エラー: {$result['error']}");
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('❌ 送信中にエラーが発生しました');
            $this->line("エラー: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * 直接メッセージ送信
     */
    private function sendDirectMessage(string $lineUserId, string $message): array
    {
        $channelAccessToken = config('services.line.channel_access_token');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $channelAccessToken,
            'Content-Type' => 'application/json',
        ])->post('https://api.line.me/v2/bot/message/push', [
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
    }

    /**
     * 連携済みユーザー一覧表示
     */
    private function listConnectedUsers(): int
    {
        $this->info('👥 LINE連携済みユーザー一覧');
        $this->newLine();

        $lineTokens = LineToken::with('user')
            ->where('is_active', true)
            ->orderBy('linked_at', 'desc')
            ->get();

        if ($lineTokens->isEmpty()) {
            $this->warn('LINE連携しているユーザーがいません');
            return 0;
        }

        $headers = ['ユーザーID', 'ユーザー名', 'メール', 'LINE表示名', 'LINE User ID', '連携日時'];
        $rows = [];

        foreach ($lineTokens as $token) {
            $rows[] = [
                $token->user_id,
                $token->user->name,
                $token->user->email,
                $token->line_display_name,
                substr($token->line_user_id, 0, 20) . '...',
                $token->linked_at->format('Y-m-d H:i'),
            ];
        }

        $this->table($headers, $rows);
        $this->newLine();
        $this->info("合計: {$lineTokens->count()}人");

        return 0;
    }
}
