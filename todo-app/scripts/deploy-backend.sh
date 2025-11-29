#!/bin/bash

##############################################################################
# Laravel バックエンドのデプロイスクリプト
#
# このスクリプトはサーバー上で実行され、以下を行います：
# 1. 最新コードの取得
# 2. 依存関係のインストール
# 3. キャッシュのクリア
# 4. マイグレーションの実行
# 5. 最適化
##############################################################################

set -e  # エラーが発生したら即座に終了

# カラー出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# スクリプトの開始
log_info "デプロイを開始します..."

# プロジェクトディレクトリに移動
cd "$(dirname "$0")/.." || exit 1

# メンテナンスモードに切り替え
log_info "メンテナンスモードを有効化..."
php artisan down --retry=60 || log_warn "メンテナンスモード有効化に失敗しました"

# エラー時の処理（メンテナンスモードを解除）
trap 'log_error "デプロイに失敗しました"; php artisan up; exit 1' ERR

# Gitで最新コードを取得
log_info "最新コードを取得中..."
git fetch origin
git reset --hard origin/$(git rev-parse --abbrev-ref HEAD)

# Composer依存関係のインストール
log_info "Composer依存関係をインストール中..."
composer install --no-dev --optimize-autoloader --no-interaction

# ストレージのシンボリックリンク作成
log_info "ストレージリンクを作成中..."
php artisan storage:link || log_warn "ストレージリンクは既に存在します"

# キャッシュのクリア
log_info "キャッシュをクリア中..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 設定のキャッシュ
log_info "設定をキャッシュ中..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# データベースマイグレーションの実行
log_info "データベースマイグレーションを実行中..."
php artisan migrate --force

# Laravelの最適化
log_info "Laravelを最適化中..."
php artisan optimize

# パーミッションの設定
log_info "パーミッションを設定中..."
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || log_warn "パーミッション設定に失敗しました（権限が必要です）"

# メンテナンスモードを解除
log_info "メンテナンスモードを解除..."
php artisan up

log_info "✅ デプロイが正常に完了しました！"

# デプロイ情報をログに記録
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deployment completed successfully" >> deploy.log

