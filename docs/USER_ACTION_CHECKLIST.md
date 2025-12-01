# CI/CD構築 - ユーザーが行うべきことチェックリスト

このドキュメントは、初めてCI/CDを構築する方向けに、**あなたが実際に行うべき作業**をまとめています。

## 📋 全体の流れ

```
1. SSH鍵の生成と登録
   ↓
2. サーバー側の設定
   ↓
3. デプロイスクリプトの配置
   ↓
4. GitHub Secretsの設定
   ↓
5. 動作確認
```

---

## ✅ ステップ1: SSH鍵の生成と登録

### 1-1. ローカルPCでSSH鍵を生成

**作業場所：** ローカルPC（あなたのパソコン）

#### Windows PowerShellの場合

**実行するコマンド：**

```powershell
# .sshディレクトリが存在しない場合は作成
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

# SSH鍵を生成（パスフレーズを聞かれたら、何も入力せずにEnterを2回押す）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy"
```

**確認：**
- [ ] コマンドが正常に完了した
- [ ] パスフレーズを聞かれたら、何も入力せずにEnterを2回押した

**次に実行：**

```powershell
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy
```

**やること：**
- [ ] 表示された内容を**すべてコピー**（秘密鍵）
- [ ] テキストファイルに保存しておく（後でGitHub Secretsに登録）

**次に実行：**

```powershell
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy.pub
```

#### macOS / Linuxの場合

**実行するコマンド：**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
```

**確認：**
- [ ] コマンドが正常に完了した

**次に実行：**

```bash
cat ~/.ssh/github_actions_deploy
```

**やること：**
- [ ] 表示された内容を**すべてコピー**（秘密鍵）
- [ ] テキストファイルに保存しておく（後でGitHub Secretsに登録）

**次に実行：**

```bash
cat ~/.ssh/github_actions_deploy.pub
```

**やること：**
- [ ] 表示された内容を**すべてコピー**（公開鍵）
- [ ] テキストファイルに保存しておく（後でサーバーに登録）

---

### 1-2. サーバーに公開鍵を登録

**作業場所：** サーバー（Xserver）

**実行するコマンド：**

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# .sshディレクトリを作成
mkdir -p ~/.ssh

# 既存のauthorized_keysファイルがあるか確認
ls -la ~/.ssh/authorized_keys

# 【重要】既存のファイルがある場合：新しい公開鍵を追加（既存の鍵は残す）
# ステップ1-1でコピーした公開鍵を既存のファイルに追記
echo "ssh-ed25519 AAAA...（ステップ1-1でコピーした公開鍵の内容）" >> ~/.ssh/authorized_keys

# 既存のファイルがない場合：新規作成
# nano ~/.ssh/authorized_keys
# （ステップ1-1でコピーした公開鍵を貼り付け）
```

**やること：**
- [ ] 既存の`authorized_keys`ファイルがあるか確認した
- [ ] 既存のファイルがある場合は、`echo`コマンドで追記した（上書きしない）
- [ ] 既存のファイルがない場合は、`nano`で新規作成した

**次に実行：**

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 登録内容を確認（既存の鍵と新しい鍵の両方が表示される）
cat ~/.ssh/authorized_keys
```

**確認：**
- [ ] 既存の鍵（git pull用など）と新しい鍵（GitHub Actions用）の両方が表示されている

**確認：**
- [ ] コマンドが正常に完了した

---

### 1-3. SSH接続のテスト

**作業場所：** ローカルPC

**実行するコマンド：**

```bash
ssh -i ~/.ssh/github_actions_deploy your-username@your-server.com
```

**確認：**
- [ ] サーバーに接続できた
- [ ] `exit` で接続を切断できた

**もし接続できない場合：**
- ステップ1-2の公開鍵登録を再確認
- パーミッション（`chmod`）を再確認

---

## ✅ ステップ2: サーバー側の設定

### 2-1. GitリポジトリのURLを確認・変更

**作業場所：** サーバー

**実行するコマンド：**

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# バックエンドディレクトリに移動
cd ~/todo-app/backend
# または、実際のパスに移動
# cd /home/your-username/todo-app/backend

# 現在のリモートURLを確認
git remote -v
```

**確認：**
- [ ] `git@github.com:...` と表示されている（SSH URL）

**次に実行：**

```bash
# HTTPS URLに変更
git remote set-url origin https://github.com/residentsilver/todo--docker-.git

# 変更を確認
git remote -v
```

**確認：**
- [ ] `https://github.com/...` と表示されている（HTTPS URL）

---

### 2-2. 現在のディレクトリパスを確認

**作業場所：** サーバー

**実行するコマンド：**

```bash
# 現在のディレクトリのパスを確認
pwd
```

**やること：**
- [ ] 表示されたパスをメモ（例: `/home/ncbrynch/todo-app/backend`）
- [ ] 後でGitHub Secretsに登録するため、保存しておく

---

## ✅ ステップ3: デプロイスクリプトの配置

### 3-1. デプロイスクリプトを作成

**作業場所：** サーバー

**実行するコマンド：**

```bash
# バックエンドディレクトリに移動
cd ~/todo-app/backend

# デプロイスクリプトを作成
nano deploy.sh
```

**やること：**
- [ ] エディタが開いたら、以下の内容を貼り付け：

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

- [ ] `Ctrl + X` → `Y` → `Enter` で保存

**次に実行：**

