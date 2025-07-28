# GitHub Actions セットアップガイド

## 概要
このドキュメントでは、GitHub Actionsを使用してstagingブランチへのプッシュ時にレンタルサーバーへの自動デプロイを設定する方法を説明します。

## 必要な設定

### 1. GitHub Secrets の設定

GitHubリポジトリの設定で以下のSecretsを設定してください：

#### 必須のSecrets
- `SERVER_HOST`: レンタルサーバーのホスト名またはIPアドレス
- `SERVER_USERNAME`: SSH接続用のユーザー名
- `SERVER_SSH_KEY`: SSH接続用の秘密鍵（プライベートキー）
- `SERVER_PORT`: SSH接続用のポート番号（通常は22）

### 2. GitHub Secrets の設定手順

1. GitHubリポジトリのページに移動
2. **Settings** タブをクリック
3. 左サイドバーから **Secrets and variables** → **Actions** を選択
4. **New repository secret** ボタンをクリック
5. 以下のSecretsを追加：

```
Name: SERVER_HOST
Value: your-server-hostname.com

Name: SERVER_USERNAME  
Value: your-username

Name: SERVER_SSH_KEY
Value: -----BEGIN OPENSSH PRIVATE KEY-----
        your-private-key-content
        -----END OPENSSH PRIVATE KEY-----

Name: SERVER_PORT
Value: 22
```

### 3. SSH鍵の生成と設定

#### サーバー側での設定
```bash
# SSH鍵を生成（サーバー上で実行）
ssh-keygen -t rsa -b 4096 -C "github-actions@example.com"

# 公開鍵をauthorized_keysに追加
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# 権限を設定
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### GitHub Secretsへの秘密鍵の追加
1. サーバー上で秘密鍵を表示：
```bash
cat ~/.ssh/id_rsa
```

2. 表示された内容全体を `SERVER_SSH_KEY` としてGitHub Secretsに追加

### 4. サーバー側の事前準備

#### レンタルサーバー対応のNode.jsインストール
レンタルサーバーではsudoコマンドが使えないため、NVM（Node Version Manager）を使用してユーザーレベルでNode.jsをインストールします：

```bash
# NVMのインストール（ユーザーレベル）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# シェルを再起動するか、以下のコマンドでNVMを有効化
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Node.js 18のインストール
nvm install 18
nvm use 18
nvm alias default 18

# インストールの確認
node --version
npm --version
```

#### Gitの設定（初回のみ）
```bash
git config --global user.name "GitHub Actions"
git config --global user.email "actions@github.com"
```

#### ディレクトリ構造の確認
```bash
# 作業ディレクトリの作成（必要に応じて）
mkdir -p /home/ncbrynch/sumaho-clinic.com/public_html/todo.sumaho-clinic.com/todo--docker-

# 公開ディレクトリの作成（必要に応じて）
mkdir -p /home/ncbrynch/sumaho-clinic.com/public_html/todo.sumaho-clinic.com/
```

### 5. レンタルサーバー特有の注意事項

#### 権限の制限
- sudoコマンドが使用できない
- システム全体のパッケージマネージャー（apt、yum等）が使用できない
- ユーザーのホームディレクトリ内でのみ作業可能

#### 対応策
- NVMを使用したユーザーレベルのNode.jsインストール
- 相対パスでの作業
- ユーザーが書き込み可能なディレクトリのみを使用

## ワークフローの動作

### トリガー条件
- `staging` ブランチへのプッシュ時に自動実行

### 実行される処理
1. **コードのチェックアウト**: GitHub Actions上でリポジトリをクローン
2. **Node.js環境のセットアップ**: Node.js 18をインストール
3. **依存関係のインストール**: `npm ci`で依存関係をインストール
4. **フロントエンドのビルド**: `npm run build`でビルドを実行
5. **サーバーへのデプロイ**: SSH経由でサーバーに接続し、以下の処理を実行：
   - 最新のコードを`git pull`で取得
   - NVMを使用したNode.jsの確認・インストール
   - フロントエンドのビルドを実行
   - ビルド結果を公開ディレクトリにコピー
   - 適切な権限を設定

## トラブルシューティング

### よくある問題と解決方法

#### 1. SSH接続エラー
- SSH鍵が正しく設定されているか確認
- サーバーのSSH設定で公開鍵認証が有効になっているか確認
- ファイアウォールでSSHポートが開放されているか確認

#### 2. 権限エラー
- サーバー上のディレクトリの権限を確認
- 必要に応じて`chmod`で権限を調整
- レンタルサーバーではユーザーのホームディレクトリ内でのみ作業

#### 3. Node.js/npmエラー（レンタルサーバー対応）
```bash
# NVMが正しくインストールされているか確認
ls -la ~/.nvm

# NVMを手動で有効化
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.jsの再インストール
nvm install 18
nvm use 18
```

#### 4. レンタルサーバー特有の問題
- **ディスク容量不足**: ホームディレクトリの容量を確認
- **メモリ不足**: ビルド時のメモリ使用量を監視
- **タイムアウト**: 長時間の処理はタイムアウトする可能性

### ログの確認方法
1. GitHubリポジトリの **Actions** タブでワークフローの実行状況を確認
2. 各ステップのログをクリックして詳細を確認
3. エラーが発生した場合は、エラーメッセージを確認して対応

## セキュリティに関する注意事項

1. **SSH鍵の管理**: 秘密鍵は絶対に公開しない
2. **権限の最小化**: 必要最小限の権限のみを付与
3. **定期的な鍵の更新**: セキュリティ向上のため定期的にSSH鍵を更新
4. **ログの監視**: デプロイログを定期的に確認

## カスタマイズ

### 環境変数の追加
必要に応じて、以下のような環境変数を追加できます：

```yaml
env:
  NODE_ENV: production
  REACT_APP_API_URL: https://api.example.com
```

### レンタルサーバー対応の追加デプロイステップ
バックエンドのデプロイやデータベースマイグレーションが必要な場合は、以下の点に注意してワークフローに追加のステップを追加できます：

- sudoコマンドは使用不可
- ユーザーレベルでの作業のみ
- 相対パスの使用
- ホームディレクトリ内での作業 