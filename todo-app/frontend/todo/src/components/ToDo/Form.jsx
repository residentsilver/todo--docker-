import { Card, CardHeader, CardContent, List } from '@mui/material';
import React from 'react';
import ToDoDetails from './ToDoDetails';

/**
 * Todoフォームコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.toDo - Todoアイテムのデータ
 * @returns {JSX.Element} Todoフォーム
 */
const Form = (props) => {
    return (
        <>
            <Card>
                <CardHeader title={props.toDo.title}></CardHeader>
                {/* props （引数＝DBから得た情報　todosテーブルのtitleカラム） */}
                <CardContent>
                    <List>
                        {props.toDo.todo_details.map((detail) => {
                            return (
                                <ToDoDetails 
                                    key={detail.id} 
                                    title={detail.title} 
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