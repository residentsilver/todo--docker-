#!/bin/bash
set -e

echo "デプロイ開始..."

PHP_CMD="php8.3"

# メンテナンスモード
$PHP_CMD artisan down --retry=60 || true

# 最新コードを取得
git fetch origin
git reset --hard origin/staging
cd ../backend

# 依存関係をインストール（PHP 8.3を使用）
$PHP_CMD composer install --no-dev --optimize-autoloader --no-interaction

# キャッシュクリア
$PHP_CMD artisan cache:clear
$PHP_CMD artisan config:clear
$PHP_CMD artisan route:clear
$PHP_CMD artisan view:clear

# キャッシュ作成
$PHP_CMD artisan config:cache
$PHP_CMD artisan route:cache
$PHP_CMD artisan view:cache

# マイグレーション
$PHP_CMD artisan migrate --force

# 最適化
$PHP_CMD artisan optimize

# パーミッション設定
chmod -R 775 storage bootstrap/cache

# メンテナンスモード解除
$PHP_CMD artisan up

echo "デプロイ完了！"