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
            <ListItemButton>
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
                />
            </ListItemButton>
        </ListItem>
    );
}

export default ToDoDetails;