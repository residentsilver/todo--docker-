import React from 'react';
import reactDom from 'react-dom';
import { Box } from '@mui/material';
import { Navigation } from './Navigation';

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from './Home';

const client = new ApolloClient({
    uri: 'http://localhost:8080/graphql',
    cache: new InMemoryCache()
});

const Main = () => {
    return (
        <Box>
            <Navigation></Navigation >
            <Router>
                <QueryClientProvider client={client}>
                    <main className={"m-5"}>
                        <Switch>
                            <Route path="/main" component={Home} />
                        </Switch>
                    </main>
                </QueryClientProvider>
            </Router>
        </Box>
    );
}

export default Main;
ReactDOM.render(<Main />, document.getElementById('app'));