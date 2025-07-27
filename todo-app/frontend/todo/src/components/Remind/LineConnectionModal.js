import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * LINE連携モーダルコンポーネント
 */
const LineConnectionModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { authenticatedRequest } = useAuth();

  /**
   * LINE連携を開始
   */
  const handleStartConnection = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 認証URLを取得
      const response = await authenticatedRequest('/line/auth-url', {
        method: 'GET'
      });
      
      // LINE認証ページにリダイレクト
      window.open(response.data.auth_url, '_blank', 'width=500,height=600');
      
      // ポーリングで連携完了を監視
      const checkConnection = setInterval(async () => {
        try {
          const statusResponse = await authenticatedRequest('/remind/line/status');
          if (statusResponse.data.connected) {
            clearInterval(checkConnection);
            setLoading(false);
            onSuccess();
            onClose();
          }
        } catch (error) {
          // まだ連携されていない場合は継続
        }
      }, 2000);
      
      // 30秒後にタイムアウト
      setTimeout(() => {
        clearInterval(checkConnection);
        setLoading(false);
        setError('連携がタイムアウトしました。再度お試しください。');
      }, 30000);
      
    } catch (error) {
      setLoading(false);
      setError('連携の開始に失敗しました: ' + error.message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>LINE連携</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              LINE連携を進めています...
            </Typography>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" gutterBottom>
          LINEアカウントと連携することで、サブスクリプションの終了前に
          LINEメッセージでリマインド通知を受け取ることができます。
        </Typography>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            連携手順：
          </Typography>
          <Typography variant="body2" component="ol" sx={{ pl: 2 }}>
            <li>「LINE連携を開始」ボタンをクリック</li>
            <li>開いたウィンドウでLINEにログイン</li>
            <li>アプリとの連携を許可</li>
            <li>ウィンドウを閉じて完了を待つ</li>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          キャンセル
        </Button>
        <Button 
          onClick={handleStartConnection} 
          variant="contained" 
          disabled={loading}
        >
          LINE連携を開始
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LineConnectionModal; 