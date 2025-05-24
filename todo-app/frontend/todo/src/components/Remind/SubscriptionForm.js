import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Typography,
  Alert,
  Grid,
  InputAdornment,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

/**
 * APIリクエスト関数
 */
const api = {
  // サブスクリプション作成
  createSubscription: async (data) => {
    const response = await axios.post('/api/remind/subscriptions', data);
    return response.data;
  },

  // サブスクリプション更新
  updateSubscription: async ({ id, data }) => {
    const response = await axios.put(`/api/remind/subscriptions/${id}`, data);
    return response.data;
  },

  // メッセージプレビュー取得
  getMessagePreview: async (id, params = {}) => {
    const response = await axios.get(`/api/remind/subscriptions/${id}/preview`, { params });
    return response.data;
  }
};

/**
 * サブスクリプション作成・編集フォームコンポーネント
 */
const SubscriptionForm = ({ open, subscription, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
    amount: '',
    contract_type: 'monthly',
    url: '',
    status: 'active',
    reminder_days: [30, 7, 1],
    reminder_time: '09:00',
    timezone: 'Asia/Tokyo',
    custom_message: '',
    notification_enabled: true
  });

  const [errors, setErrors] = useState({});
  const [previewMessage, setPreviewMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();

  // ミューテーション
  const createMutation = useMutation(api.createSubscription, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      setErrors(error.response?.data?.errors || {});
    }
  });

  const updateMutation = useMutation(api.updateSubscription, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      setErrors(error.response?.data?.errors || {});
    }
  });

  /**
   * フォームデータの初期化
   */
  useEffect(() => {
    if (subscription) {
      setFormData({
        service_name: subscription.service_name || '',
        description: subscription.description || '',
        start_date: new Date(subscription.start_date),
        end_date: new Date(subscription.end_date),
        amount: subscription.amount || '',
        contract_type: subscription.contract_type || 'monthly',
        url: subscription.url || '',
        status: subscription.status || 'active',
        reminder_days: subscription.reminder_days || [30, 7, 1],
        reminder_time: subscription.reminder_time || '09:00',
        timezone: subscription.timezone || 'Asia/Tokyo',
        custom_message: subscription.custom_message || '',
        notification_enabled: subscription.notification_enabled ?? true
      });
    } else {
      // 新規作成時のデフォルト値
      setFormData({
        service_name: '',
        description: '',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        amount: '',
        contract_type: 'monthly',
        url: '',
        status: 'active',
        reminder_days: [30, 7, 1],
        reminder_time: '09:00',
        timezone: 'Asia/Tokyo',
        custom_message: '',
        notification_enabled: true
      });
    }
    setErrors({});
    setShowPreview(false);
  }, [subscription, open]);

  /**
   * フォーム入力の変更処理
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * リマインド日数の追加
   */
  const addReminderDay = () => {
    const newDay = 1;
    if (!formData.reminder_days.includes(newDay)) {
      setFormData(prev => ({
        ...prev,
        reminder_days: [...prev.reminder_days, newDay].sort((a, b) => b - a)
      }));
    }
  };

  /**
   * リマインド日数の削除
   */
  const removeReminderDay = (dayToRemove) => {
    setFormData(prev => ({
      ...prev,
      reminder_days: prev.reminder_days.filter(day => day !== dayToRemove)
    }));
  };

  /**
   * リマインド日数の変更
   */
  const updateReminderDay = (index, newValue) => {
    const numValue = parseInt(newValue, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const newDays = [...formData.reminder_days];
      newDays[index] = numValue;
      setFormData(prev => ({
        ...prev,
        reminder_days: newDays.sort((a, b) => b - a)
      }));
    }
  };

  /**
   * メッセージプレビュー生成
   */
  const generatePreview = () => {
    if (!formData.service_name || !formData.end_date) {
      setPreviewMessage('サービス名と終了日を入力してください');
      setShowPreview(true);
      return;
    }

    const daysBefore = 7; // プレビュー用
    let message = formData.custom_message;

    if (!message) {
      // デフォルトメッセージを生成
      const endDate = new Date(formData.end_date).toLocaleDateString('ja-JP');
      const serviceName = formData.service_name;
      const amount = formData.amount ? `¥${Number(formData.amount).toLocaleString()}` : '¥0';
      
      message = `🔔 サブスクリプション終了のお知らせ\n\n`;
      message += `サービス名: ${serviceName}\n`;
      message += `終了日: ${endDate}\n`;
      message += `金額: ${amount}\n`;
      message += `残り: ${daysBefore}日\n\n`;
      
      if (formData.url) {
        message += `解約・更新はこちら:\n${formData.url}\n\n`;
      }
      
      message += `必要に応じて解約手続きを行ってください。`;
    } else {
      // プレースホルダーを置換
      const endDate = new Date(formData.end_date).toLocaleDateString('ja-JP');
      message = message
        .replace(/{service_name}/g, formData.service_name)
        .replace(/{end_date}/g, endDate)
        .replace(/{amount}/g, formData.amount || '0')
        .replace(/{days_before}/g, daysBefore)
        .replace(/{url}/g, formData.url || '')
        .replace(/{contract_type}/g, getContractTypeLabel(formData.contract_type));
    }

    setPreviewMessage(message);
    setShowPreview(true);
  };

  /**
   * 契約タイプのラベル取得
   */
  const getContractTypeLabel = (type) => {
    const typeMap = {
      monthly: '月額',
      yearly: '年額',
      free_trial: '無料トライアル',
      one_time: '一回払い',
      other: 'その他'
    };
    return typeMap[type] || type;
  };

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    // バリデーション
    const newErrors = {};
    if (!formData.service_name.trim()) newErrors.service_name = 'サービス名は必須です';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = '有効な金額を入力してください';
    if (formData.end_date <= formData.start_date) newErrors.end_date = '終了日は開始日より後にしてください';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // データを整形
    const submitData = {
      ...formData,
      start_date: formData.start_date.toISOString().split('T')[0],
      end_date: formData.end_date.toISOString().split('T')[0],
      amount: parseFloat(formData.amount)
    };

    // 作成または更新
    if (subscription) {
      updateMutation.mutate({ id: subscription.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  /**
   * フォームを閉じる
   */
  const handleClose = () => {
    setFormData({
      service_name: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: '',
      contract_type: 'monthly',
      url: '',
      status: 'active',
      reminder_days: [30, 7, 1],
      reminder_time: '09:00',
      timezone: 'Asia/Tokyo',
      custom_message: '',
      notification_enabled: true
    });
    setErrors({});
    setShowPreview(false);
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="h2">
            {subscription ? 'サブスクリプション編集' : '新しいサブスクリプション'}
          </Typography>
          <IconButton onClick={handleClose} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pb: 1 }}>
            {/* エラー表示 */}
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                入力内容を確認してください
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* 基本情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  基本情報
                </Typography>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  label="サービス名"
                  value={formData.service_name}
                  onChange={(e) => handleInputChange('service_name', e.target.value)}
                  error={!!errors.service_name}
                  helperText={errors.service_name}
                  fullWidth
                  required
                  placeholder="Netflix, Spotify, Adobe など"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>契約タイプ</InputLabel>
                  <Select
                    value={formData.contract_type}
                    label="契約タイプ"
                    onChange={(e) => handleInputChange('contract_type', e.target.value)}
                  >
                    <MenuItem value="monthly">月額</MenuItem>
                    <MenuItem value="yearly">年額</MenuItem>
                    <MenuItem value="free_trial">無料トライアル</MenuItem>
                    <MenuItem value="one_time">一回払い</MenuItem>
                    <MenuItem value="other">その他</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="説明"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="サービスの詳細や用途など（任意）"
                />
              </Grid>

              {/* 期間と金額 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  期間と金額
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="開始日"
                  value={formData.start_date}
                  onChange={(date) => handleInputChange('start_date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <DatePicker
                  label="終了日"
                  value={formData.end_date}
                  onChange={(date) => handleInputChange('end_date', date)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      error={!!errors.end_date}
                      helperText={errors.end_date}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="金額"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="URL"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  fullWidth
                  placeholder="解約ページやサービスのURL（任意）"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>ステータス</InputLabel>
                  <Select
                    value={formData.status}
                    label="ステータス"
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <MenuItem value="active">アクティブ</MenuItem>
                    <MenuItem value="paused">一時停止</MenuItem>
                    <MenuItem value="cancelled">解約済み</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* リマインド設定 */}
              <Grid item xs={12}>
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                      リマインド設定
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.notification_enabled}
                              onChange={(e) => handleInputChange('notification_enabled', e.target.checked)}
                            />
                          }
                          label="リマインド通知を有効にする"
                        />
                      </Grid>

                      {formData.notification_enabled && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                              リマインド日数（終了日の何日前に通知するか）
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              {formData.reminder_days.map((day, index) => (
                                <Chip
                                  key={index}
                                  label={`${day}日前`}
                                  onDelete={() => removeReminderDay(day)}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                              <IconButton
                                size="small"
                                onClick={addReminderDay}
                                color="primary"
                              >
                                <AddIcon />
                              </IconButton>
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              label="通知時間"
                              type="time"
                              value={formData.reminder_time}
                              onChange={(e) => handleInputChange('reminder_time', e.target.value)}
                              fullWidth
                              InputLabelProps={{ shrink: true }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <TextField
                              label="カスタムメッセージ"
                              value={formData.custom_message}
                              onChange={(e) => handleInputChange('custom_message', e.target.value)}
                              fullWidth
                              multiline
                              rows={3}
                              placeholder="独自のメッセージ（任意）。プレースホルダー: {service_name}, {end_date}, {amount}, {days_before}, {url}"
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Button
                              variant="outlined"
                              startIcon={<PreviewIcon />}
                              onClick={generatePreview}
                              sx={{ mr: 2 }}
                            >
                              メッセージプレビュー
                            </Button>
                          </Grid>

                          {showPreview && (
                            <Grid item xs={12}>
                              <Alert severity="info">
                                <Typography variant="subtitle2" gutterBottom>
                                  送信されるメッセージのプレビュー:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  component="pre"
                                  sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'inherit',
                                    mt: 1
                                  }}
                                >
                                  {previewMessage}
                                </Typography>
                              </Alert>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
            <Button onClick={handleClose} color="inherit">
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading ? '保存中...' : subscription ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default SubscriptionForm; 