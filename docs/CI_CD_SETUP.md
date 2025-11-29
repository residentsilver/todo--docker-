# CI/CD セットアップガイド

このドキュメントでは、TodoアプリケーションのCI/CD（継続的インテグレーション/継続的デプロイ）の完全なセットアップ手順を説明します。

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [GitHub Secretsの設定](#github-secretsの設定)
4. [サーバーのセットアップ](#サーバーのセットアップ)
5. [ワークフローの説明](#ワークフローの説明)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

本プロジェクトでは、GitHub Actionsを使用したCI/CDパイプラインを実装しています。

### CI/CDフロー

```
コードをプッシュ
    ↓
自動テスト実行
    ↓
ビルド実行
    ↓
（テスト成功時）
    ↓
自動デプロイ
    ↓
本番環境稼働
```

### ワークフローの種類

1. **テストワークフロー** (`.github/workflows/test.yml`)
   - プルリクエスト作成時に実行
   - バックエンド・フロントエンドの両方をテスト
   - コード品質チェック

2. **ステージングデプロイ** (`.github/workflows/deploy-staging.yml`)
   - `staging`ブランチへのpush時に実行
   - テスト → ビルド → ステージング環境へデプロイ

3. **本番デプロイ** (`.github/workflows/deploy-production.yml`)
   - `main`ブランチへのpush時に実行
   - テスト → ビルド → 本番環境へデプロイ

---

## 前提条件

### 必要なもの

- ✅ GitHubリポジトリ
- ✅ デプロイ先サーバー（Ubuntu 20.04以上推奨）
- ✅ サーバーへのSSHアクセス権限
- ✅ ドメイン（オプション、推奨）

### サーバー要件

**バックエンド（Laravel）:**
- PHP 8.2以上
- Composer
- MySQL 8.0以上またはPostgreSQL
- Nginx / Apache
- Redis（推奨）

**フロントエンド（React）:**
- Node.js 18以上
- npm
- Nginx（静的ファイル配信用）

---

## GitHub Secretsの設定

GitHub Actionsからサーバーにデプロイするため、機密情報をGitHub Secretsに登録します。

### 1. SSH鍵ペアの生成

ローカル環境で以下のコマンドを実行：

```bash
# 新しいSSH鍵ペアを生成
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# 秘密鍵の内容を表示（後でGitHub Secretsに登録）
cat ~/.ssh/github_actions_deploy

# 公開鍵の内容を表示（サーバーに登録）
cat ~/.ssh/github_actions_deploy.pub
```

### 2. 公開鍵をサーバーに登録

サーバーにSSHで接続し、以下を実行：

```bash
# デプロイユーザーのホームディレクトリに移動
cd /home/deploy

# .sshディレクトリを作成（存在しない場合）
mkdir -p .ssh
chmod 700 .ssh

# 公開鍵をauthorized_keysに追加
echo "先ほど表示した公開鍵をここに貼り付け" >> .ssh/authorized_keys
chmod 600 .ssh/authorized_keys
```

### 3. GitHub Secretsに登録

GitHubリポジトリのページで：
1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. 以下のSecretを追加：

#### ステージング環境用

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `STAGING_SSH_KEY` | SSH秘密鍵（全体） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_HOST` | サーバーのIPアドレスまたはドメイン | `staging.example.com` |
| `STAGING_USER` | SSH接続ユーザー名 | `deploy` |
| `STAGING_BACKEND_PATH` | バックエンドのパス | `/var/www/todo-app/backend` |
| `STAGING_FRONTEND_PATH` | フロントエンドのパス | `/var/www/todo-app/frontend` |
| `STAGING_API_URL` | APIのURL | `https://staging.example.com/api` |

#### 本番環境用

| Secret名 | 説明 | 例 |
|---------|------|-----|
| `PRODUCTION_SSH_KEY` | SSH秘密鍵（全体） | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_HOST` | サーバーのIPアドレスまたはドメイン | `production.example.com` |
| `PRODUCTION_USER` | SSH接続ユーザー名 | `deploy` |
| `PRODUCTION_BACKEND_PATH` | バックエンドのパス | `/var/www/todo-app/backend` |
| `PRODUCTION_FRONTEND_PATH` | フロントエンドのパス | `/var/www/todo-app/frontend` |
| `PRODUCTION_API_URL` | APIのURL | `https://api.example.com` |
| `PRODUCTION_URL` | フロントエンドのURL（ヘルスチェック用） | `https://example.com` |

---

## サーバーのセットアップ

### 1. 初期セットアップスクリプトの実行

サーバーにSSHで接続し、セットアップスクリプトを実行：

```bash
# リポジトリをクローン（初回のみ）
cd /var/www
sudo git clone https://github.com/yourusername/todo.git todo-app

# セットアップスクリプトを実行
cd todo-app/todo-app/scripts
sudo chmod +x setup-server.sh
sudo ./setup-server.sh
```

このスクリプトは以下を自動的に行います：
- デプロイユーザーの作成
- 必要なディレクトリの作成
- パーミッションの設定
- サンプル.envファイルの作成

### 2. 環境変数の設定

`.env`ファイルを編集：

```bash
cd /var/www/todo-app/backend
sudo nano .env
```

最低限設定が必要な項目：

```env
APP_KEY=base64:ランダムな文字列
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=todo_db
DB_USERNAME=todo_user
DB_PASSWORD=強力なパスワード

# LINE連携（使用する場合）
LINE_CHANNEL_ID=your-channel-id
LINE_CHANNEL_SECRET=your-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-access-token
```

### 3. アプリケーションキーの生成

```bash
cd /var/www/todo-app/backend
php artisan key:generate
```

### 4. データベースのセットアップ

```bash
# マイグレーション実行
php artisan migrate --force

# （オプション）初期データの投入
php artisan db:seed --force
```

### 5. デプロイスクリプトの配置

```bash
cd /var/www/todo-app/backend
sudo cp ../todo-app/scripts/deploy-backend.sh ./deploy.sh
sudo chmod +x deploy.sh
sudo chown deploy:www-data deploy.sh
```

### 6. Nginxの設定

**バックエンド用（API）:**

```bash
sudo nano /etc/nginx/sites-available/todo-api
```

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    root /var/www/todo-app/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**フロントエンド用:**

```bash
sudo nano /etc/nginx/sites-available/todo-frontend
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/todo-app/frontend/build;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://api.your-domain.com;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

サイトを有効化：

```bash
sudo ln -s /etc/nginx/sites-available/todo-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/todo-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL証明書の設定（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## ワークフローの説明

### テストワークフロー

**トリガー:** プルリクエスト作成時

**実行内容:**
1. バックエンドのテスト
   - PHPUnit テスト実行
   - Laravel Pint コードスタイルチェック
2. フロントエンドのテスト
   - Jest テスト実行
   - ビルド検証

### ステージング/本番デプロイワークフロー

**トリガー:** staging/main ブランチへのpush

**実行内容:**
1. テストの実行（テストワークフローと同じ）
2. 依存関係のインストール（最適化あり）
3. ビルド（本番用設定）
4. サーバーへSSH接続
5. デプロイスクリプトの実行
6. ヘルスチェック（本番のみ）

---

## 使い方

### 開発フロー

1. **機能開発:**
   ```bash
   git checkout -b feature/new-feature
   # コードを編集
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **プルリクエスト作成:**
   - GitHubでPRを作成
   - 自動的にテストが実行される
   - テストが通ったらマージ

3. **ステージング環境へデプロイ:**
   ```bash
   git checkout staging
   git merge feature/new-feature
   git push origin staging
   # 自動的にステージング環境へデプロイ
   ```

4. **本番環境へデプロイ:**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   # 自動的に本番環境へデプロイ
   ```

### ローカルでテスト実行

デプロイ前にローカルでテストを実行：

```bash
cd todo-app/scripts
chmod +x local-test.sh
./local-test.sh
```

---

## トラブルシューティング

### デプロイが失敗する

**SSH接続エラー:**
```
Permission denied (publickey)
```

**解決策:**
1. GitHub SecretsのSSH鍵が正しいか確認
2. サーバーの`authorized_keys`に公開鍵が登録されているか確認
3. デプロイユーザーの権限を確認

**デプロイスクリプトエラー:**
```
deploy.sh: No such file or directory
```

**解決策:**
1. サーバー上にデプロイスクリプトが存在するか確認
2. パスが正しいか確認
3. 実行権限があるか確認: `chmod +x deploy.sh`

### テストが失敗する

**PHP テストエラー:**

```bash
# ローカルで確認
cd todo-app/backend
composer install
vendor/bin/phpunit
```

**React テストエラー:**

```bash
# ローカルで確認
cd todo-app/frontend/todo
npm install
npm test
```

### パーミッションエラー

**storage/logsへの書き込みエラー:**

```bash
cd /var/www/todo-app/backend
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### GitHub Actions のログ確認

1. GitHubリポジトリページ
2. **Actions** タブ
3. 失敗したワークフローをクリック
4. 各ステップのログを確認

---

## セキュリティのベストプラクティス

1. **SSH鍵の管理:**
   - GitHub Actions専用の鍵を使用
   - 定期的に鍵をローテーション
   - 不要になった鍵は削除

2. **環境変数:**
   - `.env`ファイルをGitにコミットしない
   - 本番環境の`.env`は厳重に管理
   - APP_DEBUGは本番環境でfalse

3. **アクセス制限:**
   - デプロイユーザーの権限は必要最小限に
   - ファイアウォールの設定
   - SSH接続を鍵認証のみに制限

4. **定期的な更新:**
   - 依存関係の定期的な更新
   - セキュリティパッチの適用
   - サーバーOSの更新

---

## 参考資料

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---