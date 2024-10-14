import { Fab, Grid, TextField, Box } from '@mui/material';
import React, { useState } from 'react';
import Form from './Form';
import { useCurrentToDoList, useGetToDoList } from '../hooks/ToDoList';
import useStoreToDoMutateTask from '../hooks/ToDo/useStoreToDoMutateTask';
import AddIcon from '@mui/icons-material/AddCircle';

function Home() {
    const { isLoading } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    const style = {
        position: "fixed",
        bottom: 16,
        right: 16
    };

    const [newToDo, setNewToDo] = useState("");

    // ToDo追加イベント
    const { storeToDoMutation } = useStoreToDoMutateTask();

    const eventStoreToDo = () => {
        if (newToDo.trim() === "") {
            alert("ToDoのタイトルを入力してください。");
            return;
        }

        const ToDo = {
            title: newToDo,
            description: "初期説明", // 必要に応じてユーザー入力を追加
        };

        storeToDoMutation.mutate(ToDo, {
            onSuccess: () => {
                setNewToDo("");
            },
            onError: (error) => {
                console.error("ToDoの保存に失敗しました:", error);
                alert("ToDoの保存に失敗しました。");
            }
        });
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <>
            {/* メインコンテンツの中央揃え */}
            <Box 
                display="flex" 
                flexDirection="column" 
                alignItems="center" 
                justifyContent="center" 
                sx={{ padding: 4, minHeight: '80vh' }}
            >
                <Grid container spacing={3} justifyContent="center">
                    {toDoList.map((toDo) => (
                        <Grid item key={toDo.id} xs={12} sm={6} md={4}>
                            <Form toDo={toDo} />
                            {/* コンポーネントの指定 引数名 mapで渡された変数 */}
                        </Grid>
                    ))}
                </Grid>

                {/* 新しいToDoの入力フィールド */}
                <TextField
                    label="新しいToDo"
                    variant="outlined"
                    value={newToDo}
                    onChange={(e) => setNewToDo(e.target.value)}
                    sx={{ marginTop: 4, width: '300px' }}
                />

                <Fab
                    color="primary"
                    aria-label="add"
                    sx={style}
                    onClick={eventStoreToDo}
                >
                    <AddIcon />
                </Fab>
            </Box>
        </>
    );
}

export default Home;