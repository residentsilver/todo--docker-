import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TodoList from '../AiTodo/TodoList';
import Home from '../ToDo/Home';
import DeletedTodos from '../ToDo/DeletedTodos';
import Menu from '../Layout/Menu';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';
import ProfilePage from '../../pages/ProfilePage';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SearchProvider } from '../../contexts/SearchContext';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { Box } from '@mui/material';
// import Index from '../Remind/Index.tsx';

/**
 * アプリケーションのルーティング設定
 * 
 * @description React Routerを使用してアプリケーションのルーティングを管理
 *              削除されたTodoページも含む。ハンバーガーメニューも統合
 *              検索機能をアプリケーション全体で利用可能
 *              認証機能を統合し、ログイン/登録ページを追加
 */

const client = new QueryClient();

/**
 * 認証が必要なルートを保護するコンポーネント
 * 
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @returns {JSX.Element} 保護されたルートまたはログインページへのリダイレクト
 */
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <div>読み込み中...</div>
            </Box>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * 認証済みユーザーがアクセスできないルート（ログイン、登録ページ）
 * 
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @returns {JSX.Element} 子コンポーネントまたはホームページへのリダイレクト
 */
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <div>読み込み中...</div>
            </Box>
        );
    }

    return !isAuthenticated ? children : <Navigate to="/" replace />;
};

/**
 * 認証が必要なページのレイアウト
 * 
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 * @returns {JSX.Element} メニュー付きレイアウト
 */
const AuthenticatedLayout = ({ children }) => {
    return (
        <Box>
            {/* ヘッダーとハンバーガーメニュー */}
            <Menu />
            
            {/* メインコンテンツエリア */}
            <Box component="main">
                {children}
            </Box>
        </Box>
    );
};

function Routing() {
    return (
        <QueryClientProvider client={client}>
            <AuthProvider>
                <SearchProvider>
                    <BrowserRouter>
                        <Routes>
                            {/* 認証不要のルート */}
                            <Route 
                                path="/login" 
                                element={
                                    <PublicRoute>
                                        <LoginPage />
                                    </PublicRoute>
                                } 
                            />
                            <Route 
                                path="/register" 
                                element={
                                    <PublicRoute>
                                        <RegisterPage />
                                    </PublicRoute>
                                } 
                            />

                            {/* 認証が必要なルート */}
                            <Route 
                                path="/" 
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout>
                                            <Home />
                                        </AuthenticatedLayout>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/youtube" 
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout>
                                            <Home />
                                        </AuthenticatedLayout>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/aiTodo" 
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout>
                                            <TodoList />
                                        </AuthenticatedLayout>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/todo-deleted" 
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout>
                                            <DeletedTodos />
                                        </AuthenticatedLayout>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/main" 
                                element={
                                    <PrivateRoute>
                                        <AuthenticatedLayout>
                                            <Home />
                                        </AuthenticatedLayout>
                                    </PrivateRoute>
                                } 
                            />
                            <Route 
                                path="/profile" 
                                element={
                                    <PrivateRoute>
                                        <ProfilePage />
                                    </PrivateRoute>
                                } 
                            />
                            {/* <Route path="/remind" element={<Index />} /> */}

                            {/* 404ページ - 認証済みユーザーはホームへ、未認証はログインへ */}
                            <Route 
                                path="*" 
                                element={<Navigate to="/" replace />} 
                            />
                        </Routes>
                    </BrowserRouter>
                </SearchProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default Routing;