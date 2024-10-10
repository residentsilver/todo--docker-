import React, { Suspense, lazy } from 'react';
import '../App.css';
import Home from '../components/ToDo/Home';
import { Route } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      {/* <Suspense fallback={<div>読み込み中...</div>}> */}
        {/* <TodoList /> */}
        <Home />
      {/* </Suspense> */}
    </div>
  );
}

export default App;