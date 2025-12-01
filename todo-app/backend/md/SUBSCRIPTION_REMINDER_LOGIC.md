# サブスクリプションリマインダー条件判定ロジック

## 概要

サブスクリプションリマインダーの条件判定ロジックを変更し、`reminder_days`カラムを使用してより柔軟なリマインダー設定を可能にしました。

## 変更前のロジック

- `ReminderHistory`テーブルの`scheduled_at`が現在時刻以前
- `status`が`'pending'`のレコードを取得
- 既存のリマインダー履歴に基づいて送信

## 変更後のロジック

### 条件判定の流れ

1. **サブスクリプションの基本条件チェック**
   - `notification_enabled`が`true`
   - `status`が`'active'`
   - `reminder_days`が設定されている（nullでない）

2. **ユーザーのLINEトークンチェック**
   - ユーザーが有効なLINEトークンを持っている
   - トークンが有効期限内である

3. **リマインダー日数の判定**
   - `reminder_days`配列の各値（例：`[30, 7, 1]`）に対して
   - サブスクリプションの終了日から指定日数を引いた日付を計算
   - その日付が今日の日付と一致するかチェック

4. **重複送信防止**
   - 既に同じサブスクリプション・同じ日数前・同じユーザーのリマインダーが送信済みかチェック
   - 送信済みの場合はスキップ
   - データベースレベルでもユニーク制約により重複を防止

### 具体例

**サブスクリプション設定例：**
```json
{
  "service_name": "Netflix",
  "end_date": "2024-12-31",
  "reminder_days": [30, 7, 1],
  "notification_enabled": true,
  "status": "active"
}
```

**リマインダー送信タイミング：**
- 2024年12月1日（終了30日前）
- 2024年12月24日（終了7日前）
- 2024年12月30日（終了1日前）

## 実装詳細

### メイン処理（`SendReminders.php`）

```php
private function sendSubscriptionReminders(): array
{
    $now = Carbon::now();
    $today = $now->toDateString();

    // 条件に一致するサブスクリプションを取得
    $subscriptions = Subscription::with(['user.activeLineToken'])
        ->where('notification_enabled', true)
        ->where('status', 'active')
        ->whereNotNull('reminder_days')
        ->get();

    foreach ($subscriptions as $subscription) {
        // LINEトークンチェック
        if (!$subscription->user->activeLineToken || !$subscription->user->activeLineToken->is_valid) {
            continue;
        }

        // reminder_daysの各値に対してチェック
        foreach ($subscription->reminder_days as $daysBefore) {
            // 指定日数前の日付を計算
            $targetDate = Carbon::parse($subscription->end_date)->subDays($daysBefore)->toDateString();
            
            // 今日の日付と一致するかチェック
            if ($targetDate === $today) {
                // 重複送信チェック（ユニーク制約に合わせてuser_idも含める）
                $existingReminder = ReminderHistory::forSubscriptionUser(
                    $subscription->id, 
                    $daysBefore, 
                    $subscription->user_id
                )->where('status', 'sent')->first();

                if (!$existingReminder) {
                    // リマインダー履歴を作成して送信
                    $reminder = ReminderHistory::create([
                        'subscription_id' => $subscription->id,
                        'user_id' => $subscription->user_id,
                        'days_before' => $daysBefore,
                        'scheduled_at' => $now,
                        'status' => 'pending',
                    ]);

                    $success = $this->lineMessagingService->sendReminderMessage($reminder);
                }
            }
        }
    }
}
```

## テスト方法

### 1. 条件判定のテスト

```bash
# 今日の日付でテスト
php artisan reminders:test-subscriptions

# 特定の日付でテスト
php artisan reminders:test-subscriptions --date=2024-12-01
```

### 2. 実際の送信テスト

```bash
# サブスクリプションリマインダーの送信テスト
php artisan reminders:send --type=subscriptions
```

## データベース構造

### subscriptionsテーブル
```sql
CREATE TABLE subscriptions (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    service_name VARCHAR(255),
    end_date DATE,
    reminder_days JSON,  -- [30, 7, 1] のような配列
    notification_enabled BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    -- その他のフィールド
);
```

### reminder_historiesテーブル
```sql
CREATE TABLE reminder_histories (
    id BIGINT PRIMARY KEY,
    subscription_id BIGINT,
    user_id BIGINT,
    days_before INT,     -- 何日前のリマインダーか
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP NULL,
    status VARCHAR(50),  -- 'pending', 'sent', 'failed', 'cancelled'
    -- その他のフィールド
    
    -- ユニーク制約: 同じサブスクリプションの同じ日数前の同じユーザーへの通知は一度だけ
    UNIQUE KEY unique_subscription_user_reminder (subscription_id, days_before, user_id)
);
```

## メリット

1. **柔軟なリマインダー設定**: 任意の日数前のリマインダーを設定可能
2. **重複送信防止**: 同じリマインダーが複数回送信されることを防止
3. **リアルタイム判定**: 毎日の実行時に動的に条件を判定
4. **詳細なログ**: 処理結果を詳細にログ出力

## 注意事項

1. **タイムゾーン**: サーバーのタイムゾーン設定が重要
2. **パフォーマンス**: 大量のサブスクリプションがある場合は処理時間に注意
3. **エラーハンドリング**: LINEトークンの無効化や送信失敗時の処理
4. **データ整合性**: `reminder_days`の配列形式が正しいことを確認

## 関連ファイル

- `app/Console/Commands/SendReminders.php` - メインのリマインダー送信コマンド
- `app/Console/Commands/TestSubscriptionReminders.php` - テスト用コマンド
- `app/Models/Subscription.php` - サブスクリプションモデル
- `app/Models/ReminderHistory.php` - リマインダー履歴モデル
- `app/Services/LineMessagingService.php` - LINE通知サービス 