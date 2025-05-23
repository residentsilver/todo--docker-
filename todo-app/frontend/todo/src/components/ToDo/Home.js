import { Fab, Grid, TextField, Box, Typography, Alert, Chip } from '@mui/material';
import React, { useState } from 'react';
import { useCurrentToDoList, useGetToDoList } from '../hooks/ToDoList';
import useStoreToDoMutateTask from '../hooks/ToDo/useStoreToDoMutateTask';
import { useUpdateToDoOrderMutateTask } from '../hooks/ToDo';
import { useSearch } from '../../contexts/SearchContext';
import AddIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import SortableTodoCard from './SortableTodoCard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
// import { ReactQueryDevtools} from "react-query/devtools";

/**
 * Todoアプリケーションのホームコンポーネント
 * 
 * @description Todoアイテムの一覧表示と新規作成機能を提供
 *              検索機能と統合され、検索結果に応じた表示を行う
 *              Todoカードのドラッグアンドドロップによる順序変更機能を搭載
 * @author システム開発者
 * @version 1.3
 */
function Home() {
    const { isLoading } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    const { 
        searchMode, 
        searchResults, 
        searchQuery, 
        totalResults,
        clearSearch 
    } = useSearch();
    
    // Todoの順序変更用のMutation
    const { updateToDoOrderMutation } = useUpdateToDoOrderMutateTask();
    
    const style = {
        position: "fixed",
        bottom: 16,
        right: 16
    };

    const [newToDo, setNewToDo] = useState("");

    // ToDo追加イベント
    const { storeToDoMutation } = useStoreToDoMutateTask();

    const eventStoreToDo = () => {
        if (newToDo.trim() === "") {
            alert("ToDoのタイトルを入力してください。");
            return;
        }

        const ToDo = {
            title: newToDo,
        };

        storeToDoMutation.mutate(ToDo, {
            onSuccess: () => {
                setNewToDo("");
            },
            onError: (error) => {
                console.error("ToDoの保存に失敗しました:", error);
                alert("ToDoの保存に失敗しました。");
            }
        });
    };

    // Drag and Dropセンサーの設定
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px移動してからドラッグ開始
            },
        }),
        useSensor(KeyboardSensor)
    );

    /**
     * Todoカードのドラッグ終了ハンドラー
     * 
     * @param {Object} event - ドラッグイベント
     */
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const displayTodos = searchMode ? searchResults : toDoList;
        const oldIndex = displayTodos.findIndex(todo => todo.id === active.id);
        const newIndex = displayTodos.findIndex(todo => todo.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            // 検索モードでは順序変更を無効化
            if (searchMode) {
                console.log('検索モードでは順序変更はできません');
                return;
            }

            const newTodos = arrayMove(displayTodos, oldIndex, newIndex);
            
            // 新しい順序をバックエンドに保存
            const order = newTodos.map(todo => todo.id);
            updateToDoOrderMutation.mutate({ order });
        }
    };

    if (isLoading) return <div>Loading...</div>;

    const eventKeyDownNewToDo = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            eventStoreToDo();
        }
    };

    // 表示するTodoリストを決定（検索モードか通常モードか）
    const displayTodos = searchMode ? searchResults : toDoList;
    const isSearchActive = searchMode && searchQuery;

    return (
        <>
            {/* メインコンテンツの中央揃え */}
            <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                sx={{ padding: 4, minHeight: '80vh' }}
            >
                {/* 検索結果ヘッダー */}
                {isSearchActive && (
                    <Box sx={{ mb: 3, textAlign: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                            <SearchIcon color="primary" />
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                検索結果
                            </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                label={`「${searchQuery}」`}
                                color="primary"
                                variant="outlined"
                                onDelete={clearSearch}
                                sx={{ fontWeight: 500 }}
                            />
                            <Typography variant="body1" color="text.secondary">
                                {totalResults}件のTodoが見つかりました
                            </Typography>
                        </Box>
                        
                        {/* 検索モードでの注意事項 */}
                        <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
                            検索モードではTodoの順序変更はできません。順序を変更するには検索をクリアしてください。
                        </Alert>
                    </Box>
                )}

                {/* 検索結果なしの場合 */}
                {isSearchActive && totalResults === 0 && (
                    <Alert 
                        severity="info" 
                        sx={{ mb: 3, maxWidth: 600 }}
                        action={
                            <Chip
                                label="検索をクリア"
                                size="small"
                                onClick={clearSearch}
                                clickable
                            />
                        }
                    >
                        「{searchQuery}」に一致するTodoアイテムが見つかりませんでした。
                    </Alert>
                )}

                {/* Todoリストの表示（ドラッグアンドドロップ対応） */}
                {displayTodos && displayTodos.length > 0 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={displayTodos.map(todo => todo.id)}
                            strategy={rectSortingStrategy}
                        >
                            <Grid container spacing={3} justifyContent="center" sx={{ position: 'relative' }}>
                                {displayTodos.map((toDo) => (
                                    <Grid item key={toDo.id} xs={12} sm={6} md={4}>
                                        <SortableTodoCard 
                                            toDo={toDo} 
                                            isSearchMode={isSearchActive}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </SortableContext>
                    </DndContext>
                )}

                {/* 通常モードでTodoがない場合 */}
                {!searchMode && (!toDoList || toDoList.length === 0) && (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            まだTodoアイテムがありません
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            下のフィールドから新しいTodoを作成してください
                        </Typography>
                    </Box>
                )}

                {/* ドラッグアンドドロップの使用方法（通常モードのみ） */}
                {!searchMode && toDoList && toDoList.length > 1 && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            💡 Todoカードの左側にマウスを合わせてドラッグすると順序を変更できます
                        </Typography>
                    </Box>
                )}

                {/* 新しいToDoの入力フィールド（検索モードでない場合のみ表示） */}
                {!searchMode && (
                    <TextField
                        label="新しいToDo"
                        variant="outlined"
                        value={newToDo}
                        onChange={(e) => setNewToDo(e.target.value)}
                        onKeyDown={eventKeyDownNewToDo}
                        sx={{ marginTop: 4, width: '300px' }}
                    />
                )}

                {/* 追加ボタン（検索モードでない場合のみ表示） */}
                {!searchMode && (
                    <Fab
                        color="primary"
                        aria-label="add"
                        sx={style}
                        onClick={eventStoreToDo}
                    >
                        <AddIcon />
                    </Fab>
                )}
            </Box>
            {/* <ReactQueryDevtools></ReactQueryDevtools> */}

        </>
    );
}

export default Home;