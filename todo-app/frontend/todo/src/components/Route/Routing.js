import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodoList from '../AiTodo/TodoList';
import Home from '../ToDo/Home';
import DeletedTodos from '../ToDo/DeletedTodos';
import Menu from '../Layout/Menu';
import { QueryClient, QueryClientProvider } from 'react-query';
import { SearchProvider } from '../../contexts/SearchContext';
import { Box } from '@mui/material';
// import Index from '../Remind/Index.tsx';

/**
 * アプリケーションのルーティング設定
 * 
 * @description React Routerを使用してアプリケーションのルーティングを管理
 *              削除されたTodoページも含む。ハンバーガーメニューも統合
 *              検索機能をアプリケーション全体で利用可能
 * @author システム開発者
 * @version 1.3
 */

const client = new QueryClient;

function Routing() {
    return (
        <QueryClientProvider client={client}>
            <SearchProvider>
                <BrowserRouter>
                    <Box>
                        {/* ヘッダーとハンバーガーメニュー */}
                        <Menu />
                        
                        {/* メインコンテンツエリア */}
                        <Box component="main">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/youtube" element={<Home />} />
                                <Route path="/aiTodo" element={<TodoList />} />
                                <Route path="/todo-deleted" element={<DeletedTodos />} />
                                <Route path="/main" element={<Home />} />
                                {/* <Route path="/remind" element={<Index />} /> */}
                            </Routes>
                        </Box>
                    </Box>
                </BrowserRouter>
            </SearchProvider>
        </QueryClientProvider>
    );
}

export default Routing;