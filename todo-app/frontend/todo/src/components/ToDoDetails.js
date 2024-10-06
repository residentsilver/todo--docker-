import { ListItemButton, ListItem, IconButton, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Checkbox from '@mui/material/Checkbox';
import ListItemIcon from '@mui/material/ListItemIcon';

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
                    />
                </ListItemIcon>
                <ListItemText primary={props.title} secondary={props.description} />
            </ListItemButton>
        </ListItem>

    );
}

export default ToDoDetails;