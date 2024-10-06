import { Grid2 } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom';
import Form from './Form';

function Home() {
    const { isLoding, data } = useGetToDoList();
    const toDoList = useCurrentToDoList();
    if (isLoding) return <div>Loading...</div>;
    return (
        <Grid2 container spacing={2}>
            <Grid2 item xs={3}>
                <Form />
            </Grid2>
        </Grid2>
    );
}

export default Home;