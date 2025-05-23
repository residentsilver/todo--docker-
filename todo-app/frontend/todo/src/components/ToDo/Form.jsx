import {
    Card,
    CardContent,
    List,
    TextField,
    CardActions,
    IconButton,
    Box,
    Typography,
    Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/AddCircle';
import SearchIcon from '@mui/icons-material/Search';
import React, { useEffect, useState } from 'react';
import {
    useUpdateToDoMutateTask,
    useDeleteToDoMutateTask,
    
} from '../hooks/ToDo';
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableToDoDetails from './SortableToDoDetails';
import { useStoreToDoDetailMutateTask ,useUpdateToDoDetailOrderMutateTask} from '../hooks/ToDoDetail';
import { useSearch } from '../../contexts/SearchContext';


/**
 * Todoフォームコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.toDo - Todoアイテムのデータ
 * @returns {JSX.Element} Todoフォーム
 */
const Form = (props) => {
    const [timer, setTimer] = useState(null);
    const [details, setDetails] = useState(props.toDo.todo_details);
    const { updateToDoMutation } = useUpdateToDoMutateTask();
    const { updateToDoDetailOrderMutation } = useUpdateToDoDetailOrderMutateTask();
    
    // 検索機能の状態を取得
    const { searchMode, searchQuery } = useSearch();

    const ToDo = {
        id: props.toDo.id,
        title: props.toDo.title,
    };

    const toDo = {
        id: props.toDo.id,
    };

    /**
     * 表示する詳細項目を決定する関数
     * 検索モードの場合は検索に一致する項目のみ、通常モードの場合は全ての項目を返す
     * 
     * @returns {Array} 表示する詳細項目のリスト
     */
    const getDisplayDetails = () => {
        if (!searchMode || !searchQuery) {
            // 通常モード：全ての詳細項目を表示
            return details;
        }
        
        // 検索モード：searchMetaがある場合はそれを使用、ない場合は手動でフィルタリング
        if (props.toDo.searchMeta?.matchingDetails) {
            return props.toDo.searchMeta.matchingDetails;
        }
        
        // フォールバック：手動でフィルタリング
        return details.filter(detail => 
            detail.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    /**
     * 検索クエリのハイライト表示
     * 
     * @param {string} text - 表示するテキスト
     * @returns {JSX.Element} ハイライト処理されたテキスト
     */
    const renderHighlightedText = (text) => {
        if (!searchMode || !searchQuery || !text) return text;
        
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <span>
                {parts.map((part, index) => 
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark key={index} style={{ 
                            backgroundColor: '#ffeb3b', 
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                        }}>
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    // 名称更新イベント
    const eventUpdateToDo = (event) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            const data = {
                ...ToDo,
                title: event.target.value,
            }
            updateToDoMutation.mutate(data);
        }, 500);

        setTimer(newTimer);
    };

    // 削除イベント
    const { deleteToDoMutation } = useDeleteToDoMutateTask();
    const eventDeleteToDo = (event) => {
        deleteToDoMutation.mutate(ToDo);
    }

    // 追加イベント
    const { storeToDoDetailMutation } = useStoreToDoDetailMutateTask();
    const eventStoreToDoDetail = (event) => {
        storeToDoDetailMutation.mutate(toDo);
    };

    // Drag and Dropセンサーの設定
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    /**
     * タスクの順序変更ハンドラー
     * @param {Object} event - ドラッグイベント
     */
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const displayDetails = getDisplayDetails();
            const oldIndex = displayDetails.findIndex(detail => detail.id === active.id);
            const newIndex = displayDetails.findIndex(detail => detail.id === over.id);

            const newDetails = arrayMove(displayDetails, oldIndex, newIndex);
            setDetails(newDetails);

            // 新しい順序をバックエンドに保存
            const order = newDetails.map(detail => detail.id);
            updateToDoDetailOrderMutation.mutate({ todoId: toDo.id, order });
        }
    };

    // タイトルテキストフィールドのキーダウンイベント
    const eventKeyDownTitle = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const displayDetails = getDisplayDetails();
            // detailsが存在し、少なくとも1つ要素がある場合
            if (displayDetails && displayDetails.length > 0) {
                // 最初のdetailのテキストフィールドにフォーカスを移動
                const firstDetailElement = document.querySelector(
                    `input[data-detail-id="${displayDetails[0].id}"]`
                );
                if (firstDetailElement) {
                    firstDetailElement.focus();
                }
            }
        }
    };

    useEffect(() => {
        setDetails(props.toDo.todo_details);
    }, [props.toDo.todo_details]);

    // 表示する詳細項目を取得
    const displayDetails = getDisplayDetails();
    const isSearchMode = searchMode && searchQuery;
    
    return (
        <>
            <Card sx={{ 
                border: isSearchMode ? '2px solid #1976d2' : '1px solid #e0e0e0',
                boxShadow: isSearchMode ? '0 4px 12px rgba(25, 118, 210, 0.15)' : undefined
            }}>
                {/* 検索モードの表示 */}
                {isSearchMode && (
                    <Box sx={{ 
                        backgroundColor: '#f0f7ff', 
                        p: 1, 
                        borderBottom: '1px solid #e3f2fd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <SearchIcon color="primary" fontSize="small" />
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                            検索結果表示中
                        </Typography>
                        {props.toDo.searchMeta?.titleMatch && (
                            <Chip
                                size="small"
                                label="タイトル一致"
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                        )}
                        {props.toDo.searchMeta?.detailMatch && (
                            <Chip
                                size="small"
                                label={`詳細 ${displayDetails.length}件一致`}
                                color="secondary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                        )}
                    </Box>
                )}
                
                <TextField
                    variant="standard"
                    margin="dense"
                    defaultValue={props.toDo.title}
                    fullWidth
                    onChange={eventUpdateToDo}
                    onKeyDown={eventKeyDownTitle}
                    InputProps={{
                        readOnly: isSearchMode, // 検索モードでは編集不可
                        style: isSearchMode ? { backgroundColor: '#fafafa' } : {}
                    }}
                    value={isSearchMode ? undefined : undefined} // defaultValueを使用
                    placeholder={isSearchMode ? undefined : "Todoタイトルを入力..."}
                />
                {/* タイトルのハイライト表示（検索モード時） */}
                {isSearchMode && (
                    <Box sx={{ px: 2, pb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {renderHighlightedText(props.toDo.title)}
                        </Typography>
                    </Box>
                )}
                
                {/* props （引数＝DBから得た情報　todosテーブルのtitleカラム） */}
                <CardContent>
                    {/* 検索モードで詳細項目がない場合の表示 */}
                    {isSearchMode && displayDetails.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                            <Typography variant="body2">
                                このTodoの詳細項目に「{searchQuery}」は含まれていません
                            </Typography>
                        </Box>
                    )}
                    
                    {/* 詳細項目の表示 */}
                    {displayDetails.length > 0 && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={displayDetails.map(detail => detail.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <List>
                                    {displayDetails.map((detail) => (
                                        <SortableToDoDetails
                                            key={detail.id}
                                            id={detail.id}
                                            description={detail.description}
                                            completed={detail.completed}
                                            to_do_id={detail.to_do_id}
                                            setDetails={setDetails}
                                            details={details}
                                            onAddNewDetail={eventStoreToDoDetail}
                                            isSearchMode={isSearchMode}
                                            searchQuery={searchQuery}
                                            renderHighlightedText={renderHighlightedText}
                                        />
                                    ))}
                                </List>
                            </SortableContext>
                        </DndContext>
                    )}
                </CardContent>
                
                {/* 検索モードでは編集機能を無効化 */}
                {!isSearchMode && (
                    <CardActions>
                        <IconButton
                            edge="start"
                            aria-label="add"
                            color="primary"
                            onClick={eventStoreToDoDetail}>
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={eventDeleteToDo}>
                            <DeleteIcon />
                        </IconButton>
                    </CardActions>
                )}
                
                {/* 検索モードでの情報表示 */}
                {isSearchMode && (
                    <CardActions sx={{ justifyContent: 'center', backgroundColor: '#f9f9f9' }}>
                        <Typography variant="caption" color="text.secondary">
                            検索モード中は編集できません
                        </Typography>
                    </CardActions>
                )}
            </Card>
        </>
    );
}

export default Form;