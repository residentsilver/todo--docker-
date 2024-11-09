import { ListItemButton, ListItem, IconButton, Checkbox, ListItemIcon, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
                    <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={eventDeleteToDoDetail}>
                        <DeleteIcon />
                    </IconButton>
                </>
            }
        >
            <ListItemButton disableRipple>
                <ListItemIcon>
                    <Checkbox
                        edge="start"
                        checked={isCompleted}
                        tabIndex={-1}
                        onChange={eventCheckToDoDetail}
                    />
                </ListItemIcon>
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
            </ListItemButton>
        </ListItem>
    );
}

export default ToDoDetails;