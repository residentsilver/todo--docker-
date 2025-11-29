#!/bin/bash

##############################################################################
# React フロントエンドのデプロイスクリプト
#
# このスクリプトはサーバー上で実行され、以下を行います：
# 1. 最新ビルドファイルの配置
# 2. バックアップの作成
# 3. Nginxのリロード（必要に応じて）
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
log_info "フロントエンドのデプロイを開始します..."

# プロジェクトディレクトリに移動
DEPLOY_DIR="$(dirname "$0")/.."
cd "$DEPLOY_DIR" || exit 1

# バックアップディレクトリの作成
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# 現在のビルドファイルをバックアップ
if [ -d "build" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/build_$TIMESTAMP"
    log_info "現在のビルドをバックアップ中: $BACKUP_PATH"
    cp -r build "$BACKUP_PATH"
    
    # 古いバックアップを削除（最新5つを保持）
    log_info "古いバックアップを削除中..."
    ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}" || true
fi

# 新しいビルドファイルが配置されていることを確認
if [ ! -d "build" ] || [ -z "$(ls -A build)" ]; then
    log_error "ビルドファイルが見つかりません！"
    exit 1
fi

log_info "ビルドファイルを確認しました"

# index.htmlが存在することを確認
if [ ! -f "build/index.html" ]; then
    log_error "index.htmlが見つかりません！"
    exit 1
fi

# パーミッションの設定
log_info "パーミッションを設定中..."
chmod -R 755 build
chown -R www-data:www-data build || log_warn "パーミッション設定に失敗しました（権限が必要です）"

# Nginxの設定をリロード（オプション）
if command -v nginx &> /dev/null; then
    log_info "Nginxの設定をテスト中..."
    if sudo nginx -t 2>/dev/null; then
        log_info "Nginxをリロード中..."
        sudo systemctl reload nginx || log_warn "Nginxのリロードに失敗しました"
    else
        log_warn "Nginx設定テストに失敗しました"
    fi
fi

log_info "✅ フロントエンドのデプロイが正常に完了しました！"

# デプロイ情報をログに記録
echo "$(date '+%Y-%m-%d %H:%M:%S') - Frontend deployment completed successfully" >> deploy.log

