FROM node:lts-alpine3.20

# 作業ディレクトリの設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY ./todo/package.json ./todo/package-lock.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションコードのコピー
COPY ./todo ./

# ビルドの実行
RUN npm run build

# serve パッケージのインストール（プロダクション用）
RUN npm install -g serve

# ポート3000を開放
EXPOSE 3000

# ビルドされたアプリケーションの提供
CMD ["npm", "run", "serve"]