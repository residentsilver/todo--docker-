import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
// import App from './pages/App';
import reportWebVitals from './reportWebVitals';
// Menu コンポーネントはRouting内で管理されるため、ここからは削除
import { Box } from '@mui/material';
import Routing from './components/Route/Routing';

/**
 * アプリケーションのエントリーポイント
 * 
 * @description React アプリケーションのメインエントリーポイント
 *              ルーティングとレイアウトを初期化
 */

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Box>
    {/* MenuコンポーネントはRouting内で管理されるため、ここでは不要 */}
    {/* <React.StrictMode> */}
    {/* <App /> */}
    <Routing />
    {/* </React.StrictMode> */}
  </Box>
);

reportWebVitals();