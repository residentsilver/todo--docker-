#!/bin/bash
set -e

echo "デプロイ開始..."

# PHPコマンドを明示的にphp8.3に設定
PHP_CMD="php8.3"
echo "Using PHP: $($PHP_CMD -v | head -n 1)"

# ComposerコマンドもPHP 8.3を使用
COMPOSER_CMD="php8.3 $(which composer)"
echo "Using Composer: $($COMPOSER_CMD --version | head -n 1)"

# 現在のディレクトリを確認
echo "Current directory: $(pwd)"
echo "Checking for composer.json and artisan..."
if [ ! -f composer.json ]; then
  echo "Error: composer.json not found in current directory"
  ls -la
  exit 1
fi
if [ ! -f artisan ]; then
  echo "Error: artisan not found in current directory"
  ls -la
  exit 1
fi

# メンテナンスモード
$COMPOSER_CMD artisan down --retry=60 || true

# 最新コードを取得
git fetch origin
git reset --hard origin/staging
cd ../backend

# 依存関係をインストール（PHP 8.3を使用）
$COMPOSER_CMD install --no-dev --optimize-autoloader --no-interaction

# キャッシュクリア
$COMPOSER_CMD artisan cache:clear
$COMPOSER_CMD artisan config:clear
$COMPOSER_CMD artisan route:clear
$COMPOSER_CMD artisan view:clear

# キャッシュ作成
$COMPOSER_CMD artisan config:cache
$COMPOSER_CMD artisan route:cache
$COMPOSER_CMD artisan view:cache

# マイグレーション
$COMPOSER_CMD artisan migrate --force

# 最適化
$COMPOSER_CMD artisan optimize

# パーミッション設定
chmod -R 775 storage bootstrap/cache

# メンテナンスモード解除
$COMPOSER_CMD artisan up

echo "デプロイ完了！"