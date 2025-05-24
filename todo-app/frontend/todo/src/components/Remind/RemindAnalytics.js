import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  Subscriptions as SubscriptionsIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import axios from 'axios';

/**
 * APIリクエスト関数
 */
const api = {
  // 月別支払い合計取得
  fetchMonthlyTotals: async (year) => {
    const response = await axios.get('/api/remind/monthly-totals', {
      params: { year }
    });
    return response.data;
  },

  // サブスクリプション一覧取得（統計用）
  fetchSubscriptionsForStats: async () => {
    const response = await axios.get('/api/remind/subscriptions', {
      params: { per_page: 1000 } // 全件取得
    });
    return response.data;
  }
};

/**
 * 統計カードコンポーネント
 */
const StatCard = ({ title, value, subtitle, icon, color = 'primary', trend = null }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: `1px solid ${theme.palette[color].light}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, color: `${color}.main` }}>
              {title}
            </Typography>
            <Typography variant="h4" component="p" sx={{ fontWeight: 700, my: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : trend < 0 ? (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                ) : null}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend > 0 ? 'success.main' : trend < 0 ? 'error.main' : 'text.secondary'
                  }}
                >
                  {trend > 0 ? '+' : ''}{trend}% 前年同月比
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * 月別チャートコンポーネント（簡易版）
 */
const MonthlyChart = ({ data, year }) => {
  const theme = useTheme();
  const maxAmount = Math.max(...data.map(item => item.total));

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
        {year}年 月別支払い推移
      </Typography>

      <Box sx={{ mt: 3 }}>
        {data.map((item, index) => (
          <Box key={item.month} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {monthNames[index]}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                ¥{item.formatted_total}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={maxAmount > 0 ? (item.total / maxAmount) * 100 : 0}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  bgcolor: item.total > 0 ? 'primary.main' : 'grey.300'
                }
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

/**
 * サブスクリプション分析コンポーネント
 */
const SubscriptionAnalysis = ({ subscriptions }) => {
  const theme = useTheme();

  // 契約タイプ別集計
  const contractTypeStats = subscriptions.reduce((acc, sub) => {
    const type = sub.contract_type;
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count += 1;
    acc[type].total += parseFloat(sub.amount || 0);
    return acc;
  }, {});

  // ステータス別集計
  const statusStats = subscriptions.reduce((acc, sub) => {
    const status = sub.status;
    if (!acc[status]) {
      acc[status] = { count: 0, total: 0 };
    }
    acc[status].count += 1;
    acc[status].total += parseFloat(sub.amount || 0);
    return acc;
  }, {});

  const contractTypeLabels = {
    monthly: '月額',
    yearly: '年額',
    free_trial: '無料トライアル',
    one_time: '一回払い',
    other: 'その他'
  };

  const statusLabels = {
    active: 'アクティブ',
    expired: '期限切れ',
    cancelled: '解約済み',
    paused: '一時停止',
    pending_renewal: '更新待ち'
  };

  const statusColors = {
    active: 'success',
    expired: 'error',
    cancelled: 'default',
    paused: 'warning',
    pending_renewal: 'info'
  };

  return (
    <Grid container spacing={3}>
      {/* 契約タイプ別 */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SubscriptionsIcon sx={{ mr: 1, color: 'primary.main' }} />
            契約タイプ別
          </Typography>

          <Box sx={{ mt: 2 }}>
            {Object.entries(contractTypeStats).map(([type, stats]) => (
              <Box key={type} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {contractTypeLabels[type] || type}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${stats.count}件`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ¥{stats.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.count / subscriptions.length) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* ステータス別 */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
            ステータス別
          </Typography>

          <Box sx={{ mt: 2 }}>
            {Object.entries(statusStats).map(([status, stats]) => (
              <Box key={status} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {statusLabels[status] || status}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={`${stats.count}件`}
                      size="small"
                      variant="outlined"
                      color={statusColors[status] || 'default'}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ¥{stats.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(stats.count / subscriptions.length) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: `${statusColors[status] || 'primary'}.main`
                    }
                  }}
                />
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

/**
 * リマインド統計・分析コンポーネント
 */
const RemindAnalytics = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 月別支払い合計を取得
  const {
    data: monthlyData,
    isLoading: isLoadingMonthly,
    error: monthlyError
  } = useQuery(
    ['monthly-totals', selectedYear],
    () => api.fetchMonthlyTotals(selectedYear),
    {
      keepPreviousData: true
    }
  );

  // サブスクリプション一覧を取得（統計用）
  const {
    data: subscriptionsData,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError
  } = useQuery(
    ['subscriptions-stats'],
    () => api.fetchSubscriptionsForStats(),
    {
      staleTime: 5 * 60 * 1000 // 5分間キャッシュ
    }
  );

  const monthly = monthlyData?.data?.monthly_totals || [];
  const yearlyTotal = monthlyData?.data?.yearly_total || 0;
  const subscriptions = subscriptionsData?.data?.data || [];

  // 統計データの計算
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const totalActiveAmount = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0);
  const averageAmount = totalActiveAmount / (activeSubscriptions || 1);

  // 今月の支払い合計
  const currentMonth = new Date().getMonth();
  const currentMonthTotal = monthly[currentMonth]?.total || 0;

  // 利用可能な年のリスト
  const availableYears = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <Box>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
          統計・分析
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>年</InputLabel>
          <Select
            value={selectedYear}
            label="年"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}年
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* エラー表示 */}
      {(monthlyError || subscriptionsError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          データの取得に失敗しました
        </Alert>
      )}

      {/* 統計カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {isLoadingSubscriptions ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="総サブスクリプション"
              value={totalSubscriptions}
              subtitle="登録済みサービス数"
              icon={<SubscriptionsIcon />}
              color="primary"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoadingSubscriptions ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="アクティブ"
              value={activeSubscriptions}
              subtitle="現在利用中のサービス"
              icon={<AnalyticsIcon />}
              color="success"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoadingMonthly ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="今月の支払い"
              value={`¥${currentMonthTotal.toLocaleString()}`}
              subtitle={`${selectedYear}年${currentMonth + 1}月`}
              icon={<MoneyIcon />}
              color="warning"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {isLoadingMonthly ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="年間合計"
              value={`¥${yearlyTotal.toLocaleString()}`}
              subtitle={`${selectedYear}年`}
              icon={<TrendingUpIcon />}
              color="info"
            />
          )}
        </Grid>
      </Grid>

      {/* 詳細分析 */}
      <Grid container spacing={3}>
        {/* 月別チャート */}
        <Grid item xs={12} lg={7}>
          {isLoadingMonthly ? (
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          ) : (
            <MonthlyChart data={monthly} year={selectedYear} />
          )}
        </Grid>

        {/* 平均値カード */}
        <Grid item xs={12} lg={5}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12}>
              {isLoadingSubscriptions ? (
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
              ) : (
                <StatCard
                  title="平均月額"
                  value={`¥${Math.round(averageAmount).toLocaleString()}`}
                  subtitle="アクティブサービスの平均"
                  icon={<MoneyIcon />}
                  color="secondary"
                />
              )}
            </Grid>
            <Grid item xs={12}>
              {isLoadingSubscriptions ? (
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
              ) : (
                <StatCard
                  title="月額合計"
                  value={`¥${Math.round(totalActiveAmount).toLocaleString()}`}
                  subtitle="全アクティブサービス"
                  icon={<TrendingUpIcon />}
                  color="error"
                />
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* サブスクリプション分析 */}
        <Grid item xs={12}>
          {isLoadingSubscriptions ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Skeleton variant="rectangular" height={300} sx={{ flex: 1, borderRadius: 2 }} />
              <Skeleton variant="rectangular" height={300} sx={{ flex: 1, borderRadius: 2 }} />
            </Box>
          ) : (
            <SubscriptionAnalysis subscriptions={subscriptions} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RemindAnalytics; 