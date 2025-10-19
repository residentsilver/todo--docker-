<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ReminderHistory;
use Illuminate\Support\Facades\DB;

/**
 * リマインダー履歴の重複データ確認コマンド
 * ユニーク制約違反の原因を調査するためのコマンド
 */
class CheckReminderHistory extends Command
{
    /**
     * コマンド名と説明
     *
     * @var string
     */
    protected $signature = 'reminders:check-history {--subscription_id= : 特定のサブスクリプションID} {--user_id= : 特定のユーザーID}';

    protected $description = 'reminder_historiesテーブルの重複データを確認します。';

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
        $subscriptionId = $this->option('subscription_id');
        $userId = $this->option('user_id');

        $this->info("=== リマインダー履歴データ確認 ===");

        try {
            // 1. 全体的な重複データの確認
            $this->info("\n1. 全体的な重複データの確認:");
            $duplicates = DB::table('reminder_histories')
                ->select('subscription_id', 'days_before', 'user_id', DB::raw('COUNT(*) as count'))
                ->groupBy('subscription_id', 'days_before', 'user_id')
                ->having('count', '>', 1)
                ->get();

            if ($duplicates->count() > 0) {
                $this->error("重複データが見つかりました:");
                foreach ($duplicates as $duplicate) {
                    $this->error("  subscription_id: {$duplicate->subscription_id}, days_before: {$duplicate->days_before}, user_id: {$duplicate->user_id}, count: {$duplicate->count}");
                }
            } else {
                $this->info("重複データは見つかりませんでした。");
            }

            // 2. 特定の組み合わせの詳細確認
            if ($subscriptionId && $userId) {
                $this->info("\n2. 特定の組み合わせの詳細確認 (subscription_id: {$subscriptionId}, user_id: {$userId}):");
                
                $records = ReminderHistory::where('subscription_id', $subscriptionId)
                    ->where('user_id', $userId)
                    ->orderBy('days_before')
                    ->orderBy('created_at')
                    ->get();

                if ($records->count() > 0) {
                    $this->info("見つかったレコード:");
                    foreach ($records as $record) {
                        $this->line("  ID: {$record->id}, days_before: {$record->days_before}, status: {$record->status}, created_at: {$record->created_at}");
                    }
                } else {
                    $this->info("該当するレコードは見つかりませんでした。");
                }
            }

            // 3. エラーで言及されている組み合わせの確認
            $this->info("\n3. エラーで言及されている組み合わせの確認 ");
            
            $specificRecords = ReminderHistory::where('subscription_id', 4)
                ->where('days_before', 30)
                ->where('user_id', 1)
                ->orderBy('created_at')
                ->get();

            if ($specificRecords->count() > 0) {
                $this->error("該当するレコードが見つかりました:");
                foreach ($specificRecords as $record) {
                    $this->error("  ID: {$record->id}, status: {$record->status}, created_at: {$record->created_at}, sent_at: {$record->sent_at}");
                }
            } else {
                $this->info("該当するレコードは見つかりませんでした。");
            }

            // 4. テーブル構造の確認
            $this->info("\n4. テーブル構造の確認:");
            $tableStructure = DB::select("SHOW CREATE TABLE reminder_histories");
            $this->line("テーブル構造:");
            $this->line($tableStructure[0]->{'Create Table'});

            // 5. インデックスと制約の確認
            $this->info("\n5. インデックスと制約の確認:");
            $indexes = DB::select("SHOW INDEX FROM reminder_histories");
            foreach ($indexes as $index) {
                $this->line("  インデックス名: {$index->Key_name}, カラム: {$index->Column_name}, 順序: {$index->Seq_in_index}");
            }

        } catch (\Exception $e) {
            $this->error('エラーが発生しました: ' . $e->getMessage());
            return 1;
        }

        $this->info("\n=== 確認完了 ===");
        return 0;
    }
} 