import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * 認証コンテキスト
 * 
 * @description ユーザー認証状態とトークン管理を提供するReactコンテキスト
 */

const AuthContext = createContext();

/**
 * 認証コンテキストを使用するためのカスタムフック
 * 
 * @returns {Object} 認証関連の状態と関数
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * 認証プロバイダーコンポーネント
 * 
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @returns {JSX.Element} 認証プロバイダー
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState(true);

    // API_BASE_URLを直接設定（環境変数が設定されていない場合のフォールバック）
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
    
    // デバッグ用：API_BASE_URLをコンソールに出力
    // console.log('AuthContext initialized with API_BASE_URL:', API_BASE_URL);
    // console.log('Environment REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    // console.log('Current window location:', window.location.href);

    /**
     * APIリクエストヘルパー関数
     * 
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} options - fetchオプション
     * @returns {Promise<Object>} APIレスポンス
     */
    const apiRequest = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            credentials: 'include',
            mode: 'cors',
            ...options,
        };

        // デバッグ情報をコンソールに出力
        // console.log('API Request Details:', {
        //     url,
        //     method: config.method || 'GET',
        //     API_BASE_URL,
        //     endpoint,
        //     hasToken: !!token,
        //     headers: config.headers,
        //     body: options.body ? 'Present' : 'None'
        // });

        try {
            const response = await fetch(url, config);
            
            // レスポンス情報をログ出力
            // console.log('API Response Details:', {
            //     url,
            //     actualUrl: response.url, // 実際にリクエストされたURL
            //     status: response.status,
            //     statusText: response.statusText,
            //     contentType: response.headers.get('content-type'),
            //     redirected: response.redirected
            // });
            
            // リダイレクトが発生した場合の警告
            // if (response.redirected) {
            //     console.warn('⚠️ Request was redirected:', {
            //         originalUrl: url,
            //         finalUrl: response.url
            //     });
            // }
            
            // レスポンスのContent-Typeを確認
            const contentType = response.headers.get('content-type');
            
            // HTMLレスポンスの場合（404エラーなど）
            if (contentType && contentType.includes('text/html')) {
                // console.error('HTMLレスポンスを受信:', {
                //     url,
                //     actualUrl: response.url,
                //     status: response.status,
                //     statusText: response.statusText
                // });
                
                if (response.status === 404) {
                    throw new Error('APIエンドポイントが見つかりません。サーバーの設定を確認してください。');
                } else if (response.status === 405) {
                    throw new Error(`HTTPメソッドが許可されていません。URL: ${response.url}, Method: ${config.method || 'GET'}`);
                } else if (response.status >= 500) {
                    throw new Error('サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。');
                } else {
                    throw new Error('予期しないエラーが発生しました。');
                }
            }

            // JSONレスポンスを期待
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // console.error('JSON解析エラー:', jsonError);
                // console.error('Response text:', await response.text());
                throw new Error('サーバーからの応答を解析できませんでした。');
            }

            if (!response.ok) {
                // Laravel バリデーションエラーの処理
                if (response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat();
                    throw new Error(errorMessages.join('\n'));
                }
                
                // その他のAPIエラー
                throw new Error(data.message || `HTTPエラー: ${response.status}`);
            }

            return data;
        } catch (error) {
            // console.error('API Request Error Details:', {
            //     url,
            //     error: error.message,
            //     stack: error.stack,
            //     name: error.name
            // });
            
            // ネットワークエラーの処理
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
            }
            
            // その他のエラーはそのまま再スロー
            throw error;
        }
    };

    /**
     * ユーザー登録
     * 
     * @param {Object} userData - ユーザー登録データ
     * @param {string} userData.name - ユーザー名
     * @param {string} userData.email - メールアドレス
     * @param {string} userData.password - パスワード
     * @param {string} userData.password_confirmation - パスワード確認
     * @returns {Promise<Object>} 登録結果
     */
    const register = async (userData) => {
        try {
            const data = await apiRequest('/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });

            setToken(data.access_token);
            setUser(data.user);
            localStorage.setItem('auth_token', data.access_token);

            return data;
        } catch (error) {
            throw error;
        }
    };

    /**
     * ユーザーログイン
     * 
     * @param {Object} credentials - ログイン認証情報
     * @param {string} credentials.login - メールアドレスまたはユーザー名
     * @param {string} credentials.password - パスワード
     * @returns {Promise<Object>} ログイン結果
     */
    const login = async (credentials) => {
        try {
            // emailパラメータをloginパラメータに変換
            const loginData = {
                login: credentials.email || credentials.login, // 後方互換性のためemailも受け付ける
                password: credentials.password,
            };

            const data = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify(loginData),
            });

            setToken(data.access_token);
            setUser(data.user);
            localStorage.setItem('auth_token', data.access_token);

            return data;
        } catch (error) {
            // console.error('ログインエラー:', error);
            
            // バリデーションエラーの場合、フィールド固有のエラーを含むオブジェクトを投げる
            if (error.message.includes('\n')) {
                // 複数のバリデーションエラーがある場合
                const errorLines = error.message.split('\n');
                const fieldErrors = {};
                let hasLoginError = false;
                
                errorLines.forEach(line => {
                    if (line.includes('メールアドレスまたはユーザー名')) {
                        fieldErrors.email = line;
                    } else if (line.includes('パスワードを入力')) {
                        fieldErrors.password = line;
                    } else if (line.includes('認証情報が一致しません')) {
                        hasLoginError = true;
                    }
                });
                
                if (hasLoginError) {
                    throw new Error('メールアドレス（またはユーザー名）またはパスワードが正しくありません。');
                } else if (Object.keys(fieldErrors).length > 0) {
                    const validationError = new Error('バリデーションエラー');
                    validationError.fieldErrors = fieldErrors;
                    throw validationError;
                }
            }
            
            // より具体的なエラーメッセージを提供
            if (error.message.includes('認証情報が一致しません')) {
                throw new Error('メールアドレス（またはユーザー名）またはパスワードが正しくありません。');
            } else if (error.message.includes('APIエンドポイントが見つかりません')) {
                throw new Error('ログイン機能が利用できません。管理者にお問い合わせください。');
            } else if (error.message.includes('ネットワークエラー')) {
                throw new Error('インターネット接続を確認してから再度お試しください。');
            } else if (error.message.includes('サーバーエラー')) {
                throw new Error('サーバーに問題が発生しています。しばらく時間をおいて再度お試しください。');
            }
            
            // その他のエラーはそのまま再スロー
            throw error;
        }
    };

    /**
     * ユーザーログアウト
     * 
     * @returns {Promise<void>}
     */
    const logout = async () => {
        try {
            if (token) {
                await apiRequest('/logout', {
                    method: 'POST',
                });
            }
        } catch (error) {
            // console.error('ログアウトエラー:', error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('auth_token');
        }
    };

    /**
     * 認証済みユーザー情報を取得
     * 
     * @returns {Promise<Object>} ユーザー情報
     */
    const fetchUser = async () => {
        try {
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await apiRequest('/me');
            setUser(data.user);
        } catch (error) {
            // console.error('ユーザー情報取得エラー:', error);
            // トークンが無効な場合はログアウト
            logout();
        } finally {
            setLoading(false);
        }
    };

    /**
     * 認証付きAPIリクエスト
     * 
     * @param {string} endpoint - APIエンドポイント
     * @param {Object} options - fetchオプション
     * @returns {Promise<Object>} APIレスポンス
     */
    const authenticatedRequest = async (endpoint, options = {}) => {
        if (!token) {
            throw new Error('認証が必要です');
        }
        return apiRequest(endpoint, options);
    };

    /**
     * プロフィール更新
     * 
     * @param {Object} profileData - プロフィール更新データ
     * @param {string} profileData.name - ユーザー名（オプション）
     * @param {string} profileData.email - メールアドレス（オプション）
     * @param {string} profileData.current_password - 現在のパスワード
     * @param {string} profileData.password - 新しいパスワード（オプション）
     * @param {string} profileData.password_confirmation - パスワード確認（オプション）
     * @returns {Promise<Object>} 更新結果
     */
    const updateProfile = async (profileData) => {
        try {
            console.log('Profile update request:', {
                endpoint: '/profile',
                method: 'PUT',
                hasToken: !!token,
                profileData: { ...profileData, current_password: '[HIDDEN]', password: '[HIDDEN]', password_confirmation: '[HIDDEN]' }
            });

            const data = await authenticatedRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });

            // ユーザー情報を更新
            setUser(data.user);

            console.log('Profile update successful:', data.message);
            return data;
        } catch (error) {
            console.error('Profile update error:', error);
            
            // バリデーションエラーの処理を改善
            if (error.message.includes('\n')) {
                const errorLines = error.message.split('\n');
                const fieldErrors = {};
                
                errorLines.forEach(line => {
                    // より詳細なフィールドマッピング
                    if (line.includes('現在のパスワード') || line.includes('current_password')) {
                        fieldErrors.current_password = line;
                    } else if (line.includes('パスワードは8文字以上') || line.includes('password.min')) {
                        fieldErrors.password = 'パスワードは8文字以上で入力してください。';
                    } else if (line.includes('パスワード確認が一致しません') || line.includes('password.confirmed')) {
                        fieldErrors.password_confirmation = 'パスワード確認が一致しません。';
                    } else if (line.includes('新しいパスワード') || line.includes('password.required')) {
                        fieldErrors.password = line;
                    } else if (line.includes('メールアドレス') || line.includes('email')) {
                        fieldErrors.email = line;
                    } else if (line.includes('ユーザー名') || line.includes('名前') || line.includes('name')) {
                        fieldErrors.name = line;
                    }
                });
                
                if (Object.keys(fieldErrors).length > 0) {
                    const validationError = new Error('バリデーションエラー');
                    validationError.fieldErrors = fieldErrors;
                    throw validationError;
                }
            }
            
            // 単一のエラーメッセージの場合も適切に処理
            if (error.message.includes('パスワードは8文字以上')) {
                const validationError = new Error('バリデーションエラー');
                validationError.fieldErrors = {
                    password: 'パスワードは8文字以上で入力してください。'
                };
                throw validationError;
            }
            
            if (error.message.includes('パスワード確認が一致しません')) {
                const validationError = new Error('バリデーションエラー');
                validationError.fieldErrors = {
                    password_confirmation: 'パスワード確認が一致しません。'
                };
                throw validationError;
            }
            
            throw error;
        }
    };

    /**
     * APIサーバー接続テスト
     */
    const testApiConnection = async () => {
        try {
            // 認証が不要なエンドポイントをテスト（存在しない場合は404が返る）
            const testUrl = `${API_BASE_URL}/test-connection`;
            // console.log('Testing API connection to:', testUrl);
            
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            
            // console.log('API Connection Test Result:', {
            //     url: testUrl,
            //     status: response.status,
            //     statusText: response.statusText,
            //     ok: response.ok
            // });
            
            // 404は正常（エンドポイントが存在しないが、サーバーは動作している）
            if (response.status === 404) {
                // console.log('✅ API server is running (404 is expected for test endpoint)');
            } else if (response.status === 500) {
                // console.error('❌ API server has internal error');
            } else {
                // console.log('API server responded with status:', response.status);
            }
        } catch (error) {
            // console.error('❌ API Connection Test Failed:', error.message);
            // console.error('Please ensure Laravel server is running on http://127.0.0.1:8000');
        }
    };

    // 初期化時にAPI接続テストを実行
    useEffect(() => {
        testApiConnection();
    }, []);

    // 初期化時にユーザー情報を取得
    useEffect(() => {
        fetchUser();
    }, [token]);

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        fetchUser,
        authenticatedRequest,
        isAuthenticated: !!user,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 