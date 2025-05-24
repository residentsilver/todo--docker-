import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fab,
  Alert,
  Skeleton,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Preview as PreviewIcon,
  Send as SendIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiClient from '../../api/axios';

/**
 * APIリクエスト関数
 */
const api = {
  // サブスクリプション一覧取得（認証付き）
  fetchSubscriptions: async (params = {}) => {
    const response = await apiClient.get('/remind/subscriptions', { params });
    return response.data;
  },

  // サブスクリプション削除（認証付き）
  deleteSubscription: async (id) => {
    const response = await apiClient.delete(`/remind/subscriptions/${id}`);
    return response.data;
  },

  // テストリマインド送信（認証付き）
  sendTestReminder: async (id, params = {}) => {
    const response = await apiClient.post(`/remind/subscriptions/${id}/test`, params);
    return response.data;
  },

  // メッセージプレビュー取得（認証付き）
  getMessagePreview: async (id, params = {}) => {
    const response = await apiClient.get(`/remind/subscriptions/${id}/preview`, { params });
    return response.data;
  }
};

/**
 * サブスクリプションカードコンポーネント
 */
const SubscriptionCard = ({ subscription, onEdit, onDelete, onTestSend }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // ステータスに応じた色とラベル
  const getStatusChip = (status) => {
    const statusMap = {
      active: { color: 'success', label: 'アクティブ' },
      expired: { color: 'error', label: '期限切れ' },
      cancelled: { color: 'default', label: '解約済み' },
      paused: { color: 'warning', label: '一時停止' },
      pending_renewal: { color: 'info', label: '更新待ち' }
    };
    return statusMap[status] || { color: 'default', label: status };
  };

  // 契約タイプに応じたラベル
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

  // 終了日までの残り日数を計算
  const getDaysUntilEnd = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilEnd = getDaysUntilEnd(subscription.end_date);
  const statusChip = getStatusChip(subscription.status);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: subscription.status === 'active' && daysUntilEnd <= 7 
          ? '2px solid #ff9800' 
          : '1px solid rgba(0,0,0,0.12)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* ヘッダー部分 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: subscription.status === 'active' ? 'primary.main' : 'grey.400',
                width: 40,
                height: 40,
                mr: 1.5
              }}
            >
              {subscription.service_name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: 600,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {subscription.service_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  label={statusChip.label}
                  color={statusChip.color}
                  size="small"
                  variant="filled"
                />
                <Chip
                  label={getContractTypeLabel(subscription.contract_type)}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* コンテンツ部分 */}
        <Box sx={{ space: 2 }}>
          {/* 金額 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <MoneyIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              ¥{Number(subscription.amount).toLocaleString()}
            </Typography>
          </Box>

          {/* 終了日 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(subscription.end_date).toLocaleDateString('ja-JP')} 終了
            </Typography>
            {subscription.status === 'active' && (
              <Chip
                label={`あと${daysUntilEnd}日`}
                color={daysUntilEnd <= 7 ? 'error' : daysUntilEnd <= 30 ? 'warning' : 'default'}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Box>

          {/* URL */}
          {subscription.url && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LinkIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <Typography
                variant="body2"
                color="primary"
                component="a"
                href={subscription.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                サービスページ
              </Typography>
            </Box>
          )}

          {/* 通知設定 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {subscription.notification_enabled ? (
              <NotificationsIcon sx={{ fontSize: 18, color: 'success.main', mr: 1 }} />
            ) : (
              <NotificationsOffIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              通知: {subscription.notification_enabled ? 'ON' : 'OFF'}
            </Typography>
            {subscription.notification_enabled && subscription.reminder_days && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({subscription.reminder_days.join(', ')}日前)
              </Typography>
            )}
          </Box>

          {/* 説明 */}
          {subscription.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {subscription.description}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* アクションボタン */}
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(subscription)}
        >
          編集
        </Button>
        {subscription.status === 'active' && subscription.notification_enabled && (
          <Button
            size="small"
            startIcon={<SendIcon />}
            onClick={() => onTestSend(subscription)}
            color="secondary"
          >
            テスト送信
          </Button>
        )}
      </CardActions>

      {/* メニュー */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { onEdit(subscription); handleMenuClose(); }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onTestSend(subscription); handleMenuClose(); }}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>テスト送信</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { onDelete(subscription.id); handleMenuClose(); }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );
};

/**
 * サブスクリプション一覧コンポーネント
 */
