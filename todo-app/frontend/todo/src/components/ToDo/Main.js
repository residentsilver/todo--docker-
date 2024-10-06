import React from 'react';
import ReactDOM from 'react-dom';
import { Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

const Main = () => {
    return (
        <Box>
            <QueryClientProvider client={queryClient}>
            </QueryClientProvider>
        </Box>
    );
}

export default Main;

ReactDOM.render(<Main />, document.getElementById('app'));