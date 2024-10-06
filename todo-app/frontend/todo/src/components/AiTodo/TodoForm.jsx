import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent, List } from '@mui/material';


const TodoForm = ({ fetchTodos }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/todos', { title, description });
      setTitle('');
      setDescription('');
      fetchTodos();
    } catch (error) {
      console.error('Todoの作成に失敗しました。', error);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader title="test"></CardHeader>
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