import { ListItemButton, ListItem, IconButton, Checkbox, ListItemIcon, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUpdateToDoDetailMutateTask } from '../hooks/ToDoDetail';
import React, { useState } from 'react';

const ToDoDetails = (props) => {
    const [timer, setTimer] = useState(null);

    let ToDoDetail = {
        id: props.id,
        description: props.description,
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
                        checked={props.completed}
                        tabIndex={-1}
                        disableRipple
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
