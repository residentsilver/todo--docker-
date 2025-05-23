import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodoList from '../AiTodo/TodoList';
import Home from '../ToDo/Home';
import DeletedTodos from '../ToDo/DeletedTodos';
import Menu from '../Layout/Menu';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Box } from '@mui/material';
// import Index from '../Remind/Index.tsx';

/**
 * アプリケーションのルーティング設定
 * 
 * @description React Routerを使用してアプリケーションのルーティングを管理
 *              削除されたTodoページも含む。ハンバーガーメニューも統合
 * @author システム開発者
 * @version 1.2
 */

const client = new QueryClient;

function Routing() {
    return (
        <QueryClientProvider client={client}>
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
        </QueryClientProvider>
    );
}

export default Routing;