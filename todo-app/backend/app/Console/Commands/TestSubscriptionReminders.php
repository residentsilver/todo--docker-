<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Subscription;
use App\Models\ReminderHistory;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * サブスクリプションリマインダーテストコマンド
 * 新しい条件判定ロジックをテストするためのコマンド
 */
class TestSubscriptionReminders extends Command
{
    /**
     * コマンド名と説明
     *
     * @var string
     */
    protected $signature = 'reminders:test-subscriptions {--date= : テストする日付 (Y-m-d形式、デフォルトは今日)}';

    protected $description = 'サブスクリプションリマインダーの条件判定をテストします。';

    /**
     * コンストラクタ
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * コマンドの実行
     *
     * @return int
     */
    public function handle()
    {
        $testDate = $this->option('date') ? Carbon::parse($this->option('date')) : Carbon::now();
        $today = $testDate->toDateString();
        
        $this->info("=== サブスクリプションリマインダーテスト開始 ===");
        $this->info("テスト日付: {$today}");
        $this->info("実行時刻: " . now()->format('Y-m-d H:i:s'));
        $this->info("タイムゾーン: " . config('app.timezone'));
        
        try {
            // 条件に一致するサブスクリプションを取得
            $subscriptions = Subscription::with(['user.activeLineToken'])
                ->where('notification_enabled', true)
                ->where('status', 'active')
                ->whereNotNull('reminder_days')
                ->get();

            $this->info("チェック対象のサブスクリプション: {$subscriptions->count()}件");
            
            $matchCount = 0;
            $totalChecks = 0;

            foreach ($subscriptions as $subscription) {
                $this->line("\n--- サブスクリプション: {$subscription->service_name} ---");
                $this->line("終了日: {$subscription->end_date->format('Y-m-d')}");
                $this->line("リマインダー日数: " . implode(', ', $subscription->reminder_days));
                
                // ユーザーが有効なLINEトークンを持っているかチェック
                if (!$subscription->user->activeLineToken) {
                    $this->warn("ユーザーID {$subscription->user->id} のLINEトークンが見つかりません");
                    continue;
                }
                
                if (!$subscription->user->activeLineToken->is_valid) {
                    $this->warn("ユーザーID {$subscription->user->id} のLINEトークンが無効です");
                    continue;
                }
                
                $this->line("LINEトークン: 有効");

                // reminder_daysの各値に対してチェック
                $reminderDays = $subscription->reminder_days;
                if (!is_array($reminderDays)) {
                    $this->warn("reminder_daysが配列ではありません");
                    continue;
                }

                foreach ($reminderDays as $daysBefore) {
                    $totalChecks++;
                    
                    // 指定日数前の日付を計算
                    $targetDate = Carbon::parse($subscription->end_date)->subDays($daysBefore)->toDateString();
                    
                    $this->line("  {$daysBefore}日前の日付: {$targetDate}");
                    
                    // 今日の日付と一致するかチェック
                    if ($targetDate === $today) {
                        $matchCount++;
                        $this->info("  ✓ マッチ！{$daysBefore}日前のリマインダーが送信対象です");
                        
                        // 既に同じ組み合わせのレコードが存在するかチェック（ステータスに関係なく）
                        $existingReminder = ReminderHistory::forSubscriptionUser(
                            $subscription->id, 
                            $daysBefore, 
                            $subscription->user_id
                        )->first();

                        if ($existingReminder) {
                            $this->warn("  ⚠ 既に存在します (status: {$existingReminder->status}, created_at: {$existingReminder->created_at->format('Y-m-d H:i:s')})");
                        } else {
                            $this->info("  → 新規送信対象です");
                        }
                    } else {
                        $this->line("  - マッチしません");
                    }
                }
            }

            $this->info("\n=== テスト結果 ===");
            $this->info("チェック対象サブスクリプション数: {$subscriptions->count()}件");
            $this->info("総チェック回数: {$totalChecks}回");
            $this->info("マッチした件数: {$matchCount}件");
            
            if ($matchCount > 0) {
                $this->info("送信対象のリマインダーが見つかりました！");
            } else {
                $this->info("送信対象のリマインダーはありませんでした。");
            }

        } catch (\Exception $e) {
            $this->error('テスト実行中にエラーが発生しました: ' . $e->getMessage());
            
            Log::error('サブスクリプションリマインダーテストでエラーが発生しました', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return 1;
        }

        $this->info("=== テスト完了 ===");
        return 0;
    }
} 