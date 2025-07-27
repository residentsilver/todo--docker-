import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Link as LinkIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import apiClient from '../../api/axios';
import LineConnectionModal from './LineConnectionModal';

/**
 * APIリクエスト関数
 */
const api = {
  // ユーザー設定取得（認証付き）
  fetchUserSettings: async () => {
    const response = await apiClient.get('/remind/settings');
    return response.data;
  },

  // ユーザー設定更新（認証付き）
  updateUserSettings: async (data) => {
    const response = await apiClient.put('/remind/settings', data);
    return response.data;
  },

  // LINE連携状態確認（認証付き）
  checkLineConnection: async () => {
    const response = await apiClient.get('/remind/line/status');
    return response.data;
  }
};

/**
 * LINE連携設定コンポーネント
 */
const LineConnectionSettings = ({ onConnectionSuccess }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    displayName: '',
    pictureUrl: '',
    lastUsed: null
  });
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const queryClient = useQueryClient();

  // LINE連携状態を確認
  const {
    data: lineStatusData,
    isLoading: isLoadingLineStatus,
    error: lineStatusError,
    refetch: refetchLineStatus
  } = useQuery(
    ['line-status'],
    () => api.checkLineConnection(),
    {
      onSuccess: (data) => {
        setConnectionStatus(data.data || {
          connected: false,
          displayName: '',
          pictureUrl: '',
          lastUsed: null
        });
      },
      retry: false
    }
  );

  // LINE連携解除ミューテーション
  const disconnectMutation = useMutation(
    () => apiClient.delete('/remind/line/disconnect'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['line-status']);
        setConnectionStatus({
          connected: false,
          displayName: '',
          pictureUrl: '',
          lastUsed: null
        });
      }
    }
  );

  /**
   * LINE連携成功時の処理
   */
  const handleConnectionSuccess = () => {
    refetchLineStatus();
    if (onConnectionSuccess) {
      onConnectionSuccess();
    }
  };

  /**
   * LINE連携解除
   */
  const handleDisconnect = async () => {
    if (window.confirm('LINE連携を解除しますか？')) {
      try {
        await disconnectMutation.mutateAsync();
      } catch (error) {
        console.error('LINE連携解除エラー:', error);
      }
    }
  };

  return (
    <>
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LinkIcon sx={{ mr: 1, color: 'primary.main' }} />
            LINE連携設定
          </Typography>

          <Box sx={{ mt: 2 }}>
            {isLoadingLineStatus ? (
              <Alert severity="info">
                LINE連携状態を確認中...
              </Alert>
            ) : lineStatusError ? (
              <Alert severity="warning">
                LINE連携状態を確認できませんでした。現在LINE連携は利用できません。
              </Alert>
            ) : connectionStatus.connected ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckIcon sx={{ mr: 1 }} />
                    LINE連携が有効です
                  </Box>
                </Alert>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="アカウント名"
                      secondary={connectionStatus.line_display_name || connectionStatus.displayName || '取得中...'}
                    />
                  </ListItem>
                  {(connectionStatus.lastUsed || connectionStatus.connection_date) && (
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="接続日時"
                        secondary={new Date(connectionStatus.lastUsed || connectionStatus.connection_date).toLocaleDateString('ja-JP')}
                      />
                    </ListItem>
                  )}
                </List>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisconnect}
                    disabled={disconnectMutation.isLoading}
                  >
                    {disconnectMutation.isLoading ? '解除中...' : 'LINE連携を解除'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ErrorIcon sx={{ mr: 1 }} />
                    LINE連携が設定されていません
                  </Box>
                </Alert>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  リマインド通知を受け取るには、LINEアカウントとの連携が必要です。
                  連携により、サブスクリプションの終了前に自動でLINEメッセージが送信されます。
                </Typography>

                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={() => setShowConnectionModal(true)}
                  sx={{ mb: 1 }}
                >
                  LINE連携を設定
                </Button>
                
                <Typography variant="caption" color="text.secondary" display="block">
                  ※ 安全なLINE公式の認証システムを使用します
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* LINE連携モーダル */}
      <LineConnectionModal
        open={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSuccess={handleConnectionSuccess}
      />
    </>
  );
};

/**
 * 通知設定コンポーネント
 */