const SubscriptionList = ({ onEdit, onCreate }) => {
  const [filters, setFilters] = useState({
    status: '',
    contract_type: '',
    sort_by: 'end_date',
    sort_order: 'asc'
  });

  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // サブスクリプション一覧を取得
  const {
    data: subscriptionsData,
    isLoading,
    error
  } = useQuery(
    ['subscriptions', filters],
    () => api.fetchSubscriptions(filters),
    {
      keepPreviousData: true,
      // onSuccess: (data) => {
      //   // デバッグ用ログ
      //   console.log('🔍 API Response Debug:', {
      //     fullResponse: data,
      //     dataProperty: data?.data,
      //     actualSubscriptions: data?.data?.data,
      //     subscriptionsLength: data?.data?.data?.length || 0
      //   });
      // },
      // onError: (error) => {
      //   console.error('❌ API Error:', error);
      // }
    }
  );

  // 削除ミューテーション
  const deleteMutation = useMutation(api.deleteSubscription, {
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
    }
  });

  // テスト送信ミューテーション
  const testSendMutation = useMutation(
    ({ id, params }) => api.sendTestReminder(id, params),
    {
      onSuccess: () => {
        // 必要に応じて通知表示
      }
    }
  );

  /**
   * フィルター変更処理
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /**
   * サブスクリプション削除
   */
  const handleDelete = async (id) => {
    if (window.confirm('このサブスクリプションを削除しますか？')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('削除エラー:', error);
      }
    }
  };

  /**
   * テストリマインダー送信
   */
  const handleTestSend = async (subscription) => {
    try {
      await testSendMutation.mutateAsync({ 
        id: subscription.id, 
        params: { days_before: 7 } 
      });
      alert('テストリマインダーを送信しました');
    } catch (error) {
      console.error('テスト送信エラー:', error);
      alert('テスト送信に失敗しました');
    }
  };

  // データ取得の改善（複数のパターンに対応）
  const subscriptions = subscriptionsData?.data?.data || subscriptionsData?.data || subscriptionsData || [];
  
  // // デバッグ用ログ（本番環境では削除推奨）
  // console.log('📊 Subscriptions Debug:', {
  //   subscriptionsData,
  //   extractedSubscriptions: subscriptions,
  //   length: subscriptions.length,
  //   isLoading,
  //   error: error?.message
  // });

  return (
    <Box>
      {/* デバッグ情報表示（開発用、本番では削除） */}
      {/* {process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption">
            🐛 Debug: APIデータ={JSON.stringify(subscriptionsData?.data)} | 
            サブスクリプション数={subscriptions.length} | 
            読み込み中={isLoading.toString()}
          </Typography>
        </Alert>
      )} */}

      {/* フィルター・ソート */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={filters.status}
                label="ステータス"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="active">アクティブ</MenuItem>
                <MenuItem value="expired">期限切れ</MenuItem>
                <MenuItem value="cancelled">解約済み</MenuItem>
                <MenuItem value="paused">一時停止</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>契約タイプ</InputLabel>
              <Select
                value={filters.contract_type}
                label="契約タイプ"
                onChange={(e) => handleFilterChange('contract_type', e.target.value)}
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="monthly">月額</MenuItem>
                <MenuItem value="yearly">年額</MenuItem>
                <MenuItem value="free_trial">無料トライアル</MenuItem>
                <MenuItem value="one_time">一回払い</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>ソート</InputLabel>
              <Select
                value={filters.sort_by}
                label="ソート"
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              >
                <MenuItem value="end_date">終了日</MenuItem>
                <MenuItem value="created_at">作成日</MenuItem>
                <MenuItem value="amount">金額</MenuItem>
                <MenuItem value="service_name">サービス名</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>順序</InputLabel>
              <Select
                value={filters.sort_order}
                label="順序"
                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
              >
                <MenuItem value="asc">昇順</MenuItem>
                <MenuItem value="desc">降順</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          データの取得に失敗しました: {error.message}
        </Alert>
      )}

      {/* ローディング */}
      {isLoading && (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Card sx={{ height: 280 }}>
                <CardContent>
                  <Skeleton variant="rectangular" height={120} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* サブスクリプション一覧 */}
      {!isLoading && (
        <>
          {subscriptions.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary'
              }}
            >
              <NotificationsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                サブスクリプションがありません
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                新しいサブスクリプションを追加して、リマインド通知を設定しましょう
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreate}
                size="large"
              >
                サブスクリプションを追加
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {subscriptions.map((subscription) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={subscription.id}>
                  <SubscriptionCard
                    subscription={subscription}
                    onEdit={onEdit}
                    onDelete={handleDelete}
                    onTestSend={handleTestSend}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        aria-label="サブスクリプションを追加"
        onClick={onCreate}
        sx={{
          position: 'fixed',
          bottom: isMobile ? 80 : 32,
          right: isMobile ? 16 : 32,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default SubscriptionList; 