import axios from 'axios';

/**
 * Axios設定
 * 
 * @description バックエンドAPIとの通信を管理するAxiosインスタンス
 *              認証トークンの自動付与、エラーハンドリングを含む
 */

    // API_BASE_URLを設定（axios.jsと統一）
    const API_BASE_URL = process.env.REACT_APP_API_URL;

// デバッグ用（本番環境では削除）
// console.log('Environment:', {
//     REACT_APP_DEPLOY_ENV: process.env.REACT_APP_DEPLOY_ENV,
//     NODE_ENV: process.env.NODE_ENV,
//     API_BASE_URL: API_BASE_URL
// });

// Axiosインスタンスを作成
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// リクエストインターセプター（認証トークンを自動付与）
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // 認証エラーの場合、ローカルストレージをクリアしてログインページへ
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient; 