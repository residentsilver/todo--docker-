import { Card, CardHeader, CardContent, List, TextField } from '@mui/material';
import React, { useState } from 'react';
import ToDoDetails from './ToDoDetails';
import { useUpdateToDoMutateTask } from '../hooks/ToDo';

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
                                />
                            );
                        })}
                    </List>
                </CardContent>
            </Card>
        </>
    );
}

export default Form;