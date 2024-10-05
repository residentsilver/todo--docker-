import React, { useState } from 'react';
import axios from 'axios';

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
    <form onSubmit={handleSubmit}>
      <div>
        <label>タイトル:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label>説明:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
      </div>
      <button type="submit">追加</button>
    </form>
  );
};

export default TodoForm;