import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodoList from '../AiTodo/TodoList';
import Home from '../ToDo/Home';
import DeletedTodos from '../ToDo/DeletedTodos';
import { QueryClient, QueryClientProvider } from 'react-query';
// import Index from '../Remind/Index.tsx';


const client = new QueryClient;

function Routing() {
    return (
        <>
            <BrowserRouter>
                <QueryClientProvider client={client}>
                    <Routes>
                        <Route path="/youtube" element={<Home />} />
                        <Route path="/aiTodo" element={<TodoList />} />
                        <Route path="/todo-deleted" element={<DeletedTodos />} />
                        <Route path="/main" component={Home} />
                        {/* <Route path="/remind" component={Index} /> */}
                    </Routes>
                </QueryClientProvider>
            </BrowserRouter>
        </>
    );
}

export default Routing;