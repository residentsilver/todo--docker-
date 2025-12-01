#!/bin/bash
set -e

echo "🚀 デプロイ開始..."

# メンテナンスモード
php artisan down --retry=60 || true

# 最新コードを取得
git fetch origin
git reset --hard origin/staging

cd ../backend
# 依存関係をインストール
composer install --no-dev --optimize-autoloader --no-interaction

# キャッシュクリア
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# キャッシュ作成
php artisan config:cache
php artisan route:cache
php artisan view:cache

# マイグレーション
php artisan migrate --force

# 最適化
php artisan optimize

# パーミッション設定
chmod -R 775 storage bootstrap/cache

# メンテナンスモード解除
php artisan up

echo "✅ デプロイ完了！"
```

保存: `Ctrl + X` → `Y` → `Enter`