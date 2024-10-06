import { ListItemButton, ListItem, IconButton, ListItemText, Checkbox, ListItemIcon } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const ToDoDetails = (props) => {
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
                <ListItemText primary={props.title} secondary={props.description} />
            </ListItemButton>
        </ListItem>

    );
}

export default ToDoDetails;
