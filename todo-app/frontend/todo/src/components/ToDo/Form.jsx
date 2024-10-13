import { 
    Card, 
    CardContent, 
    List, 
    TextField, 
    CardActions, 
    IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import React, { useState } from 'react';
import ToDoDetails from './ToDoDetails';
import { useUpdateToDoMutateTask } from '../hooks/ToDo';
import { useDeleteToDoMutateTask } from '../hooks/ToDo';

/**
 * Todoフォームコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.toDo - Todoアイテムのデータ
 * @returns {JSX.Element} Todoフォーム
 */
const Form = (props) => {
    const [timer, setTimer] = useState(null);

    let ToDo = {
        id: props.toDo.id,
        title: props.toDo.title,
    };

    //名称更新イベント
    const { updateToDoMutation } = useUpdateToDoMutateTask();
    const eventUpdateToDo = (event) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let data = {
                ...ToDo,
                title: event.target.value,
            }
            updateToDoMutation.mutate(data);
        }, 500);

        setTimer(newTimer);
    }

    //削除イベント
    const { deleteToDoMutation } = useDeleteToDoMutateTask();
    const eventDeleteToDo = (event) => {
        deleteToDoMutation.mutate(ToDo);
    }

    return (
        <>
            <Card>
                <TextField
                    variant="standard"
                    margin="dense"
                    defaultValue={props.toDo.title}
                    fullWidth
                    onChange={eventUpdateToDo}
                />
                {/* props （引数＝DBから得た情報　todosテーブルのtitleカラム） */}
                <CardContent>
                    <List>
                        {props.toDo.todo_details.map((detail) => {
                            return (
                                <ToDoDetails
                                    key={detail.id}
                                    id={detail.id}
                                    description={detail.description}
                                    completed={detail.completed}
                                />
                            );
                        })}
                    </List>
                </CardContent>
                <CardActions>
                    <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={eventDeleteToDo}>
                        <DeleteIcon />
                    </IconButton>
                </CardActions>
            </Card>
        </>
    );
}

export default Form;