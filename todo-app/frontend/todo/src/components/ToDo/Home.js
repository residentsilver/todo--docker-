import { Grid } from '@mui/material';
import React from 'react';
import Form from './Form';
import { useCurrentToDoList, useGetToDoList } from '../hooks/ToDoList';
import { ReactQueryDevtools} from "react-query/devtools";
function Home() {
    const { isLoading } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            <Grid container spacing={2}>
                {toDoList.map((toDo) => (
                    <Grid item key = {toDo.id} xs={8}>
                        <Form toDo={toDo}/>
                        {/* コンポーネントの指定　引数名　 mapで渡された変数*/}
                    </Grid>
                ))}
            </Grid>
            <ReactQueryDevtools></ReactQueryDevtools>
        </>
    );
}

export default Home;