```bash
# 実行権限を付与
chmod +x deploy.sh

# 確認
ls -la deploy.sh
```

**確認：**
- [ ] `-rwxr-xr-x` と表示されている（`x`が実行権限）

---

## ✅ ステップ4: GitHub Secretsの設定

### 4-1. GitHub Secretsの設定場所を開く

**作業場所：** GitHub（ブラウザ）

**やること：**
1. [ ] GitHubリポジトリのページを開く
2. [ ] **Settings** タブをクリック
3. [ ] 左メニューから **Secrets and variables** → **Actions** を選択
4. [ ] **New repository secret** ボタンをクリック

---

### 4-2. STAGING_SSH_KEY を登録

**Name（名前）：**
```
STAGING_SSH_KEY
```

**Secret（値）：**
- ステップ1-1でコピーした**秘密鍵の内容全体**を貼り付け
- `-----BEGIN OPENSSH PRIVATE KEY-----` から `-----END OPENSSH PRIVATE KEY-----` まで

**やること：**
- [ ] Nameに `STAGING_SSH_KEY` を入力
- [ ] Secretに秘密鍵の内容を貼り付け
- [ ] **Add secret** ボタンをクリック

---

### 4-3. STAGING_HOST を登録

**Name（名前）：**
```
STAGING_HOST
```

**Secret（値）：**
- サーバーのホスト名（例: `sv16567.xserver.jp`）

**やること：**
- [ ] Nameに `STAGING_HOST` を入力
- [ ] Secretにサーバーのホスト名を入力
- [ ] **Add secret** ボタンをクリック

---

### 4-4. STAGING_USER を登録

**Name（名前）：**
```
STAGING_USER
```

**Secret（値）：**
- SSHユーザー名（例: `ncbrynch`）

**やること：**
- [ ] Nameに `STAGING_USER` を入力
- [ ] SecretにSSHユーザー名を入力
- [ ] **Add secret** ボタンをクリック

---

### 4-5. STAGING_BACKEND_PATH を登録

**Name（名前）：**
```
STAGING_BACKEND_PATH
```

**Secret（値）：**
- ステップ2-2でメモしたパス（例: `/home/ncbrynch/todo-app/backend`）

**やること：**
- [ ] Nameに `STAGING_BACKEND_PATH` を入力
- [ ] Secretにバックエンドのパスを入力
- [ ] **Add secret** ボタンをクリック

---

### 4-6. STAGING_FRONTEND_PATH を登録

**Name（名前）：**
```
STAGING_FRONTEND_PATH
```

**Secret（値）：**
- フロントエンドのパス（例: `/home/ncbrynch/todo-app/frontend`）

**やること：**
- [ ] Nameに `STAGING_FRONTEND_PATH` を入力
- [ ] Secretにフロントエンドのパスを入力
- [ ] **Add secret** ボタンをクリック

---

### 4-7. STAGING_API_URL を登録

**Name（名前）：**
```
STAGING_API_URL
```

**Secret（値）：**
- APIのURL（例: `https://staging.example.com/api`）

**やること：**
- [ ] Nameに `STAGING_API_URL` を入力
- [ ] SecretにAPIのURLを入力
- [ ] **Add secret** ボタンをクリック

---

### 4-8. 登録確認

**確認：**
- [ ] 以下の6つのSecretsがすべて登録されている：
  - ✅ STAGING_SSH_KEY
  - ✅ STAGING_HOST
  - ✅ STAGING_USER
  - ✅ STAGING_BACKEND_PATH
  - ✅ STAGING_FRONTEND_PATH
  - ✅ STAGING_API_URL

---

## ✅ ステップ5: 動作確認

### 5-1. テストデプロイの実行

**作業場所：** ローカルPC

**実行するコマンド：**

```bash
# stagingブランチに切り替え
git checkout staging

# テスト用の変更を加える
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test: CI/CD deployment"
git push origin staging
```

**確認：**
- [ ] コマンドが正常に完了した

---

### 5-2. GitHub Actionsで確認

**作業場所：** GitHub（ブラウザ）

**やること：**
1. [ ] GitHubリポジトリのページを開く
2. [ ] **Actions** タブをクリック
3. [ ] 実行中のワークフローを確認
4. [ ] 各ステップのログを確認

**確認：**
- [ ] ワークフローが実行されている
- [ ] すべてのステップが成功（✓）になっている
- [ ] "デプロイが正常に完了しました！" というメッセージが表示されている

---

### 5-3. サーバー側での確認

**作業場所：** サーバー

**実行するコマンド：**

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# バックエンドディレクトリに移動
cd ~/todo-app/backend

# 最新のコミットを確認
git log -1

# デプロイログを確認
tail -n 20 deploy.log
```

**確認：**
- [ ] 最新のコミットが反映されている
- [ ] デプロイログに成功メッセージが表示されている

---

## 🎉 完了！

これで、`staging`ブランチにマージすると自動的にデプロイされるようになりました！

---

## 📚 参考資料

- [クイックスタートガイド](RENTAL_SERVER_QUICK_START.md) - 5ステップで完了
- [完全セットアップガイド](RENTAL_SERVER_CI_CD_GUIDE.md) - 詳細な説明とトラブルシューティング

---

## ❓ 困ったときは

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

詳細は [完全ガイド](RENTAL_SERVER_CI_CD_GUIDE.md) のトラブルシューティングセクションを参照してください。

