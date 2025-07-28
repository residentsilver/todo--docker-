import axios from 'axios';

/**
 * Axios設定
 * 
 * @description バックエンドAPIとの通信を管理するAxiosインスタンス
 *              認証トークンの自動付与、エラーハンドリングを含む
 */

// APIベースURL（Docker環境では backend:80 を使用）
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://todo.sumaho-clinic.com/api' 
    : 'http://localhost:8000/api';

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