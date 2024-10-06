import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Todoのデータを取得するコンポーネント
 */
const FetchTodos = ({ children }) => {
  const [todos, setTodos] = useState([]);

  /**
   * Todoのデータを取得する関数
   */
  const fetchTodos = async () => {
    try {
      const response = await axios.get('/api/todos');
      setTodos(response.data);
    } catch (error) {
      console.error('Todoの取得に失敗しました。', error);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return children({ todos, fetchTodos });
};

export default FetchTodos;