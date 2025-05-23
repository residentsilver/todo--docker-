import { ListItemButton, ListItem, IconButton, Checkbox, ListItemIcon, TextField, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useDeleteToDoDetailMutateTask , useUpdateToDoDetailMutateTask } from '../hooks/ToDoDetail';
import React, { useState, useEffect } from 'react';

const ToDoDetails = (props) => {
    const [timer, setTimer] = useState(null);
    const [isCompleted, setIsCompleted] = useState(props.completed);

    let ToDoDetail = {
        id: props.id,
        description: props.description,
        completed: props.completed,
        to_do_id: props.to_do_id
    };

    //更新イベント
    const { updateToDoDetailMutation } = useUpdateToDoDetailMutateTask();
    const eventUpdateToDoDetail = (event) => {
        // 検索モードでは更新を無効化
        if (props.isSearchMode) return;
        
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let data = {
                ...ToDoDetail,
                description: event.target.value,
            }
            updateToDoDetailMutation.mutate(data);
        }, 500);

        setTimer(newTimer);
    }

    //チェックボックスイベント
    const eventCheckToDoDetail = (event) => {
        // 検索モードでは更新を無効化
        if (props.isSearchMode) {
            event.preventDefault();
            return;
        }
        
        const newCompleted = event.target.checked;
        setIsCompleted(newCompleted);

        let data = {
            ...ToDoDetail,
            completed: newCompleted,
        }
        updateToDoDetailMutation.mutate(data);
    }

        //テキストフィールドのキーダウンイベント
        const eventKeyDownToDoDetail = (event) => {
            // 検索モードではキーイベントを無効化
            if (props.isSearchMode) return;
            
            if (event.key === 'Enter') {
                event.preventDefault();
                // 現在のdetailのインデックスを取得
                const currentIndex = props.details.findIndex(
                    detail => detail.id === props.id
                );
        
                if (event.shiftKey) {
                    // Shift + Enterの場合、前の要素へ移動
                    if (currentIndex > 0) {
                        const prevElement = document.querySelector(
                            `input[data-detail-id="${props.details[currentIndex - 1].id}"]`
                        );
                        if (prevElement) {
                            prevElement.focus();
                        }
                    }
                } else {
                    // 通常のEnterの場合
                    if (currentIndex < props.details.length - 1) {
                        // 次の要素が存在する場合は次へ移動
                        const nextElement = document.querySelector(
                            `input[data-detail-id="${props.details[currentIndex + 1].id}"]`
                        );
                        if (nextElement) {
                            nextElement.focus();
                        }
                    } else {
                        // 最後の要素の場合は新しい項目を追加
                        props.onAddNewDetail();
                    }
                }
            }
        };

    //削除イベント
    const { deleteToDoDetailMutation } = useDeleteToDoDetailMutateTask();
    const eventDeleteToDoDetail = (event) => {
        // 検索モードでは削除を無効化
        if (props.isSearchMode) return;
        
        deleteToDoDetailMutation.mutate(ToDoDetail);
    }

    useEffect(() => {
        setIsCompleted(props.completed);
    }, [props.completed]);

    useEffect(() => {
    console.log(props);
    }, []);
    
    return (
        <ListItem
            key={props.id}
            secondaryAction={
                <>
                    {/* 検索モードでは削除ボタンを非表示 */}
                    {!props.isSearchMode && (
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={eventDeleteToDoDetail}>
                            <DeleteIcon />
                        </IconButton>
                    )}
                    {/* 検索モードでは検索アイコンを表示 */}
                    {props.isSearchMode && (
                        <IconButton
                            edge="end"
                            aria-label="search match"
                            disabled>
                            <SearchIcon color="primary" />
                        </IconButton>
                    )}
                </>
            }
            sx={{
                backgroundColor: props.isSearchMode ? '#f0f7ff' : 'transparent',
                borderRadius: props.isSearchMode ? 1 : 0,
                mb: props.isSearchMode ? 0.5 : 0,
                border: props.isSearchMode ? '1px solid #e3f2fd' : 'none'
            }}
        >
            <ListItemButton disableRipple>
                <ListItemIcon>
                    <Checkbox
                        edge="start"
                        checked={isCompleted}
                        tabIndex={-1}
                        onChange={eventCheckToDoDetail}
                        disabled={props.isSearchMode} // 検索モードでは無効化
                        sx={{
                            color: props.isSearchMode ? 'text.secondary' : undefined
                        }}
                    />
                </ListItemIcon>
                
                {/* 検索モードでは読み取り専用表示 */}
                {props.isSearchMode ? (
                    <Box sx={{ flexGrow: 1, py: 1 }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: isCompleted ? 'text.secondary' : 'text.primary',
                                textDecoration: isCompleted ? 'line-through' : 'none',
                                fontWeight: 500
                            }}
                        >
                            {props.renderHighlightedText ? 
                                props.renderHighlightedText(props.description) : 
                                props.description
                            }
                        </Typography>
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                            検索に一致した項目
                        </Typography>
                    </Box>
                ) : (
                    /* 通常モードでは編集可能なTextField */
                    <TextField
                        variant="standard"
                        margin="dense"
                        defaultValue={props.description}
                        fullWidth
                        onChange={eventUpdateToDoDetail}
                        onKeyDown={eventKeyDownToDoDetail}
                        inputProps={{
                            'data-detail-id': props.id
                        }}
                    />
                )}
            </ListItemButton>
        </ListItem>
    );
}

export default ToDoDetails;