import React, { useState, useEffect } from 'react';
import './DeletedTodos.css';

/**
 * 削除されたTodoアイテム表示コンポーネント
 * 
 * @description ソフトデリートされたTodoアイテムとその詳細を表示し、
 *              復元機能を提供するコンポーネント。削除されたTodoDetailのみの場合も対応
 * @author システム開発者
 * @version 1.0
 */
const DeletedTodos = () => {
    // 状態管理
    const [deletedData, setDeletedData] = useState({
        deleted_todos: [],
        todos_with_deleted_details: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restoring, setRestoring] = useState(null);

    /**
     * 削除されたTodoアイテムを取得する関数
     */
    const fetchDeletedTodos = async () => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch('/api/todos-deleted');
            const data = await response.json();
            
            if (data.success) {
                setDeletedData(data.data);
            } else {
                setError(data.message || '削除されたTodoアイテムの取得に失敗しました。');
            }
        } catch (err) {
            console.error('削除されたTodo取得エラー:', err);
            setError('サーバーとの通信に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Todoアイテムを復元する関数
     * 
     * @param {number} todoId - 復元するTodoのID
     */
    const restoreTodo = async (todoId) => {
        try {
            setRestoring(`todo-${todoId}`);
            setError('');
            
            const response = await fetch(`/api/todos/${todoId}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 復元されたTodoを削除済みリストから除去
                setDeletedData(prev => ({
                    ...prev,
                    deleted_todos: prev.deleted_todos.filter(todo => todo.id !== todoId)
                }));
                alert('Todoアイテムが正常に復元されました。');
            } else {
                setError(data.message || 'Todoアイテムの復元に失敗しました。');
            }
        } catch (err) {
            console.error('Todo復元エラー:', err);
            setError('復元処理中にエラーが発生しました。');
        } finally {
            setRestoring(null);
        }
    };

    /**
     * TodoDetailを復元する関数
     * 
     * @param {number} todoId - 親TodoのID
     * @param {number} detailId - 復元するTodoDetailのID
     */
    const restoreTodoDetail = async (todoId, detailId) => {
        try {
            setRestoring(`detail-${detailId}`);
            setError('');
            
            const response = await fetch(`/api/todos/${todoId}/details/${detailId}/restore`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 復元されたTodoDetailを更新
                setDeletedData(prev => ({
                    ...prev,
                    todos_with_deleted_details: prev.todos_with_deleted_details.map(todo => {
                        if (todo.id === todoId) {
                            return {
                                ...todo,
                                deleted_todo_details: todo.deleted_todo_details.filter(detail => detail.id !== detailId)
                            };
                        }
                        return todo;
                    }).filter(todo => todo.deleted_todo_details.length > 0) // 削除済み詳細がなくなったTodoは除去
                }));
                alert('Todo詳細が正常に復元されました。');
            } else {
                setError(data.message || 'Todo詳細の復元に失敗しました。');
            }
        } catch (err) {
            console.error('TodoDetail復元エラー:', err);
            setError('復元処理中にエラーが発生しました。');
        } finally {
            setRestoring(null);
        }
    };

    /**
     * 日時フォーマット関数
     * 
     * @param {string} dateString - フォーマットする日時文字列
     * @returns {string} フォーマットされた日時文字列
     */
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // コンポーネントマウント時に削除されたTodoを取得
    useEffect(() => {
        fetchDeletedTodos();
    }, []);

    if (loading) {
        return (
            <div className="deleted-todos-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>削除されたTodoアイテムを読み込み中...</p>
                </div>
            </div>
        );
    }

    const hasDeletedItems = deletedData.deleted_todos.length > 0 || deletedData.todos_with_deleted_details.length > 0;

    return (
        <div className="deleted-todos-container">
            <div className="deleted-todos-header">
                <h1>削除されたTodoアイテム</h1>
                <button 
                    className="refresh-button"
                    onClick={fetchDeletedTodos}
                    disabled={loading}
                >
                    🔄 更新
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {!hasDeletedItems ? (
                <div className="no-data">
                    <p>削除されたTodoアイテムはありません。</p>
                </div>
            ) : (
                <div className="deleted-todos-list">
                    {/* 削除されたTodo */}
                    {deletedData.deleted_todos.length > 0 && (
                        <div className="section">
                            <h2 className="section-title">🗑️ 削除されたTodo</h2>
                            {deletedData.deleted_todos.map(todo => (
                                <div key={`todo-${todo.id}`} className="deleted-todo-item">
                                    <div className="todo-header">
                                        <h3 className="todo-title">{todo.title || '無題のTodo'}</h3>
                                        <div className="todo-meta">
                                            <span className="deleted-date">
                                                削除日時: {formatDate(todo.deleted_at)}
                                            </span>
                                            <button
                                                className="restore-button"
                                                onClick={() => restoreTodo(todo.id)}
                                                disabled={restoring === `todo-${todo.id}`}
                                            >
                                                {restoring === `todo-${todo.id}` ? '復元中...' : '🔄 復元'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Todo詳細情報 */}
                                    {todo.todo_details && todo.todo_details.length > 0 && (
                                        <div className="todo-details">
                                            <h4>詳細情報:</h4>
                                            <ul className="todo-details-list">
                                                {todo.todo_details.map(detail => (
                                                    <li key={detail.id} className="todo-detail-item">
                                                        <div className="detail-content">
                                                            <span className={`detail-status ${detail.completed ? 'completed' : 'pending'}`}>
                                                                {detail.completed ? '✅' : '⏳'}
                                                            </span>
                                                            <span className="detail-description">
                                                                {detail.description || '説明なし'}
                                                            </span>
                                                            <span className="detail-order">
                                                                順序: {detail.order}
                                                            </span>
                                                        </div>
                                                        {detail.deleted_at && (
                                                            <div className="detail-deleted-date">
                                                                詳細削除日時: {formatDate(detail.deleted_at)}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 削除されたTodoDetailを持つ未削除のTodo */}
                    {deletedData.todos_with_deleted_details.length > 0 && (
                        <div className="section">
                            <h2 className="section-title">📋 削除された詳細を持つTodo</h2>
                            {deletedData.todos_with_deleted_details.map(todo => (
                                <div key={`todo-details-${todo.id}`} className="deleted-todo-item active-todo">
                                    <div className="todo-header">
                                        <h3 className="todo-title active-title">
                                            {todo.title || '無題のTodo'} 
                                            <span className="active-badge">アクティブ</span>
                                        </h3>
                                    </div>

                                    {/* 現在のTodo詳細情報 */}
                                    {todo.todo_details && todo.todo_details.length > 0 && (
                                        <div className="todo-details">
                                            <h4>📝 現在の詳細情報:</h4>
                                            <ul className="todo-details-list">
                                                {todo.todo_details.map(detail => (
                                                    <li key={detail.id} className="todo-detail-item active-detail">
                                                        <div className="detail-content">
                                                            <span className={`detail-status ${detail.completed ? 'completed' : 'pending'}`}>
                                                                {detail.completed ? '✅' : '⏳'}
                                                            </span>
                                                            <span className="detail-description">
                                                                {detail.description || '説明なし'}
                                                            </span>
                                                            <span className="detail-order">
                                                                順序: {detail.order}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* 削除されたTodo詳細情報 */}
                                    {todo.deleted_todo_details && todo.deleted_todo_details.length > 0 && (
                                        <div className="todo-details deleted-details">
                                            <h4>🗑️ 削除された詳細情報:</h4>
                                            <ul className="todo-details-list">
                                                {todo.deleted_todo_details.map(detail => (
                                                    <li key={detail.id} className="todo-detail-item deleted-detail">
                                                        <div className="detail-content">
                                                            <span className={`detail-status ${detail.completed ? 'completed' : 'pending'}`}>
                                                                {detail.completed ? '✅' : '⏳'}
                                                            </span>
                                                            <span className="detail-description">
                                                                {detail.description || '説明なし'}
                                                            </span>
                                                            <span className="detail-order">
                                                                順序: {detail.order}
                                                            </span>
                                                            <button
                                                                className="restore-detail-button"
                                                                onClick={() => restoreTodoDetail(todo.id, detail.id)}
                                                                disabled={restoring === `detail-${detail.id}`}
                                                            >
                                                                {restoring === `detail-${detail.id}` ? '復元中...' : '🔄 復元'}
                                                            </button>
                                                        </div>
                                                        <div className="detail-deleted-date">
                                                            詳細削除日時: {formatDate(detail.deleted_at)}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeletedTodos; 