import React from 'react';
import axios from 'axios';

const TodoItem = ({ todo, fetchTodos }) => {
  const toggleCompleted = async () => {
    try {
      await axios.put(`/api/todos/${todo.id}`, {
        completed: !todo.completed,
      });
      fetchTodos();
    } catch (error) {
      console.error('Todoの完了状態を更新できませんでした。', error);
    }
  };

  const deleteTodo = async () => {
    try {
      await axios.delete(`/api/todos/${todo.id}`);
      fetchTodos();
    } catch (error) {
      console.error('Todoを削除できませんでした。', error);
    }
  };

  return (
    <div className="todo-item">
      <h3 style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.title}
      </h3>
      <p>{todo.description}</p>
      <button onClick={toggleCompleted}>
        {todo.completed ? '未完了にする' : '完了にする'}
      </button>
      <button onClick={deleteTodo}>削除</button>
    </div>
  );
};

export default TodoItem;