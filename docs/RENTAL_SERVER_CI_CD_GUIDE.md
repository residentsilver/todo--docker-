# Xserverレンタルサーバー向け CI/CD セットアップガイド

このガイドでは、Xserverレンタルサーバーへの自動デプロイを設定する手順を説明します。

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [ステップ1: SSH鍵の生成と登録](#ステップ1-ssh鍵の生成と登録)
4. [ステップ2: サーバー側の設定](#ステップ2-サーバー側の設定)
5. [ステップ3: GitHub Secretsの設定](#ステップ3-github-secretsの設定)
6. [ステップ4: デプロイスクリプトの配置](#ステップ4-デプロイスクリプトの配置)
7. [ステップ5: 動作確認](#ステップ5-動作確認)
8. [トラブルシューティング](#トラブルシューティング)

---

## 概要

### CI/CDの動作フロー

```
stagingブランチにマージ
        ↓
GitHub Actionsが自動起動
        ↓
依存関係のインストール
        ↓
ビルド実行
        ↓
SSH経由でサーバーに接続
        ↓
デプロイスクリプト実行
        ↓
自動デプロイ完了！ 🎉
```

### このガイドで実現すること

- ✅ `staging`ブランチへのマージで自動デプロイ
- ✅ 手動デプロイ作業の削減
- ✅ 一貫性のあるデプロイプロセス
- ✅ デプロイ履歴の可視化（GitHub Actions）

---

## 前提条件

### 既に完了していること

- ✅ GitHubリポジトリでプロジェクトを管理
- ✅ Xserverレンタルサーバーにデプロイ済み
- ✅ サーバーにgit連携済み
- ✅ `git clone`によりウェブ公開済み
- ✅ SSH接続でデプロイ作業を実施済み

### 必要な情報

以下の情報を準備してください：

| 項目 | 説明 | 例 |
|------|------|-----|
| **サーバーのホスト名** | Xserverのサーバー名 | `sv16567.xserver.jp` |
| **SSHユーザー名** | XserverのSSHユーザー名 | `ncbrynch` |
| **バックエンドのパス** | サーバー上のバックエンドディレクトリ | `~/todo-app/backend` |
| **フロントエンドのパス** | サーバー上のフロントエンドディレクトリ | `~/todo-app/frontend` |
| **APIのURL** | ステージング環境のAPI URL | `https://staging.example.com/api` |

---

## ステップ1: SSH鍵の生成と登録

### 1-1. ローカルPCでSSH鍵を生成

#### Windows PowerShellの場合

```powershell
# .sshディレクトリが存在しない場合は作成
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.ssh

# デプロイ専用のSSH鍵を生成
# パスフレーズを聞かれたら、何も入力せずにEnterを2回押す
ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$env:USERPROFILE\.ssh\github_actions_deploy"

# 秘密鍵の内容を表示（後でGitHub Secretsに登録）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy

# 公開鍵の内容を表示（後でサーバーに登録）
Get-Content $env:USERPROFILE\.ssh\github_actions_deploy.pub
```

#### macOS / Linuxの場合

```bash
# デプロイ専用のSSH鍵を生成
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# 秘密鍵の内容を表示（後でGitHub Secretsに登録）
cat ~/.ssh/github_actions_deploy

# 公開鍵の内容を表示（後でサーバーに登録）
cat ~/.ssh/github_actions_deploy.pub
```

**重要ポイント：**
- パスフレーズは設定しない（Enterを2回押す）
- 秘密鍵は後でGitHub Secretsに登録します
- 公開鍵はサーバーに登録します

### 1-2. 公開鍵をサーバーに登録

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# .sshディレクトリが存在しない場合は作成
mkdir -p ~/.ssh

# 既存のauthorized_keysファイルがあるか確認
ls -la ~/.ssh/authorized_keys

# 【重要】既存のファイルがある場合：新しい公開鍵を追加（既存の鍵は残す）
# ステップ1-1でコピーした公開鍵を既存のファイルに追記
echo "ssh-ed25519 AAAA...（ステップ1-1でコピーした公開鍵の内容）" >> ~/.ssh/authorized_keys

# 既存のファイルがない場合：新規作成
# nano ~/.ssh/authorized_keys
# （公開鍵の内容を貼り付け）

# パーミッションを設定（重要！）
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 登録内容を確認（既存の鍵と新しい鍵の両方が表示される）
cat ~/.ssh/authorized_keys
```

### 1-3. SSH接続のテスト

```bash
# ローカルPCから実行
ssh -i ~/.ssh/github_actions_deploy your-username@your-server.com

# 接続できれば成功
exit
```

---

## ステップ2: サーバー側の設定

### 2-1. GitリポジトリのURLをHTTPSに変更

レンタルサーバーではSSH接続ができない場合があるため、HTTPS URLに変更します。

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# バックエンドディレクトリに移動
cd ~/todo-app/backend
# または、実際のパスに移動
# cd /home/your-username/todo-app/backend

# 現在のリモートURLを確認
git remote -v

# HTTPS URLに変更
git remote set-url origin https://github.com/residentsilver/todo--docker-.git

# 変更を確認
git remote -v
```

**確認ポイント：**
- `git@github.com:...` → `https://github.com/...` に変更されていること

### 2-2. プライベートリポジトリの場合

リポジトリがプライベートの場合、Personal Access Tokenが必要です。

```bash
# GitHubでPersonal Access Tokenを生成
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# 必要な権限: repo (Full control of private repositories)

# リモートURLにトークンを埋め込む
git remote set-url origin https://YOUR_TOKEN@github.com/residentsilver/todo--docker-.git
```

### 2-3. デプロイスクリプトの配置場所を確認

```bash
# サーバー上で実行
# バックエンドディレクトリに移動
cd ~/todo-app/backend

# 現在のディレクトリのパスを確認
pwd
# 例: /home/ncbrynch/todo-app/backend

# このパスをメモしておく（後でGitHub Secretsに登録）
```

---

## ステップ3: GitHub Secretsの設定

GitHubリポジトリで機密情報を登録します。

### 3-1. GitHub Secretsの設定場所

1. GitHubリポジトリのページを開く
2. **Settings** をクリック
3. 左メニューから **Secrets and variables** → **Actions** を選択
4. **New repository secret** をクリック

### 3-2. 登録するSecrets一覧

以下のSecretsを順番に登録してください：

| Secret名 | 値 | 説明 |
|---------|-----|------|
| `STAGING_SSH_KEY` | ステップ1-1で表示した秘密鍵の内容全体 | `-----BEGIN OPENSSH PRIVATE KEY-----` から `-----END OPENSSH PRIVATE KEY-----` まで |
| `STAGING_HOST` | サーバーのホスト名 | 例: `sv16567.xserver.jp` |
| `STAGING_USER` | SSHユーザー名 | 例: `ncbrynch` |
| `STAGING_BACKEND_PATH` | バックエンドのパス | 例: `/home/ncbrynch/todo-app/backend` または `~/todo-app/backend` |
| `STAGING_FRONTEND_PATH` | フロントエンドのパス | 例: `/home/ncbrynch/todo-app/frontend` または `~/todo-app/frontend` |
| `STAGING_API_URL` | APIのURL | 例: `https://staging.example.com/api` |

### 3-3. 各Secretの登録方法

#### STAGING_SSH_KEY

1. **Name**: `STAGING_SSH_KEY`
2. **Secret**: ローカルPCで `cat ~/.ssh/github_actions_deploy` で表示した内容をそのまま貼り付け
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   （鍵の内容）
   -----END OPENSSH PRIVATE KEY-----
   ```
3. **Add secret** をクリック

#### STAGING_HOST

1. **Name**: `STAGING_HOST`
2. **Secret**: サーバーのホスト名（例: `sv16567.xserver.jp`）
3. **Add secret** をクリック

#### STAGING_USER

1. **Name**: `STAGING_USER`
2. **Secret**: SSHユーザー名（例: `ncbrynch`）
3. **Add secret** をクリック

#### STAGING_BACKEND_PATH

1. **Name**: `STAGING_BACKEND_PATH`
2. **Secret**: ステップ2-3で確認したパス（例: `/home/ncbrynch/todo-app/backend`）
3. **Add secret** をクリック

#### STAGING_FRONTEND_PATH

1. **Name**: `STAGING_FRONTEND_PATH`
2. **Secret**: フロントエンドのパス（例: `/home/ncbrynch/todo-app/frontend`）
3. **Add secret** をクリック

#### STAGING_API_URL

1. **Name**: `STAGING_API_URL`
2. **Secret**: APIのURL（例: `https://staging.example.com/api`）
3. **Add secret** をクリック

### 3-4. 登録確認

**Settings** → **Secrets and variables** → **Actions** で、以下の6つのSecretsが登録されていることを確認：

- ✅ STAGING_SSH_KEY
- ✅ STAGING_HOST
- ✅ STAGING_USER
- ✅ STAGING_BACKEND_PATH
- ✅ STAGING_FRONTEND_PATH
- ✅ STAGING_API_URL

---

## ステップ4: デプロイスクリプトの配置

### 4-1. デプロイスクリプトの作成

サーバー上でデプロイスクリプトを作成します。

```bash
# サーバーにSSH接続
ssh your-username@your-server.com

# バックエンドディレクトリに移動
cd ~/todo-app/backend

# デプロイスクリプトを作成
nano deploy.sh
```

以下の内容を貼り付け：

```bash
#!/bin/bash

##############################################################################
# Laravel バックエンドのデプロイスクリプト（レンタルサーバー用）
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
git reset --hard origin/staging

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

# パーミッションの設定（レンタルサーバーではchownが使えないためchmodのみ）
log_info "パーミッションを設定中..."
chmod -R 775 storage bootstrap/cache

# メンテナンスモードを解除
log_info "メンテナンスモードを解除..."
php artisan up

log_info "✅ デプロイが正常に完了しました！"

# デプロイ情報をログに記録
echo "$(date '+%Y-%m-%d %H:%M:%S') - Deployment completed successfully" >> deploy.log
```

保存方法：
- `Ctrl + X` → `Y` → `Enter`

### 4-2. 実行権限を付与

```bash
# 実行権限を付与
chmod +x deploy.sh

# 確認
ls -la deploy.sh
# -rwxr-xr-x と表示されればOK（xが実行権限）
```

---

## ステップ5: 動作確認

### 5-1. ワークフローファイルの確認

GitHubリポジトリの `.github/workflows/deploy-staging.yml` が正しく設定されているか確認します。

**確認ポイント：**
- `staging`ブランチへのpushでトリガーされること
- テストステップが削除されていること（要件により不要）

### 5-2. 初回デプロイの実行

```bash
# ローカルPCで実行
# stagingブランチに切り替え
git checkout staging

# 何か小さな変更を加える（テスト用）
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test: CI/CD deployment"
git push origin staging
```

### 5-3. GitHub Actionsで確認

1. GitHubリポジトリのページを開く
2. **Actions** タブをクリック
3. 実行中のワークフローを確認
4. 各ステップのログを確認

**成功の確認：**
- ✅ すべてのステップが緑色（✓）になっている
- ✅ "デプロイが正常に完了しました！" というメッセージが表示されている

### 5-4. サーバー側での確認

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

---

## トラブルシューティング

### 問題1: SSH接続エラー

**エラーメッセージ：**
```
Permission denied (publickey)
```

**解決方法：**

1. **公開鍵が正しく登録されているか確認**
   ```bash
   # サーバー上で実行
   cat ~/.ssh/authorized_keys
   ```

2. **パーミッションを確認**
   ```bash
   # サーバー上で実行
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **GitHub SecretsのSSH鍵を確認**
   - 秘密鍵の内容が正しく登録されているか
   - 先頭と末尾の改行が含まれているか

### 問題2: Git fetchエラー

**エラーメッセージ：**
```
git@github.com: Permission denied (publickey)
```

**解決方法：**

1. **GitリポジトリのURLをHTTPSに変更**
   ```bash
   # サーバー上で実行
   cd ~/todo-app/backend
   git remote set-url origin https://github.com/residentsilver/todo--docker-.git
   git remote -v
   ```

2. **プライベートリポジトリの場合**
   - Personal Access Tokenを使用してURLに埋め込む

### 問題3: パーミッションエラー

**エラーメッセージ：**
```
chown: changing ownership of 'storage': Operation not permitted
```

**解決方法：**

レンタルサーバーでは`chown`が使えないため、デプロイスクリプトから`chown`コマンドを削除します。

```bash
# デプロイスクリプトを編集
nano ~/todo-app/backend/deploy.sh

# chownの行を削除またはコメントアウト
# chown -R www-data:www-data storage bootstrap/cache || log_warn "..."
```

### 問題4: デプロイスクリプトが見つからない

**エラーメッセージ：**
```
deploy.sh: No such file or directory
```

**解決方法：**

1. **デプロイスクリプトの場所を確認**
   ```bash
   # サーバー上で実行
   ls -la ~/todo-app/backend/deploy.sh
   ```

2. **GitHub Secretsのパスを確認**
   - `STAGING_BACKEND_PATH`が正しいパスになっているか
   - 絶対パス（`/home/username/...`）を使用することを推奨

### 問題5: Composerエラー

**エラーメッセージ：**
```
composer: command not found
```

**解決方法：**

1. **Composerがインストールされているか確認**
   ```bash
   # サーバー上で実行
   which composer
   composer --version
   ```

2. **Composerのパスを確認**
   - レンタルサーバーでは、Composerが特定のパスにインストールされている場合があります

---

## よくある質問（FAQ）

### Q1: デプロイにどのくらい時間がかかりますか？

**A:** 通常、5〜10分程度です。依存関係のインストールやビルドに時間がかかります。

### Q2: デプロイ中にサイトは使えますか？

**A:** デプロイスクリプトでメンテナンスモードを有効化しているため、一時的にアクセスできなくなります。通常は1〜2分程度です。

### Q3: デプロイをロールバックするには？

**A:** サーバー上で以下のコマンドを実行：

```bash
cd ~/todo-app/backend
git reset --hard HEAD~1
bash deploy.sh
```

### Q4: 複数の環境（ステージング・本番）を管理するには？

**A:** 別々のGitHub Secretsを設定し、異なるブランチ（`staging`、`main`）でトリガーするワークフローを作成します。

---

## 次のステップ

### 推奨される改善

1. **デプロイ通知の設定**
   - Slackやメールでデプロイ完了を通知

2. **ヘルスチェックの追加**
   - デプロイ後に自動的にサイトの動作確認

3. **ロールバック機能の追加**
   - 問題発生時に自動的に前のバージョンに戻す

4. **デプロイ履歴の管理**
   - どのバージョンがデプロイされているか追跡

---

## まとめ

このガイドに従うことで、以下のことが実現できます：

- ✅ `staging`ブランチへのマージで自動デプロイ
- ✅ 手動デプロイ作業の削減
- ✅ 一貫性のあるデプロイプロセス
- ✅ デプロイ履歴の可視化

**デプロイの流れ：**
1. コードを`staging`ブランチにマージ
2. GitHub Actionsが自動的に起動
3. サーバーに自動デプロイ
4. 完了！

問題が発生した場合は、[トラブルシューティング](#トラブルシューティング)セクションを参照してください。

---

## 参考資料

- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [Xserver公式ドキュメント](https://www.xserver.ne.jp/manual/)

