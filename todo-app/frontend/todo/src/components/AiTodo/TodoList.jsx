import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TodoItem from './TodoItem';
import TodoForm from './TodoForm';

/**
 * Todoリスト表示コンポーネント
 * 
 * @description 認証されたユーザーのTodoリストを表示し、管理機能を提供
 */
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const { authenticatedRequest, isAuthenticated } = useAuth();

  /**
   * 認証付きでTodoリストを取得する関数
   */
  const fetchTodos = async () => {
    if (!isAuthenticated) {
      console.error('認証が必要です。');
      return;
    }

    try {
      const data = await authenticatedRequest('/todos');
      setTodos(data);
    } catch (error) {
      console.error('Todoの取得に失敗しました。', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  // 認証されていない場合の表示
  if (!isAuthenticated) {
    return (
      <div className="todo-list">
        <h1>Todoアプリ</h1>
        <p>このページを表示するにはログインが必要です。</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      <h1>Todoアプリ</h1>
      <TodoForm fetchTodos={fetchTodos} />
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} fetchTodos={fetchTodos} />
      ))}
    </div>
  );
};

export default TodoList;