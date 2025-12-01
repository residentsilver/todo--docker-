# Xserverレンタルサーバー向け CI/CD クイックスタート

このガイドでは、最短でCI/CDを構築する手順を説明します。

## 🎯 目標

`staging`ブランチにマージすると、自動的にXserverレンタルサーバーにデプロイされるようにする

## ⏱️ 所要時間

約30分

## 📋 チェックリスト

### 事前準備

- [ ] GitHubリポジトリでプロジェクトを管理している
- [ ] Xserverレンタルサーバーにデプロイ済み
- [ ] サーバーにgit連携済み
- [ ] SSH接続でデプロイ作業を実施済み

### 必要な情報

以下の情報を準備してください：

| 項目 | 例 |
|------|-----|
| サーバーのホスト名 | `sv16567.xserver.jp` |
| SSHユーザー名 | `ncbrynch` |
| バックエンドのパス | `/home/ncbrynch/sumaho-clinic.com/public_html/todo.sumaho-clinic.com/todo--docker-/todo-app/backend` |
| フロントエンドのパス | `/home/ncbrynch/sumaho-clinic.com/public_html/todo.sumaho-clinic.com/todo--docker-/todo-app/frontend` |
| APIのURL | `https://todo.sumaho-clinic.com/api` |

---

## 🚀 5ステップで完了

### ステップ1: SSH鍵の生成（5分）

**ローカルPCで実行：**

#### Windows PowerShellの場合

```powershell
# .sshディレクトリが存在しない場合は作成
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

# SSH鍵を生成（パスフレーズなし）
# パスフレーズを聞かれたら、何も入力せずにEnterを2回押す
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy"

# 秘密鍵の内容を表示（後でGitHub Secretsに登録）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy

# 公開鍵の内容を表示（後でサーバーに登録）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy.pub
```

**✅ 完了チェック：**
- [ ] 秘密鍵の内容をコピー（GitHub Secretsに登録するため）
- [ ] 公開鍵の内容をコピー（サーバーに登録するため）

---

### ステップ2: サーバー側の設定（10分）

**サーバーにSSH接続：**

```bash
ssh your-username@your-server.com
```

#### 2-1. 公開鍵を登録

```bash
# .sshディレクトリを作成
mkdir -p ~/.ssh

# 既存のauthorized_keysファイルがあるか確認
ls -la ~/.ssh/authorized_keys

# 既存のファイルがある場合：新しい公開鍵を追加（既存の鍵は残す）
# 方法1: echoコマンドで追記（推奨・自動的に改行が追加される）
echo "ssh-ed25519 AAAA...（ステップ1でコピーした公開鍵の内容）" >> ~/.ssh/authorized_keys

# 方法2: nanoエディタで手動追加
nano ~/.ssh/authorized_keys
→ ファイルの最後に移動（Ctrl + End または 最後の行に移動）
→ 改行を入れる（Enterキー）
→ ステップ1でコピーした公開鍵を貼り付け
→ Ctrl + X → Y → Enter で保存

# 既存のファイルがない場合：新規作成
nano ~/.ssh/authorized_keys
（ステップ1でコピーした公開鍵を貼り付け）

# パーミッションを設定
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 登録内容を確認（既存の鍵と新しい鍵の両方が表示される）
cat ~/.ssh/authorized_keys
```

**重要ポイント：**
- 既存の`authorized_keys`ファイルがある場合は、**上書きせずに追記**する
- `>>`を使用することで、既存の鍵を残したまま新しい鍵を追加できる
- **各公開鍵は1行に1つずつ記述する必要がある**（改行で区切る）
- `echo`コマンドを使う場合は自動的に改行が追加される
- `nano`エディタで手動追加する場合は、既存の鍵の後に**改行を入れてから**新しい鍵を貼り付ける
- 既存の鍵（git pull用など）と新しい鍵（GitHub Actions用）の両方が登録される

**ファイルの形式例：**
```
ssh-rsa AAAAB3NzaC1yc2EAAA..........（既存の鍵）
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAA..........（新しい鍵）
```

