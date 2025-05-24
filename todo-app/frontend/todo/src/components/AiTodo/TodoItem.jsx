import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Todoアイテム表示コンポーネント
 * 
 * @description 個別のTodoアイテムを表示し、完了状態の切り替えと削除機能を提供
 *              認証機能に対応
 */
const TodoItem = ({ todo, fetchTodos }) => {
  const { authenticatedRequest, isAuthenticated } = useAuth();

  /**
   * Todo完了状態を切り替える関数
   */
  const toggleCompleted = async () => {
    if (!isAuthenticated) {
      console.error('認証が必要です。');
      return;
    }

    try {
      await authenticatedRequest(`/todos/${todo.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          completed: !todo.completed,
        }),
      });
      fetchTodos();
    } catch (error) {
      console.error('Todoの完了状態を更新できませんでした。', error);
    }
  };

  /**
   * Todoを削除する関数
   */
  const deleteTodo = async () => {
    if (!isAuthenticated) {
      console.error('認証が必要です。');
      return;
    }

    try {
      await authenticatedRequest(`/todos/${todo.id}`, {
        method: 'DELETE',
      });
      fetchTodos();
    } catch (error) {
      console.error('Todoを削除できませんでした。', error);
    }
  };

  // 認証されていない場合は何も表示しない
  if (!isAuthenticated) {
    return null;
  }

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