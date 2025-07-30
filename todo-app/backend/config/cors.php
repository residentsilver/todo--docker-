<?php
    return [
        'paths' => ['api/*', 'sanctum/csrf-cookie'],
        'allowed_methods' => ['*'],
        'allowed_origins' => [
            'http://localhost:3000', 
            'http://127.0.0.1:3000',
            'https://todo.sumaho-clinic.com',  // 本番環境用ドメインを追加
            'https://glorious-comfort-staging.up.railway.app',  // Railwayのドメインを追加
            'https://todo-docker-tuy5.onrender.com',  // Renderのドメインを追加
            'https://todo-docker-frontend-x24h.onrender.com',  // 新しいRenderフロントエンドURL
        ],
        'allowed_origins_patterns' => [
            '/^https:\/\/.*\.onrender\.com$/',  // 全てのRender.comドメインを許可
            '/^https:\/\/.*\.up\.railway\.app$/',  // 全てのRailway.appドメインを許可
        ],
        'allowed_headers' => ['*'],
        'exposed_headers' => [],
        'max_age' => 0,
        'supports_credentials' => true,
    ];
?>