#### 2-2. GitリポジトリのURLをHTTPSに変更

```bash
# バックエンドディレクトリに移動
cd ~/todo-app/backend

# リモートURLをHTTPSに変更
git remote set-url origin https://github.com/residentsilver/todo--docker-.git

# 変更を確認
git remote -v
```

**✅ 完了チェック：**
- [ ] `git@github.com:...` → `https://github.com/...` に変更されている
- [ ] 現在のディレクトリのパスをメモ（例: `/home/ncbrynch/todo-app/backend`）

---

### ステップ3: デプロイスクリプトの配置（5分）

**サーバー上で実行：**

```bash
# バックエンドディレクトリに移動
cd ~/todo-app/backend

# デプロイスクリプトを作成
nano deploy.sh
```

以下の内容を貼り付け：

```bash
#!/bin/bash
set -e

echo "🚀 デプロイ開始..."

# メンテナンスモード
php artisan down --retry=60 || true

# 最新コードを取得
git fetch origin
git reset --hard origin/staging

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

```bash
# 実行権限を付与
chmod +x deploy.sh
```

**✅ 完了チェック：**
- [ ] `deploy.sh`が作成されている
- [ ] 実行権限が付与されている（`ls -la deploy.sh`で確認）

---

### ステップ4: GitHub Secretsの設定（10分）

**GitHubリポジトリで設定：**

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

2. 以下の6つのSecretsを登録：

| Secret名 | 値 |
|---------|-----|
| `STAGING_SSH_KEY` | ステップ1でコピーした秘密鍵の内容全体 |
| `STAGING_HOST` | サーバーのホスト名（例: `sv16567.xserver.jp`） |
| `STAGING_USER` | SSHユーザー名（例: `ncbrynch`） |
| `STAGING_BACKEND_PATH` | バックエンドのパス（例: `/home/ncbrynch/todo-app/backend`） |
| `STAGING_FRONTEND_PATH` | フロントエンドのパス（例: `/home/ncbrynch/todo-app/frontend`） |
| `STAGING_API_URL` | APIのURL（例: `https://staging.example.com/api`） |

**✅ 完了チェック：**
- [ ] 6つのSecretsがすべて登録されている
- [ ] 各Secretの値が正しい

---

### ステップ5: 動作確認（5分）

**ローカルPCで実行：**

```bash
# stagingブランチに切り替え
git checkout staging

# テスト用の変更を加える
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test: CI/CD deployment"
git push origin staging
```

**GitHub Actionsで確認：**

1. GitHubリポジトリの **Actions** タブを開く
2. 実行中のワークフローを確認
3. すべてのステップが成功（✓）になっているか確認

**✅ 完了チェック：**
- [ ] GitHub Actionsでワークフローが実行されている
- [ ] すべてのステップが成功している
- [ ] サーバーに最新のコードがデプロイされている

---

## 🎉 完了！

これで、`staging`ブランチにマージすると自動的にデプロイされるようになりました！

### 今後の使い方

```bash
# 1. 機能開発
git checkout -b feature/new-feature
# コードを編集...
git commit -am "Add new feature"
git push origin feature/new-feature

# 2. stagingブランチにマージ
git checkout staging
git merge feature/new-feature
git push origin staging
# → 自動的にデプロイされます！
```

---

## ❓ トラブルシューティング

### SSH接続エラー

```bash
# サーバー上で確認
cat ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Git fetchエラー

```bash
# サーバー上で実行
cd ~/todo-app/backend
git remote set-url origin https://github.com/residentsilver/todo--docker-.git
```

### デプロイスクリプトが見つからない

```bash
# サーバー上で確認
ls -la ~/todo-app/backend/deploy.sh
# GitHub SecretsのSTAGING_BACKEND_PATHが正しいか確認
```

詳細は [完全ガイド](RENTAL_SERVER_CI_CD_GUIDE.md) を参照してください。

---

## 📚 参考資料

- [完全セットアップガイド](RENTAL_SERVER_CI_CD_GUIDE.md)
- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)