const NotificationSettings = ({ settings, onSettingsChange }) => {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
          通知設定
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notification_enabled}
                  onChange={(e) => onSettingsChange('notification_enabled', e.target.checked)}
                />
              }
              label="リマインド通知を有効にする"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              すべてのサブスクリプションの通知を一括で制御します
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.line_notification_enabled}
                  onChange={(e) => onSettingsChange('line_notification_enabled', e.target.checked)}
                  disabled={!settings.notification_enabled}
                />
              }
              label="LINE通知を有効にする"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              LINE連携が設定されている場合のみ利用可能です
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="デフォルト通知時間"
              type="time"
              value={settings.default_reminder_time || '09:00'}
              onChange={(e) => onSettingsChange('default_reminder_time', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="新しいサブスクリプションのデフォルト通知時間"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>タイムゾーン</InputLabel>
              <Select
                value={settings.timezone || 'Asia/Tokyo'}
                label="タイムゾーン"
                onChange={(e) => onSettingsChange('timezone', e.target.value)}
              >
                <MenuItem value="Asia/Tokyo">Asia/Tokyo (日本時間)</MenuItem>
                <MenuItem value="UTC">UTC (協定世界時)</MenuItem>
                <MenuItem value="America/New_York">America/New_York (東部時間)</MenuItem>
                <MenuItem value="Europe/London">Europe/London (イギリス時間)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              デフォルトリマインド日数
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {(settings.default_reminder_days || [30, 7, 1]).map((day, index) => (
                <Chip
                  key={index}
                  label={`${day}日前`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary">
              新しいサブスクリプションのデフォルト設定
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="デフォルトカスタムメッセージ"
              value={settings.default_custom_message || ''}
              onChange={(e) => onSettingsChange('default_custom_message', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="新しいサブスクリプションで使用するデフォルトメッセージ（任意）"
              helperText="プレースホルダー: {service_name}, {end_date}, {amount}, {days_before}, {url}"
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * 表示設定コンポーネント
 */
const DisplaySettings = ({ settings, onSettingsChange }) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <PaletteIcon sx={{ mr: 1, color: 'primary.main' }} />
          表示設定
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>テーマ</InputLabel>
              <Select
                value={settings.theme || 'light'}
                label="テーマ"
                onChange={(e) => onSettingsChange('theme', e.target.value)}
              >
                <MenuItem value="light">ライトモード</MenuItem>
                <MenuItem value="dark">ダークモード</MenuItem>
                <MenuItem value="auto">自動</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>通貨</InputLabel>
              <Select
                value={settings.currency || 'JPY'}
                label="通貨"
                onChange={(e) => onSettingsChange('currency', e.target.value)}
              >
                <MenuItem value="JPY">日本円 (¥)</MenuItem>
                <MenuItem value="USD">米ドル ($)</MenuItem>
                <MenuItem value="EUR">ユーロ (€)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>日付形式</InputLabel>
              <Select
                value={settings.date_format || 'Y-m-d'}
                label="日付形式"
                onChange={(e) => onSettingsChange('date_format', e.target.value)}
              >
                <MenuItem value="Y-m-d">YYYY-MM-DD</MenuItem>
                <MenuItem value="Y/m/d">YYYY/MM/DD</MenuItem>
                <MenuItem value="d/m/Y">DD/MM/YYYY</MenuItem>
                <MenuItem value="m/d/Y">MM/DD/YYYY</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * その他設定コンポーネント
 */
const OtherSettings = ({ settings, onSettingsChange }) => {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
          その他の設定
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.email_notification_enabled || false}
                  onChange={(e) => onSettingsChange('email_notification_enabled', e.target.checked)}
                  disabled
                />
              }
              label="メール通知を有効にする（準備中）"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              将来のアップデートで利用可能になります
            </Typography>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

/**
 * リマインド設定コンポーネント
 */
const RemindSettings = () => {
  const [settings, setSettings] = useState({
    default_reminder_days: [30, 7, 1],
    default_reminder_time: '09:00',
    timezone: 'Asia/Tokyo',
    default_custom_message: '',
    notification_enabled: true,
    line_notification_enabled: true,
    currency: 'JPY',
    date_format: 'Y-m-d',
    theme: 'light',
    email_notification_enabled: false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // ユーザー設定を取得
  const {
    data: settingsData,
    isLoading,
    error
  } = useQuery(
    ['user-settings'],
    () => api.fetchUserSettings(),
    {
      onSuccess: (data) => {
        if (data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      },
      retry: false
    }
  );

  // 設定更新ミューテーション
  const updateMutation = useMutation(api.updateUserSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries(['user-settings']);
      setHasChanges(false);
    }
  });

  /**
   * 設定変更処理
   */
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  /**
   * 設定保存処理
   */
  const handleSaveSettings = async () => {
    try {
      await updateMutation.mutateAsync(settings);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  };

  /**
   * 設定をリセット
   */
  const handleResetSettings = () => {
    if (settingsData?.data) {
      setSettings(prev => ({ ...prev, ...settingsData.data }));
      setHasChanges(false);
    }
  };

  /**
   * LINE連携成功時の処理
   */
  const handleLineConnectionSuccess = () => {
    // LINE連携後に関連するクエリを更新
    queryClient.invalidateQueries(['line-status']);
    queryClient.invalidateQueries(['user-settings']);
  };

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
          設定
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {hasChanges && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleResetSettings}
              size="small"
            >
              リセット
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={!hasChanges || updateMutation.isLoading}
            size="small"
          >
            {updateMutation.isLoading ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          設定の読み込みに失敗しました。デフォルト設定で表示しています。
        </Alert>
      )}

      {/* 保存成功メッセージ */}
      {updateMutation.isSuccess && !hasChanges && (
        <Alert severity="success" sx={{ mb: 3 }}>
          設定を保存しました
        </Alert>
      )}

      {/* 保存エラーメッセージ */}
      {updateMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          設定の保存に失敗しました: {updateMutation.error?.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* LINE連携設定 */}
        <Grid item xs={12}>
          <LineConnectionSettings onConnectionSuccess={handleLineConnectionSuccess} />
        </Grid>

        {/* 設定アコーディオン */}
        <Grid item xs={12}>
          <Box sx={{ '& .MuiAccordion-root': { borderRadius: 2, mb: 1 } }}>
            <NotificationSettings
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            <DisplaySettings
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            <OtherSettings
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RemindSettings; 