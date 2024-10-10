import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
// import App from './pages/App';
import reportWebVitals from './reportWebVitals';
import Menu from './components/Layout/Menu';
import { Box } from '@mui/material';
import Routing from './components/Route/Routing';
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Box>
    <Menu/>
    {/* <React.StrictMode> */}
    {/* <App /> */}
    { <Routing />}
  {/* </React.StrictMode> */}
  </Box>
);

reportWebVitals();