#!/bin/bash

##############################################################################
# サーバー初期セットアップスクリプト
#
# このスクリプトは初回デプロイ時にサーバー上で実行します：
# 1. 必要なディレクトリの作成
# 2. 環境変数の設定
# 3. パーミッションの設定
# 4. デプロイユーザーの設定
##############################################################################

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ出力関数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# スクリプトの開始
echo "=================================================="
echo "     サーバー初期セットアップスクリプト"
echo "=================================================="
echo ""

# 必要な環境変数の確認
if [ -z "$DEPLOY_USER" ]; then
    read -p "デプロイユーザー名を入力してください [deploy]: " DEPLOY_USER
    DEPLOY_USER=${DEPLOY_USER:-deploy}
fi

if [ -z "$APP_PATH" ]; then
    read -p "アプリケーションのパスを入力してください [/var/www/todo-app]: " APP_PATH
    APP_PATH=${APP_PATH:-/var/www/todo-app}
fi

# ステップ1: デプロイユーザーの作成
log_step "1. デプロイユーザーの設定"
if id "$DEPLOY_USER" &>/dev/null; then
    log_info "ユーザー $DEPLOY_USER は既に存在します"
else
    log_info "ユーザー $DEPLOY_USER を作成中..."
    sudo useradd -m -s /bin/bash "$DEPLOY_USER"
    log_info "ユーザー $DEPLOY_USER を作成しました"
fi

# ステップ2: SSHキーの設定
log_step "2. SSHキーの設定"
sudo mkdir -p "/home/$DEPLOY_USER/.ssh"
log_warn "GitHub Actionsの公開鍵を /home/$DEPLOY_USER/.ssh/authorized_keys に追加してください"
echo ""

# ステップ3: ディレクトリの作成
log_step "3. アプリケーションディレクトリの作成"
sudo mkdir -p "$APP_PATH/backend"
sudo mkdir -p "$APP_PATH/frontend"
sudo mkdir -p "$APP_PATH/scripts"
sudo mkdir -p "$APP_PATH/logs"
sudo mkdir -p "$APP_PATH/backups"
log_info "ディレクトリを作成しました: $APP_PATH"

# ステップ4: パーミッションの設定
log_step "4. パーミッションの設定"
sudo chown -R "$DEPLOY_USER:www-data" "$APP_PATH"
sudo chmod -R 755 "$APP_PATH"
log_info "パーミッションを設定しました"

# ステップ5: Laravelストレージディレクトリの設定
log_step "5. Laravel ストレージディレクトリの設定"
sudo mkdir -p "$APP_PATH/backend/storage/logs"
sudo mkdir -p "$APP_PATH/backend/storage/framework/sessions"
sudo mkdir -p "$APP_PATH/backend/storage/framework/views"
sudo mkdir -p "$APP_PATH/backend/storage/framework/cache"
sudo mkdir -p "$APP_PATH/backend/storage/app/public"
sudo mkdir -p "$APP_PATH/backend/bootstrap/cache"
sudo chown -R www-data:www-data "$APP_PATH/backend/storage"
sudo chown -R www-data:www-data "$APP_PATH/backend/bootstrap/cache"
sudo chmod -R 775 "$APP_PATH/backend/storage"
sudo chmod -R 775 "$APP_PATH/backend/bootstrap/cache"
log_info "Laravel ストレージディレクトリを設定しました"

# ステップ6: 環境変数ファイルの作成
log_step "6. 環境変数ファイルの準備"
if [ ! -f "$APP_PATH/backend/.env" ]; then
    log_warn ".envファイルが存在しません"
    log_info "サンプル.envファイルを作成します..."
    sudo tee "$APP_PATH/backend/.env" > /dev/null <<EOF
APP_NAME=TodoApp
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=Asia/Tokyo
APP_URL=https://your-domain.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=todo_db
DB_USERNAME=todo_user
DB_PASSWORD=

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
EOF
    sudo chown "$DEPLOY_USER:www-data" "$APP_PATH/backend/.env"
    sudo chmod 640 "$APP_PATH/backend/.env"
    log_warn "⚠️ .envファイルを編集して、適切な値を設定してください！"
    log_warn "⚠️ 特に APP_KEY, DB_PASSWORD を必ず設定してください！"
else
    log_info ".envファイルは既に存在します"
fi

# ステップ7: sudoers設定（Nginxリロード用）
log_step "7. sudoers設定（オプション）"
log_info "デプロイユーザーがNginxをリロードできるようにしますか？ [y/N]"
read -r answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx" | sudo tee "/etc/sudoers.d/$DEPLOY_USER" > /dev/null
    log_info "sudoers設定を追加しました"
fi

# 完了メッセージ
echo ""
echo "=================================================="
log_info "✅ サーバーの初期セットアップが完了しました！"
echo "=================================================="
echo ""
echo "次のステップ:"
echo "1. GitHub SecretsにSSH秘密鍵を追加してください"
echo "2. $APP_PATH/backend/.env ファイルを編集してください"
echo "3. Laravel アプリケーションキーを生成してください:"
echo "   cd $APP_PATH/backend && php artisan key:generate"
echo "4. データベースマイグレーションを実行してください:"
echo "   cd $APP_PATH/backend && php artisan migrate"
echo ""

