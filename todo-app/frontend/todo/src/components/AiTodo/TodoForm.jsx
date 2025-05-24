import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardContent, List } from '@mui/material';

/**
 * Todo作成フォームコンポーネント
 * 
 * @description 認証されたユーザーが新しいTodoを作成するためのフォーム
 */
const TodoForm = ({ fetchTodos }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { authenticatedRequest, isAuthenticated } = useAuth();

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      console.error('認証が必要です。');
      return;
    }

    try {
      await authenticatedRequest('/todos', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      setTitle('');
      setDescription('');
      fetchTodos();
    } catch (error) {
      console.error('Todoの作成に失敗しました。', error);
    }
  };

  // 認証されていない場合は何も表示しない
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader title="新しいTodoを追加"></CardHeader>
          <CardContent>
            <List>
              
        <label>タイトル:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      <div>
        <label>説明:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>
            </List>

            <button type="submit">追加</button>
        </CardContent>
    </Card>
    </form>
    </>
  );
};

export default TodoForm;