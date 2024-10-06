import React, { Suspense, lazy } from 'react';
import '../App.css';
import List from '../components/List';
// const TodoList = lazy(() => import('../components/TodoList'));

function App() {
  return (
    <div className="App">
      <Suspense fallback={<div>読み込み中...</div>}>
        {/* <TodoList /> */}
        <List />
      </Suspense>
    </div>
  );
}

export default App;