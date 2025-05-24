import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Fade,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Subscriptions as SubscriptionsIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import SubscriptionList from './SubscriptionList';
import SubscriptionForm from './SubscriptionForm';
import RemindHistory from './RemindHistory';
import RemindAnalytics from './RemindAnalytics';
import RemindSettings from './RemindSettings';

/**
 * タブパネルコンポーネント
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`remind-tabpanel-${index}`}
      aria-labelledby={`remind-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={true} timeout={300}>
          <Box sx={{ py: 3 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

/**
 * リマインド機能のメインページコンポーネント
 * 
 * @description サブスクリプション管理、リマインド設定、統計表示などの機能を提供
 *              タブ形式でコンテンツを切り替え、レスポンシブデザインに対応
 */
const RemindPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * タブ変更時の処理
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // フォームを閉じる
    setIsFormOpen(false);
    setSelectedSubscription(null);
  };

  /**
   * サブスクリプション編集
   */
  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsFormOpen(true);
  };

  /**
   * サブスクリプション新規作成
   */
  const handleCreateSubscription = () => {
    setSelectedSubscription(null);
    setIsFormOpen(true);
  };

  /**
   * フォームを閉じる
   */
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSubscription(null);
  };

  // タブ定義
  const tabs = [
    {
      label: 'サブスクリプション',
      icon: <SubscriptionsIcon />,
      component: (
        <SubscriptionList
          onEdit={handleEditSubscription}
          onCreate={handleCreateSubscription}
        />
      )
    },
    {
      label: '履歴',
      icon: <HistoryIcon />,
      component: <RemindHistory />
    },
    {
      label: '統計',
      icon: <AnalyticsIcon />,
      component: <RemindAnalytics />
    },
    {
      label: '設定',
      icon: <SettingsIcon />,
      component: <RemindSettings />
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* ページヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 0 }}>
            <NotificationsIcon 
              sx={{ 
                fontSize: 32, 
                color: 'primary.main', 
                mr: 1 
              }} 
            />
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              リマインド管理
            </Typography>
          </Box>
          <Box sx={{ ml: isMobile ? 0 : 'auto', display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip 
              label="サブスク管理" 
              variant="outlined" 
              size="small"
              color="primary"
            />
            <Chip 
              label="自動通知" 
              variant="outlined" 
              size="small"
              color="secondary"
            />
            <Chip 
              label="LINE連携" 
              variant="outlined" 
              size="small"
              color="success"
            />
          </Box>
        </Box>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ maxWidth: 600 }}
        >
          サブスクリプションサービスの終了期日を管理し、LINEで事前にリマインド通知を受け取ることができます。
          更新漏れや不要な契約の継続を防ぎ、支出の最適化をサポートします。
        </Typography>
      </Box>

      {/* メインコンテンツ */}
      <Paper 
        elevation={2}
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
        }}
      >
        {/* タブナビゲーション */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          background: 'rgba(102, 126, 234, 0.03)'
        }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="リマインド機能タブ"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: 'primary.main',
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 1.5,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* タブコンテンツ */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>

      {/* サブスクリプション作成・編集フォーム */}
      <SubscriptionForm
        open={isFormOpen}
        subscription={selectedSubscription}
        onClose={handleCloseForm}
        onSuccess={() => {
          handleCloseForm();
          // リストを更新
        }}
      />
    </Container>
  );
};

export default RemindPage; 