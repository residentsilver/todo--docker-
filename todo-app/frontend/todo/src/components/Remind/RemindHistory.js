import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

/**
 * APIリクエスト関数
 */
const api = {
  // リマインド履歴取得
  fetchReminderHistories: async (params = {}) => {
    const response = await axios.get('/api/remind/histories', { params });
    return response.data;
  }
};

/**
 * ステータスチップコンポーネント
 */
const StatusChip = ({ status }) => {
  const statusConfig = {
    pending: {
      label: '送信待ち',
      color: 'warning',
      icon: <ScheduleIcon sx={{ fontSize: 16 }} />
    },
    sent: {
      label: '送信済み',
      color: 'success',
      icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
    },
    failed: {
      label: '送信失敗',
      color: 'error',
      icon: <ErrorIcon sx={{ fontSize: 16 }} />
    },
    cancelled: {
      label: 'キャンセル',
      color: 'default',
      icon: <CancelIcon sx={{ fontSize: 16 }} />
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      variant="filled"
    />
  );
};

/**
 * モバイル用履歴カードコンポーネント
 */
const HistoryCard = ({ history }) => {
  return (
    <Card sx={{ mb: 2, borderRadius: 2 }}>
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 32,
                height: 32,
                mr: 1.5,
                fontSize: '0.875rem'
              }}
            >
              {history.subscription?.service_name?.charAt(0).toUpperCase() || 'S'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {history.subscription?.service_name || 'Unknown Service'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {history.days_before}日前の通知
              </Typography>
            </Box>
          </Box>
          <StatusChip status={history.status} />
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">
              送信予定
            </Typography>
            <Typography variant="body2">
              {new Date(history.scheduled_at).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Grid>
          {history.sent_at && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                送信完了
              </Typography>
              <Typography variant="body2">
                {new Date(history.sent_at).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Grid>
          )}
        </Grid>

        {history.error_message && (
          <Alert severity="error" sx={{ mt: 2, fontSize: '0.75rem' }}>
            {history.error_message}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * リマインド履歴コンポーネント
 */
const RemindHistory = () => {
  const [filters, setFilters] = useState({
    status: '',
    subscription_id: '',
    sort_by: 'scheduled_at',
    sort_order: 'desc'
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // リマインド履歴を取得
  const {
    data: historiesData,
    isLoading,
    error,
    refetch
  } = useQuery(
    ['reminder-histories', { ...filters, page: page + 1, per_page: rowsPerPage }],
    () => api.fetchReminderHistories({
      ...filters,
      page: page + 1,
      per_page: rowsPerPage
    }),
    {
      keepPreviousData: true
    }
  );

  /**
   * フィルター変更処理
   */
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // ページをリセット
  };

  /**
   * ページ変更処理
   */
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * 1ページあたりの行数変更処理
   */
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const histories = historiesData?.data?.data || [];
  const totalCount = historiesData?.data?.total || 0;

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <HistoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          リマインド履歴
        </Typography>
        <Tooltip title="データを更新">
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* フィルター */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterIcon sx={{ mr: 1, fontSize: 20 }} />
          フィルター
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>ステータス</InputLabel>
              <Select
                value={filters.status}
                label="ステータス"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="pending">送信待ち</MenuItem>
                <MenuItem value="sent">送信済み</MenuItem>
                <MenuItem value="failed">送信失敗</MenuItem>
                <MenuItem value="cancelled">キャンセル</MenuItem>
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
                <MenuItem value="scheduled_at">送信予定日時</MenuItem>
                <MenuItem value="sent_at">送信完了日時</MenuItem>
                <MenuItem value="created_at">作成日時</MenuItem>
                <MenuItem value="days_before">通知日数</MenuItem>
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
                <MenuItem value="desc">降順（新しい順）</MenuItem>
                <MenuItem value="asc">昇順（古い順）</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          データの取得に失敗しました: {error.message}
        </Alert>
      )}

      {/* ローディング */}
      {isLoading && (
        <Box>
          {isMobile ? (
            // モバイル用スケルトン
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={32} height={32} sx={{ mr: 1.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                  </Box>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            ))
          ) : (
            // デスクトップ用スケルトン
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>サービス</TableCell>
                    <TableCell>通知日数</TableCell>
                    <TableCell>送信予定</TableCell>
                    <TableCell>送信完了</TableCell>
                    <TableCell>ステータス</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* コンテンツ */}
      {!isLoading && (
        <>
          {histories.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary'
              }}
            >
              <HistoryIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                リマインド履歴がありません
              </Typography>
              <Typography variant="body2">
                サブスクリプションを追加すると、リマインド通知の履歴がここに表示されます
              </Typography>
            </Box>
          ) : (
            <>
              {isMobile ? (
                // モバイル表示
                <Box>
                  {histories.map((history) => (
                    <HistoryCard key={history.id} history={history} />
                  ))}
                </Box>
              ) : (
                // デスクトップ表示
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600 }}>サービス</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>通知日数</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>送信予定</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>送信完了</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>ステータス</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>エラー</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {histories.map((history) => (
                        <TableRow 
                          key={history.id}
                          sx={{ 
                            '&:hover': { bgcolor: 'grey.50' },
                            '&:last-child td, &:last-child th': { border: 0 }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.main',
                                  width: 32,
                                  height: 32,
                                  mr: 1.5,
                                  fontSize: '0.875rem'
                                }}
                              >
                                {history.subscription?.service_name?.charAt(0).toUpperCase() || 'S'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {history.subscription?.service_name || 'Unknown Service'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ¥{Number(history.subscription?.amount || 0).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${history.days_before}日前`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(history.scheduled_at).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {history.sent_at ? (
                              <Typography variant="body2">
                                {new Date(history.sent_at).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={history.status} />
                          </TableCell>
                          <TableCell>
                            {history.error_message ? (
                              <Tooltip title={history.error_message}>
                                <Chip
                                  label="エラー詳細"
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                  sx={{ cursor: 'pointer' }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                -
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* ページネーション */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <TablePagination
                  component="div"
                  count={totalCount}
                  page={page}
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count !== -1 ? count : `more than ${to}`}`
                  }
                  labelRowsPerPage="表示件数:"
                />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default RemindHistory; 