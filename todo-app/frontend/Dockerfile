FROM node:lts-alpine3.20

# 作業ディレクトリの設定
WORKDIR /app

# package.json と package-lock.json をコピー
COPY ./todo/package.json ./todo/package-lock.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションコードのコピー
COPY . .

# ポート3000を開放
EXPOSE 3000

# サーバーの起動
CMD ["npm", "start"]