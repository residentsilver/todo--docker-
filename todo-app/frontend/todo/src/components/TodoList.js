import React from 'react';
import FetchTodos from './async/fetch';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';

const TodoList = () => {
  return (
    <FetchTodos>
      {({ todos, fetchTodos }) => (
        <div className="todo-list">
          <h1>Todoアプリ</h1>
          <TodoForm fetchTodos={fetchTodos} />
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} fetchTodos={fetchTodos} />
          ))}
        </div>
      )}
    </FetchTodos>
  );
};

export default TodoList;