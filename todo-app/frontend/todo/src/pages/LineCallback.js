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
        const errorDescription = searchParams.get('error_description');

        // LINE認証エラーの処理
        if (error) {
          let errorMessage = 'LINE認証に失敗しました';
          
          // 開発者モードエラーの場合
          if (error === 'access_denied' || errorDescription?.includes('developing status') || errorDescription?.includes('developer role')) {
            errorMessage = 'LINEチャネルが開発者モードのため、開発者ロールを持つユーザーのみ認証できます。\n\n' +
                          '解決方法：\n' +
                          '1. LINE Developers Consoleにアクセス\n' +
                          '2. チャネル設定で「公開」状態に変更する\n' +
                          '3. または、開発者ロールを持つLINEアカウントで認証する';
          } else if (errorDescription) {
            errorMessage = `LINE認証エラー: ${errorDescription}`;
          } else {
            errorMessage = `LINE認証エラー: ${error}`;
          }
          
          throw new Error(errorMessage);
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
          
          // localStorageに完了状態を保存（QRコード認証時の元ブラウザへの通知用）
          try {
            localStorage.setItem(`line_connection_state_${state}`, 'completed');
            // 同じタブでもstorageイベントを発火させるため、一度削除して再設定
            localStorage.removeItem(`line_connection_state_${state}`);
            localStorage.setItem(`line_connection_state_${state}`, 'completed');
          } catch (e) {
            console.warn('localStorageへの保存に失敗しました:', e);
          }
          
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
        
        // エラーメッセージを整形（改行を適切に処理）
        const errorMessage = error.message || 'LINE連携に失敗しました';
        setMessage(errorMessage);
        
        // エラー時もlocalStorageにエラー状態を保存
        const state = searchParams.get('state');
        if (state) {
          try {
            localStorage.setItem(`line_connection_state_${state}`, 'error');
          } catch (e) {
            console.warn('localStorageへの保存に失敗しました:', e);
          }
        }
        
        // 開発者モードエラーの場合はリダイレクト時間を長めに設定
        const isDeveloperModeError = errorMessage.includes('開発者モード') || errorMessage.includes('developer role');
        const redirectDelay = isDeveloperModeError ? 10000 : 5000;
        
        setTimeout(() => {
          navigate('/remind/settings');
        }, redirectDelay);
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
          <Alert severity="error" sx={{ mb: 3, minWidth: 400, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              LINE連携失敗
            </Typography>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {message}
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {message.includes('開発者モード') ? '10秒後' : '5秒後'}に設定ページに戻ります...
          </Typography>
        </>
      )}
    </Box>
  );
};

export default LineCallback; 