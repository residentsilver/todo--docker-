import {
    Card,
    CardContent,
    List,
    TextField,
    CardActions,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/AddCircle';
import React, { useState } from 'react';
import ToDoDetails from './ToDoDetails';
import {
    useUpdateToDoMutateTask,
    useDeleteToDoMutateTask
}
    from '../hooks/ToDo';
import { useStoreToDoDetailMutateTask } from '../hooks/ToDoDetail';

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

    let toDo ={
        id: props.toDo.id,
    }

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

    //追加イベント
    const { storeToDoDetailMutation } = useStoreToDoDetailMutateTask();
    const eventStoreToDoDetail = (event) => {
        storeToDoDetailMutation.mutate(toDo);
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
            </Card>
        </>
    );
}

export default Form;