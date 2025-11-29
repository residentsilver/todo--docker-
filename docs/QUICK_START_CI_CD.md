# CI/CD クイックスタートガイド

このガイドでは、最短でCI/CDパイプラインを稼働させる手順を説明します。

## 🚀 5ステップで完了

### ステップ1: SSH鍵ペアの生成

```bash
# ローカル環境で実行
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_deploy

# 秘密鍵をコピー（後でGitHubに登録）
cat ~/.ssh/github_actions_deploy | pbcopy  # macOS
cat ~/.ssh/github_actions_deploy | clip     # Windows

# 公開鍵をコピー（後でサーバーに登録）
cat ~/.ssh/github_actions_deploy.pub
```

### ステップ2: サーバーのセットアップ

```bash
# サーバーにSSHで接続
ssh user@your-server.com

# デプロイユーザーの作成
sudo useradd -m -s /bin/bash deploy

# SSH公開鍵を登録
sudo mkdir -p /home/deploy/.ssh
echo "先ほどコピーした公開鍵" | sudo tee /home/deploy/.ssh/authorized_keys
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh

# アプリケーションディレクトリの作成
sudo mkdir -p /var/www/todo-app/{backend,frontend}
sudo chown -R deploy:www-data /var/www/todo-app

# リポジトリをクローン
cd /var/www/todo-app/backend
sudo -u deploy git clone https://github.com/yourusername/todo.git .

# Laravel セットアップ
sudo -u deploy composer install --no-dev
sudo -u deploy cp .env.example .env
sudo -u deploy php artisan key:generate
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# データベースマイグレーション
sudo -u deploy php artisan migrate --force
```

### ステップ3: GitHub Secretsの設定

GitHubリポジトリで：**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### ステージング環境（最低限）

| Secret名 | 値 |
|---------|-----|
| `STAGING_SSH_KEY` | ステップ1の秘密鍵の内容全体 |
| `STAGING_HOST` | `your-server.com` |
| `STAGING_USER` | `deploy` |
| `STAGING_BACKEND_PATH` | `/var/www/todo-app/backend` |
| `STAGING_FRONTEND_PATH` | `/var/www/todo-app/frontend` |
| `STAGING_API_URL` | `https://staging.example.com/api` |

#### 本番環境（同様に設定）

`STAGING_*`を`PRODUCTION_*`に置き換えて同じように設定

### ステップ4: デプロイスクリプトの配置

```bash
# サーバー上で実行
cd /var/www/todo-app/backend

# デプロイスクリプトを作成
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 デプロイ開始..."

# メンテナンスモード
php artisan down || true

# 最新コードを取得
git fetch origin
git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)

# 依存関係をインストール
composer install --no-dev --optimize-autoloader

# キャッシュクリア
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# キャッシュ作成
php artisan config:cache
php artisan route:cache

# マイグレーション
php artisan migrate --force

# メンテナンスモード解除
php artisan up

echo "✅ デプロイ完了！"
EOF

# 実行権限を付与
chmod +x deploy.sh
```

### ステップ5: デプロイを実行

```bash
# ローカル環境で実行

# ステージング環境へデプロイ
git checkout staging
git push origin staging

# 本番環境へデプロイ
git checkout main
git push origin main
```

**完了！** 🎉

GitHub Actionsページで進捗を確認できます：
`https://github.com/yourusername/yourrepo/actions`

---

## 📊 動作確認

### GitHub Actionsで確認

1. GitHubリポジトリの **Actions** タブを開く
2. 実行中のワークフローをクリック
3. 各ステップの進捗を確認

### ログ確認

```bash
# サーバーで実行

# Laravel ログ
tail -f /var/www/todo-app/backend/storage/logs/laravel.log

# Nginx ログ
sudo tail -f /var/log/nginx/error.log

# デプロイログ
tail -f /var/www/todo-app/backend/deploy.log
```

---

## 🔧 よくある問題と解決策

### ❌ SSH接続エラー

```
Permission denied (publickey)
```

**解決:**
```bash
# サーバーで確認
ls -la /home/deploy/.ssh/
cat /home/deploy/.ssh/authorized_keys

# パーミッション修正
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
```

### ❌ Permission denied エラー

```bash
# サーバーで実行
cd /var/www/todo-app/backend
sudo chown -R deploy:www-data .
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### ❌ Composer エラー

```bash
# サーバーで実行
cd /var/www/todo-app/backend
rm -rf vendor
composer install --no-dev
```

---

## 📝 次のステップ

1. ✅ **SSL証明書の設定:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. ✅ **監視の設定:**
   - UptimeRobot などで死活監視
   - エラー通知の設定

3. ✅ **バックアップの設定:**
   ```bash
   # データベースバックアップのcron設定
   0 2 * * * mysqldump -u user -p password database > backup.sql
   ```

---

## 📚 詳細ドキュメント

さらに詳しい情報は、[完全セットアップガイド](./CI_CD_SETUP.md)をご覧ください。

---

## 💡 ヒント

- **ローカルテスト:** デプロイ前に `./todo-app/scripts/local-test.sh` を実行
- **ブランチ戦略:** `develop` → `staging` → `main` の順でマージ
- **ロールバック:** 問題が発生したら、前のコミットに戻してpush

---

困ったときは `docs/CI_CD_SETUP.md` のトラブルシューティングセクションを確認してください！

