# マイグレーション実行手順

## 概要

`reminder_histories`テーブルのユニーク制約を変更するマイグレーションを実行する手順を説明します。

## 変更内容

### 変更前
- ユニーク制約: `(subscription_id, days_before)`
- 制約名: `unique_subscription_reminder`

### 変更後
- ユニーク制約: `(subscription_id, days_before, user_id)`
- 制約名: `unique_subscription_user_reminder`

## 実行手順

### 1. マイグレーションの実行

```bash
# プロジェクトディレクトリに移動
cd todo-app/backend

# マイグレーションを実行
php artisan migrate
```

### 2. 実行されるマイグレーション

以下のマイグレーションファイルが実行されます：
- `2025_01_27_000002_modify_reminder_histories_unique_constraint.php`

### 3. 実行内容

```sql
-- 既存のユニーク制約を削除
ALTER TABLE reminder_histories DROP INDEX unique_subscription_reminder;

-- 新しいユニーク制約を追加
ALTER TABLE reminder_histories ADD CONSTRAINT unique_subscription_user_reminder 
UNIQUE (subscription_id, days_before, user_id);
```

## 確認方法

### 1. マイグレーション状態の確認

```bash
# マイグレーション状態を確認
php artisan migrate:status
```

### 2. テーブル構造の確認

```sql
-- MySQLでテーブル構造を確認
SHOW CREATE TABLE reminder_histories;
```

### 3. 制約の確認

```sql
-- ユニーク制約の確認
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    ORDINAL_POSITION
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'your_database_name' 
AND TABLE_NAME = 'reminder_histories' 
AND CONSTRAINT_NAME = 'unique_subscription_user_reminder'
ORDER BY ORDINAL_POSITION;
```

## ロールバック方法

### 1. マイグレーションのロールバック

```bash
# 最後のマイグレーションをロールバック
php artisan migrate:rollback --step=1
```

### 2. ロールバック内容

```sql
-- 新しいユニーク制約を削除
ALTER TABLE reminder_histories DROP INDEX unique_subscription_user_reminder;

-- 元のユニーク制約を復元
ALTER TABLE reminder_histories ADD CONSTRAINT unique_subscription_reminder 
UNIQUE (subscription_id, days_before);
```

## 注意事項

### 1. データの整合性

- 既存のデータに重複がある場合、マイグレーションが失敗する可能性があります
- 重複データがある場合は、事前にデータをクリーンアップしてください

### 2. 重複データの確認

```sql
-- 重複データの確認
SELECT 
    subscription_id, 
    days_before, 
    user_id, 
    COUNT(*) as count
FROM reminder_histories 
GROUP BY subscription_id, days_before, user_id 
HAVING COUNT(*) > 1;
```

### 3. 重複データの削除

```sql
-- 重複データを削除（最新のレコードを残す）
DELETE rh1 FROM reminder_histories rh1
INNER JOIN reminder_histories rh2 
WHERE rh1.id < rh2.id 
AND rh1.subscription_id = rh2.subscription_id 
AND rh1.days_before = rh2.days_before 
AND rh1.user_id = rh2.user_id;
```

## 影響範囲

### 1. アプリケーションコード

- `SendReminders.php`の重複チェックロジックが更新されました
- `TestSubscriptionReminders.php`の重複チェックロジックが更新されました
- `ReminderHistory`モデルに新しいスコープが追加されました

### 2. データベース

- ユニーク制約により、同じサブスクリプションの同じ日数前の同じユーザーへの通知は一度だけ送信されます
- データベースレベルでの重複防止が強化されました

## テスト

### 1. マイグレーション後のテスト

```bash
# サブスクリプションリマインダーのテスト
php artisan reminders:test-subscriptions

# 実際の送信テスト
php artisan reminders:send --type=subscriptions
```

### 2. 重複送信のテスト

- 同じサブスクリプションの同じ日数前の同じユーザーへの通知が重複して送信されないことを確認
- データベースレベルでの制約が正しく動作することを確認

## トラブルシューティング

### 1. マイグレーションエラー

**エラー**: `Duplicate entry for key 'unique_subscription_user_reminder'`

**解決方法**: 重複データを削除してからマイグレーションを再実行

### 2. 制約名の競合

**エラー**: `Constraint name already exists`

**解決方法**: 既存の制約を手動で削除してからマイグレーションを実行

### 3. 外部キー制約エラー

**エラー**: `Cannot add foreign key constraint`

**解決方法**: 関連テーブルのデータ整合性を確認 