import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DeletedTodos.css';

/**
 * 削除されたTodoアイテム表示コンポーネント
 * 
 * @description ソフトデリートされたTodoアイテムとその詳細を表示し、
 *              復元機能を提供するコンポーネント。削除されたTodoDetailのみの場合も対応
 *              認証機能に対応
 */
const DeletedTodos = () => {
    const { authenticatedRequest, isAuthenticated } = useAuth();
    
    // 状態管理
    const [deletedData, setDeletedData] = useState({
        deleted_todos: [],
        todos_with_deleted_details: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [restoring, setRestoring] = useState(null);
    const [deleting, setDeleting] = useState(null);
    // 選択されたTodoDetailを管理（キー: "todoId-detailId"）
    const [selectedDetails, setSelectedDetails] = useState(new Set());
    const [batchProcessing, setBatchProcessing] = useState(false);

    /**
     * 削除されたTodoアイテムを取得する関数
     */
    const fetchDeletedTodos = async () => {
        if (!isAuthenticated) {
            setError('認証が必要です。');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const data = await authenticatedRequest('/todos-deleted');
            
            if (data.success) {
                setDeletedData(data.data);
                // データ取得時に選択状態をクリア
                setSelectedDetails(new Set());
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
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        try {
            setRestoring(`todo-${todoId}`);
            setError('');
            
            const data = await authenticatedRequest(`/todos/${todoId}/restore`, {
                method: 'POST',
            });
            
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
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        try {
            setRestoring(`detail-${detailId}`);
            setError('');
            
            const data = await authenticatedRequest(`/todos/${todoId}/details/${detailId}/restore`, {
                method: 'POST',
            });
            
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
     * Todoアイテムを完全に削除（ハードデリート）する関数
     * 
     * @param {number} todoId - 完全に削除するTodoのID
     */
    const forceDeleteTodo = async (todoId) => {
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        // 確認ダイアログ
        if (!window.confirm('このTodoアイテムを完全に削除しますか？\nこの操作は取り消せません。')) {
            return;
        }

        try {
            setDeleting(`todo-${todoId}`);
            setError('');
            
            const data = await authenticatedRequest(`/todos/${todoId}/force-delete`, {
                method: 'DELETE',
            });
            
            if (data.success) {
                // 削除されたTodoをリストから除去
                setDeletedData(prev => ({
                    ...prev,
                    deleted_todos: prev.deleted_todos.filter(todo => todo.id !== todoId)
                }));
                alert('Todoアイテムが完全に削除されました。');
            } else {
                setError(data.message || 'Todoアイテムの完全削除に失敗しました。');
            }
        } catch (err) {
            console.error('Todo完全削除エラー:', err);
            setError('完全削除処理中にエラーが発生しました。');
        } finally {
            setDeleting(null);
        }
    };

    /**
     * TodoDetailを完全に削除（ハードデリート）する関数
     * 
     * @param {number} todoId - 親TodoのID
     * @param {number} detailId - 完全に削除するTodoDetailのID
     */
    const forceDeleteTodoDetail = async (todoId, detailId) => {
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        // 確認ダイアログ
        if (!window.confirm('このTodo詳細を完全に削除しますか？\nこの操作は取り消せません。')) {
            return;
        }

        try {
            setDeleting(`detail-${detailId}`);
            setError('');
            
            const data = await authenticatedRequest(`/todos/${todoId}/details/${detailId}/force-delete`, {
                method: 'DELETE',
            });
            
            if (data.success) {
                // 削除されたTodoDetailを更新
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
                alert('Todo詳細が完全に削除されました。');
            } else {
                setError(data.message || 'Todo詳細の完全削除に失敗しました。');
            }
        } catch (err) {
            console.error('TodoDetail完全削除エラー:', err);
            setError('完全削除処理中にエラーが発生しました。');
        } finally {
            setDeleting(null);
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

    /**
     * TodoDetailの選択状態を切り替える関数
     * 
     * @param {number} todoId - 親TodoのID
     * @param {number} detailId - TodoDetailのID
     */
    const toggleDetailSelection = (todoId, detailId) => {
        const key = `${todoId}-${detailId}`;
        setSelectedDetails(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    /**
     * 特定のTodoのすべてのTodoDetailを選択/解除する関数
     * 
     * @param {number} todoId - 親TodoのID
     * @param {Array} details - TodoDetailの配列
     */
    const toggleAllDetailsInTodo = (todoId, details) => {
        const allSelected = details.every(detail => selectedDetails.has(`${todoId}-${detail.id}`));
        
        setSelectedDetails(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                // すべて選択されている場合はすべて解除
                details.forEach(detail => {
                    newSet.delete(`${todoId}-${detail.id}`);
                });
            } else {
                // すべて選択されていない場合はすべて選択
                details.forEach(detail => {
                    newSet.add(`${todoId}-${detail.id}`);
                });
            }
            return newSet;
        });
    };

    /**
     * 選択されたTodoDetailをまとめて復元する関数
     */
    const batchRestoreDetails = async () => {
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        if (selectedDetails.size === 0) {
            alert('復元するTodoDetailを選択してください。');
            return;
        }

        // 確認ダイアログ
        if (!window.confirm(`選択された${selectedDetails.size}件のTodoDetailを復元しますか？`)) {
            return;
        }

        try {
            setBatchProcessing(true);
            setError('');

            const selectedArray = Array.from(selectedDetails);
            const restorePromises = [];
            const errors = [];

            // 各TodoDetailを復元
            for (const key of selectedArray) {
                const [todoId, detailId] = key.split('-').map(Number);
                try {
                    const data = await authenticatedRequest(`/todos/${todoId}/details/${detailId}/restore`, {
                        method: 'POST',
                    });
                    
                    if (!data.success) {
                        errors.push(`TodoDetail ID ${detailId}: ${data.message || '復元に失敗しました'}`);
                    }
                } catch (err) {
                    errors.push(`TodoDetail ID ${detailId}: ${err.message || '復元処理中にエラーが発生しました'}`);
                }
            }

            if (errors.length > 0) {
                setError(`一部の復元に失敗しました: ${errors.join(', ')}`);
            } else {
                alert(`${selectedDetails.size}件のTodoDetailが正常に復元されました。`);
            }

            // データを再取得
            await fetchDeletedTodos();
            
            // 選択をクリア
            setSelectedDetails(new Set());

        } catch (err) {
            console.error('一括復元エラー:', err);
            setError('一括復元処理中にエラーが発生しました。');
        } finally {
            setBatchProcessing(false);
        }
    };

    /**
     * 選択されたTodoDetailをまとめて完全削除する関数
     */
    const batchForceDeleteDetails = async () => {
        if (!isAuthenticated) {
            setError('認証が必要です。');
            return;
        }

        if (selectedDetails.size === 0) {
            alert('削除するTodoDetailを選択してください。');
            return;
        }

        // 確認ダイアログ
        if (!window.confirm(`選択された${selectedDetails.size}件のTodoDetailを完全に削除しますか？\nこの操作は取り消せません。`)) {
            return;
        }

        try {
            setBatchProcessing(true);
            setError('');

            const selectedArray = Array.from(selectedDetails);
            const deletePromises = [];
            const errors = [];

            // 各TodoDetailを完全削除
            for (const key of selectedArray) {
                const [todoId, detailId] = key.split('-').map(Number);
                try {
                    const data = await authenticatedRequest(`/todos/${todoId}/details/${detailId}/force-delete`, {
                        method: 'DELETE',
                    });
                    
                    if (!data.success) {
                        errors.push(`TodoDetail ID ${detailId}: ${data.message || '削除に失敗しました'}`);
                    }
                } catch (err) {
                    errors.push(`TodoDetail ID ${detailId}: ${err.message || '削除処理中にエラーが発生しました'}`);
                }
            }

            if (errors.length > 0) {
                setError(`一部の削除に失敗しました: ${errors.join(', ')}`);
            } else {
                alert(`${selectedDetails.size}件のTodoDetailが完全に削除されました。`);
            }

            // データを再取得
            await fetchDeletedTodos();
            
            // 選択をクリア
            setSelectedDetails(new Set());

        } catch (err) {
            console.error('一括削除エラー:', err);
            setError('一括削除処理中にエラーが発生しました。');
        } finally {
            setBatchProcessing(false);
        }
    };

    // コンポーネントマウント時に削除されたTodoを取得
    useEffect(() => {
        if (isAuthenticated) {
            fetchDeletedTodos();
        }
    }, [isAuthenticated]);

    // 認証されていない場合の表示
    if (!isAuthenticated) {
        return (
            <div className="deleted-todos-container">
                <div className="error-message">
                    <p>このページを表示するにはログインが必要です。</p>
                </div>
            </div>
        );
    }

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
                                            <div className="todo-actions">
                                                <button
                                                    className="restore-button"
                                                    onClick={() => restoreTodo(todo.id)}
                                                    disabled={restoring === `todo-${todo.id}` || deleting === `todo-${todo.id}`}
                                                >
                                                    {restoring === `todo-${todo.id}` ? '復元中...' : '🔄 復元'}
                                                </button>
                                                <button
                                                    className="force-delete-button"
                                                    onClick={() => forceDeleteTodo(todo.id)}
                                                    disabled={restoring === `todo-${todo.id}` || deleting === `todo-${todo.id}`}
                                                >
                                                    {deleting === `todo-${todo.id}` ? '削除中...' : '🗑️ 完全削除'}
                                                </button>
                                            </div>
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
                            <div className="section-header-with-actions">
                                <h2 className="section-title">📋 削除された詳細を持つTodo</h2>
                                {selectedDetails.size > 0 && (
                                    <div className="batch-actions">
                                        <span className="selected-count">
                                            選択中: {selectedDetails.size}件
                                        </span>
                                        <button
                                            className="batch-restore-button"
                                            onClick={batchRestoreDetails}
                                            disabled={batchProcessing}
                                        >
                                            {batchProcessing ? '処理中...' : `🔄 ${selectedDetails.size}件を復元`}
                                        </button>
                                        <button
                                            className="batch-delete-button"
                                            onClick={batchForceDeleteDetails}
                                            disabled={batchProcessing}
                                        >
                                            {batchProcessing ? '処理中...' : `🗑️ ${selectedDetails.size}件を完全削除`}
                                        </button>
                                        <button
                                            className="clear-selection-button"
                                            onClick={() => setSelectedDetails(new Set())}
                                            disabled={batchProcessing}
                                        >
                                            選択解除
                                        </button>
                                    </div>
                                )}
                            </div>
                            {deletedData.todos_with_deleted_details.map(todo => {
                                const todoDetails = todo.deleted_todo_details || [];
                                const allSelected = todoDetails.length > 0 && todoDetails.every(detail => 
                                    selectedDetails.has(`${todo.id}-${detail.id}`)
                                );
                                const someSelected = todoDetails.some(detail => 
                                    selectedDetails.has(`${todo.id}-${detail.id}`)
                                );

                                return (
                                    <div key={`todo-details-${todo.id}`} className="deleted-todo-item active-todo">
                                        <div className="todo-header">
                                            <h3 className="todo-title active-title">
                                                {todo.title || '無題のTodo'} 
                                                <span className="active-badge">アクティブ</span>
                                            </h3>
                                        </div>

                                        {/* 削除されたTodo詳細情報のみ表示 */}
                                        {todoDetails.length > 0 && (
                                            <div className="todo-details deleted-details">
                                                <div className="details-header">
                                                    <h4>🗑️ 削除された詳細情報:</h4>
                                                    <label className="select-all-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={input => {
                                                                if (input) input.indeterminate = someSelected && !allSelected;
                                                            }}
                                                            onChange={() => toggleAllDetailsInTodo(todo.id, todoDetails)}
                                                            disabled={batchProcessing}
                                                        />
                                                        <span>すべて選択</span>
                                                    </label>
                                                </div>
                                                <ul className="todo-details-list">
                                                    {todoDetails.map(detail => {
                                                        const isSelected = selectedDetails.has(`${todo.id}-${detail.id}`);
                                                        return (
                                                            <li 
                                                                key={detail.id} 
                                                                className={`todo-detail-item deleted-detail ${isSelected ? 'selected' : ''}`}
                                                            >
                                                                <div className="detail-content">
                                                                    <label className="detail-checkbox">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => toggleDetailSelection(todo.id, detail.id)}
                                                                            disabled={batchProcessing || restoring === `detail-${detail.id}` || deleting === `detail-${detail.id}`}
                                                                        />
                                                                    </label>
                                                                    <span className={`detail-status ${detail.completed ? 'completed' : 'pending'}`}>
                                                                        {detail.completed ? '✅' : '⏳'}
                                                                    </span>
                                                                    <span className="detail-description">
                                                                        {detail.description || '説明なし'}
                                                                    </span>
                                                                    <span className="detail-order">
                                                                        順序: {detail.order}
                                                                    </span>
                                                                    <div className="detail-actions">
                                                                        <button
                                                                            className="restore-detail-button"
                                                                            onClick={() => restoreTodoDetail(todo.id, detail.id)}
                                                                            disabled={restoring === `detail-${detail.id}` || deleting === `detail-${detail.id}` || batchProcessing}
                                                                        >
                                                                            {restoring === `detail-${detail.id}` ? '復元中...' : '🔄 復元'}
                                                                        </button>
                                                                        <button
                                                                            className="force-delete-detail-button"
                                                                            onClick={() => forceDeleteTodoDetail(todo.id, detail.id)}
                                                                            disabled={restoring === `detail-${detail.id}` || deleting === `detail-${detail.id}` || batchProcessing}
                                                                        >
                                                                            {deleting === `detail-${detail.id}` ? '削除中...' : '🗑️ 完全削除'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="detail-deleted-date">
                                                                    詳細削除日時: {formatDate(detail.deleted_at)}
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DeletedTodos; 