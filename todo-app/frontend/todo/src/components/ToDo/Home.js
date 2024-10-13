import { Fab, Grid, IconButton } from '@mui/material';
import React from 'react';
import Form from './Form';
import { useCurrentToDoList, useGetToDoList } from '../hooks/ToDoList';
// import { ReactQueryDevtools} from "react-query/devtools";
import { useStoreToDoMutateTask } from '../hooks/ToDo';
import AddIcon from '@mui/icons-material/AddCircle';

function Home() {
    const { isLoading } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    const style = {
        position:"fixed",
        bottom:16,
        right:16
    }
    let ToDo = {
        id: null,
        title: null,
    };
    //todo追加イベント
    const { storeToDoMutation } = useStoreToDoMutateTask();

    const eventStoreToDo = (event) => {
        storeToDoMutation.mutate(ToDo);
    }

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
            {/* <ReactQueryDevtools></ReactQueryDevtools> */}
            <Fab
                color="primary"
                aria-label="add"
                sx={style}
                onClick={eventStoreToDo}
            >
                <AddIcon />
            </Fab>
        </>
    );
}

export default Home;