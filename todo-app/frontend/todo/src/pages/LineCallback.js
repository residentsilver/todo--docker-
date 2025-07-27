import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import apiClient from '../api/axios';

/**
 * LINE認証コールバックページ
 */
const LineCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('LINE連携を処理中...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`LINE認証エラー: ${error}`);
        }

        if (!code || !state) {
          throw new Error('認証パラメータが不正です');
        }

        // バックエンドのコールバックエンドポイントに送信
        const response = await apiClient.get('/line/callback', {
          params: { code, state }
        });

        if (response.data.status === 'success') {
          setStatus('success');
          setMessage('LINE連携が完了しました！');
          
          // 3秒後に設定ページにリダイレクト
          setTimeout(() => {
            navigate('/remind/settings');
          }, 3000);
        } else {
          throw new Error(response.data.message || 'LINE連携に失敗しました');
        }

      } catch (error) {
        console.error('LINE連携エラー:', error);
        setStatus('error');
        setMessage(error.message || 'LINE連携に失敗しました');
        
        // 5秒後に設定ページにリダイレクト
        setTimeout(() => {
          navigate('/remind/settings');
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom>
            LINE連携を処理中...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            しばらくお待ちください
          </Typography>
        </>
      )}

      {status === 'success' && (
        <>
          <Alert severity="success" sx={{ mb: 3, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              ✅ LINE連携完了
            </Typography>
            <Typography variant="body2">
              {message}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            3秒後に設定ページに戻ります...
          </Typography>
        </>
      )}

      {status === 'error' && (
        <>
          <Alert severity="error" sx={{ mb: 3, minWidth: 300 }}>
            <Typography variant="h6" gutterBottom>
              ❌ LINE連携失敗
            </Typography>
            <Typography variant="body2">
              {message}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            5秒後に設定ページに戻ります...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default LineCallback; 