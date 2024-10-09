FROM php:8.2-apache

# PHPの拡張機能とComposerをインストール
RUN apt-get update && apt-get install -y \
    g++ \
    libicu-dev \
    libzip-dev \
    zip \
    zlib1g-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql intl zip opcache 

WORKDIR /var/www/html

# Composerのインストール
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Laravelの依存関係をインストール
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader

# Apacheの設定
RUN a2enmod rewrite
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# アプリケーションファイルをコピー
COPY . .

# Composerの最適化
RUN composer dump-autoload --optimize

# ストレージとキャッシュのパーミッション設定
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
