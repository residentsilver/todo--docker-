import { Grid2 } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom';
import Form from './Form';
import { useCurrentToDoList, useGetToDoList } from '../hooks/ToDoList';

function Home() {
    const { isLoading } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <Grid2 container spacing={2}>
                {toDoList.map((toDo) => (
                    <Grid2 item key = {toDo.id} xs={8}>
                        <Form toDo={toDo}/>
                        {/* コンポーネントの指定　引数名　 mapで渡された変数*/}
                    </Grid2>
                ))}
            </Grid2>
        </>
    );
}

export default Home;