#!/bin/bash

##############################################################################
# ローカルテストスクリプト
#
# CI/CDパイプラインと同じテストをローカル環境で実行します
# デプロイ前の確認に使用してください
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

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

echo "=================================================="
echo "     ローカルテストを実行します"
echo "=================================================="
echo ""

# バックエンドテスト
log_step "1. バックエンド（Laravel）のテスト"
echo ""
cd backend

# Composer依存関係のチェック
if [ ! -d "vendor" ]; then
    log_info "Composer依存関係をインストール中..."
    composer install
else
    log_info "Composer依存関係は既にインストールされています"
fi

# .envファイルのチェック
if [ ! -f ".env" ]; then
    log_warn ".envファイルが存在しません。.env.exampleからコピーします..."
    cp .env.example .env
    php artisan key:generate
fi

# PHPUnitテストの実行
log_info "PHPUnitテストを実行中..."
vendor/bin/phpunit
log_info "✅ PHPUnitテストが成功しました"

# Laravel Pintでコードスタイルチェック
log_info "Laravel Pint（コードスタイル）チェック中..."
vendor/bin/pint --test || {
    log_warn "コードスタイルの問題が見つかりました"
    read -p "修正を適用しますか？ [y/N]: " answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        vendor/bin/pint
        log_info "コードスタイルを修正しました"
    fi
}

cd ..

# フロントエンドテスト
log_step "2. フロントエンド（React）のテスト"
echo ""
cd frontend/todo

# npm依存関係のチェック
if [ ! -d "node_modules" ]; then
    log_info "npm依存関係をインストール中..."
    npm install
else
    log_info "npm依存関係は既にインストールされています"
fi

# Jestテストの実行
log_info "Jestテストを実行中..."
CI=true npm test
log_info "✅ Jestテストが成功しました"

# ビルドテスト
log_info "ビルドテストを実行中..."
npm run build
log_info "✅ ビルドが成功しました"

cd ../..

# 完了メッセージ
echo ""
echo "=================================================="
log_info "✅ すべてのテストが成功しました！"
echo "=================================================="
echo ""
echo "次のステップ:"
echo "1. 変更をコミットしてください: git add . && git commit -m \"your message\""
echo "2. ブランチにプッシュしてください: git push"
echo "3. GitHub Actionsが自動的にテストとデプロイを実行します"
echo ""

