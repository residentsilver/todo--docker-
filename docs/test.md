# プルリクエスト用のテストワークフロー
# すべてのプルリクエストに対して自動的にテストを実行します
# 拡張子がyamlにすると、CI/CDとして機能する。本プロジェクトでは、テストが不要のためmd拡張子として、詳細を保存しておく。

name: Tests

on:
  pull_request:
    branches:
      - main
      - staging
      - develop

jobs:
  # バックエンド（Laravel）のテスト
  backend-tests:
    name: バックエンドテスト (Laravel)
    runs-on: ubuntu-latest

    steps:
      # リポジトリのチェックアウト
      - name: Checkout code
        uses: actions/checkout@v4

      # PHPのセットアップ
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, pdo, pdo_sqlite, sqlite3
          coverage: none

      # Composerの依存関係をキャッシュ
      - name: Cache Composer dependencies
        uses: actions/cache@v3
        with:
          path: todo-app/backend/vendor
          key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
          restore-keys: |
            ${{ runner.os }}-composer-

      # Composer依存関係のインストール
      - name: Install Composer dependencies
        working-directory: ./todo-app/backend
        run: composer install --prefer-dist --no-progress --no-interaction

      # .envファイルの準備
      - name: Prepare environment file
        working-directory: ./todo-app/backend
        run: |
          cp .env.example .env 2>/dev/null || echo "APP_KEY=" > .env
          echo "APP_ENV=testing" >> .env
          echo "DB_CONNECTION=sqlite" >> .env
          echo "DB_DATABASE=:memory:" >> .env

      # アプリケーションキーの生成
      - name: Generate application key
        working-directory: ./todo-app/backend
        run: php artisan key:generate

      # データベースのセットアップ
      - name: Run migrations
        working-directory: ./todo-app/backend
        run: php artisan migrate --force

      # PHPUnitテストの実行
      - name: Run PHPUnit tests
        working-directory: ./todo-app/backend
        run: vendor/bin/phpunit

      # Laravel Pintでコード品質チェック
      - name: Run Laravel Pint (Code Style)
        working-directory: ./todo-app/backend
        run: vendor/bin/pint --test

  # フロントエンド（React）のテスト
  frontend-tests:
    name: フロントエンドテスト (React)
    runs-on: ubuntu-latest

    steps:
      # リポジトリのチェックアウト
      - name: Checkout code
        uses: actions/checkout@v4

      # Node.jsのセットアップ
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      # npm依存関係をキャッシュ
      - name: Cache npm dependencies
        uses: actions/cache@v3
        with:
          path: |
            todo-app/frontend/todo/node_modules
            ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      # npm依存関係のインストール
      - name: Install npm dependencies
        working-directory: ./todo-app/frontend/todo
        run: npm ci

      # Jestテストの実行
      - name: Run Jest tests
        working-directory: ./todo-app/frontend/todo
        run: npm test -- --watchAll=false --coverage

      # ビルドテスト
      - name: Build test
        working-directory: ./todo-app/frontend/todo
        run: npm run build

      # ビルド成果物のアップロード（デバッグ用）
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: frontend-build
          path: todo-app/frontend/todo/build
          retention-days: 7





