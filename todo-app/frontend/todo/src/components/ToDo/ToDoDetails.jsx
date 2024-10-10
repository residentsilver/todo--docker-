import { ListItemButton, ListItem, IconButton, Checkbox, ListItemIcon, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUpdateToDoDetailMutateTask } from '../hooks/ToDoDetail';
import React, { useState ,useEffect } from 'react';

const ToDoDetails = (props) => {
    const [timer, setTimer] = useState(null);
    const [isCompleted, setIsCompleted] = useState(props.completed);

    let ToDoDetail = {
        id: props.id,
        description: props.description,
        completed: props.completed,
        to_do_id:props.to_do_id
    };

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

    const eventCheckToDoDetail = (event) => {
        const newCompleted = event.target.checked;
        setIsCompleted(newCompleted);
        
        let data = {
            ...ToDoDetail,
            completed: newCompleted,
        }
        updateToDoDetailMutation.mutate(data);
    }

        
    useEffect(() => {
        setIsCompleted(props.completed);
    }, [props.completed]);
    
    console.log(props);
    return (
        <ListItem
            key={props.id}
            secondaryAction={
                <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                </IconButton>
            }
        >
            <ListItemButton>
                <ListItemIcon>
                    <Checkbox
                        edge="start"
                        checked={isCompleted}
                        tabIndex={-1}
                        onChange={eventCheckToDoDetail}
                        // disableRipple
                    />
                </ListItemIcon>
                <TextField
                    variant="standard"
                    margin="dense"
                    defaultValue={props.description}
                    fullWidth
                    onChange={eventUpdateToDoDetail}
                />
                {/* <ListItemText primary={props.title} secondary={props.description} /> */}
            </ListItemButton>
        </ListItem>

    );
}

export default ToDoDetails;
