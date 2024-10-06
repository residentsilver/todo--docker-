import { Card, CardHeader, CardContent, List } from '@mui/material';
import React from 'react';
import ToDoDetails from './ToDoDetails';
const Form = () => {
    return (
        <Card>
            <CardHeader title={props.toDoList.title}></CardHeader>
            <CardContent>
                <List>
                    {[0, 1, 2, 3].map((value) => {
                        return <ToDoDetails key={value} title={`title${value}`} description={`description${value}`} />;
                    })}
                </List>
            </CardContent>
        </Card>
    );
}

export default Form;