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
        ],
        'allowed_origins_patterns' => [],
        'allowed_headers' => ['*'],
        'exposed_headers' => [],
        'max_age' => 0,
        'supports_credentials' => true,
    ];
?>