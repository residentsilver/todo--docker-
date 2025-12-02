import React, { useState, useEffect, useRef } from 'react';
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
  const pollingIntervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const storageListenerRef = useRef(null);
  const currentStateRef = useRef(null);

  /**
   * クリーンアップ処理
   */
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (storageListenerRef.current) {
        window.removeEventListener('storage', storageListenerRef.current);
      }
      // localStorageの監視用キーをクリア
      if (currentStateRef.current) {
        localStorage.removeItem(`line_connection_state_${currentStateRef.current}`);
      }
    };
  }, []);

  /**
   * 連携完了を処理
   */
  const handleConnectionSuccess = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (storageListenerRef.current) {
      window.removeEventListener('storage', storageListenerRef.current);
      storageListenerRef.current = null;
    }
    if (currentStateRef.current) {
      localStorage.removeItem(`line_connection_state_${currentStateRef.current}`);
      currentStateRef.current = null;
    }
    setLoading(false);
    onSuccess();
    onClose();
  };

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
      
      const state = response.data.state;
      currentStateRef.current = state;
      
      // stateをlocalStorageに保存（QRコード認証時の検知用）
      localStorage.setItem(`line_connection_state_${state}`, 'pending');
      
      // LINE認証ページにリダイレクト
      window.open(response.data.auth_url, '_blank', 'width=500,height=600');
      
      // storageイベントで連携完了を監視（QRコード認証対応 - 別タブ/別デバイス）
      storageListenerRef.current = (e) => {
        if (e.key === `line_connection_state_${state}`) {
          if (e.newValue === 'completed') {
            handleConnectionSuccess();
          } else if (e.newValue === 'error') {
            // エラー状態を検知
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            window.removeEventListener('storage', storageListenerRef.current);
            storageListenerRef.current = null;
            localStorage.removeItem(`line_connection_state_${state}`);
            setLoading(false);
            setError('LINE連携に失敗しました。エラー詳細はコールバックページで確認できます。');
          }
        }
      };
      window.addEventListener('storage', storageListenerRef.current);
      
      // ポーリングで連携完了を監視（通常のブラウザ認証用 + localStorageチェック）
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // localStorageを直接チェック（同じタブでの認証完了検知用）
          const connectionState = localStorage.getItem(`line_connection_state_${state}`);
          if (connectionState === 'completed') {
            handleConnectionSuccess();
            return;
          }
          
          // エラー状態をチェック
          if (connectionState === 'error') {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            if (storageListenerRef.current) {
              window.removeEventListener('storage', storageListenerRef.current);
              storageListenerRef.current = null;
            }
            localStorage.removeItem(`line_connection_state_${state}`);
            setLoading(false);
            setError('LINE連携に失敗しました。エラー詳細はコールバックページで確認できます。');
            return;
          }
          
          // APIで連携状態を確認
          const statusResponse = await authenticatedRequest('/remind/line/status');
          if (statusResponse.data.connected) {
            handleConnectionSuccess();
          }
        } catch (error) {
          // まだ連携されていない場合は継続
        }
      }, 2000);
      
      // 5分後にタイムアウト（QRコード認証に時間がかかるため延長）
      timeoutRef.current = setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (storageListenerRef.current) {
          window.removeEventListener('storage', storageListenerRef.current);
          storageListenerRef.current = null;
        }
        if (currentStateRef.current) {
          localStorage.removeItem(`line_connection_state_${currentStateRef.current}`);
          currentStateRef.current = null;
        }
        setLoading(false);
        setError('連携がタイムアウトしました。再度お試しください。');
      }, 300000); // 5分
      
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
            <li>開いたウィンドウでLINEにログイン、またはQRコードをスキャン</li>
            <li>アプリとの連携を許可</li>
            <li>この画面で完了を待つ（最大5分）</li>
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>QRコード認証の場合：</strong>
              <br />
              スマートフォンでQRコードをスキャンして認証を完了してください。
              認証完了後、この画面で自動的に連携が完了します。
            </Typography>
          </Alert>
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