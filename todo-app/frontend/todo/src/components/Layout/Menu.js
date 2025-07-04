import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import HomeIcon from '@mui/icons-material/Home';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';
import SearchResults from '../Search/SearchResults';

/**
 * 検索コンポーネントのスタイル定義
 */
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: theme.spacing(4), // クリアボタンのスペース
    transition: theme.transitions.create('width'),
    [theme.breakpoints.up('sm')]: {
      width: '12ch',
      '&:focus': {
        width: '20ch',
      },
    },
  },
}));

const ClearButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(0.5),
  top: '50%',
  transform: 'translateY(-50%)',
  padding: theme.spacing(0.5),
  color: 'inherit',
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.1),
  },
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  margin: theme.spacing(1),
  color: 'white',
  borderColor: 'rgba(255, 255, 255, 0.3)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
}));

/**
 * ナビゲーションメニューアイテムの定義
 */
const menuItems = [
  {
    text: 'ホーム',
    path: '/',
    icon: <HomeIcon />,
    description: 'メインページ'
  },
  {
    text: 'Todo管理',
    path: '/youtube',
    icon: <PlayCircleOutlineIcon />,
    description: 'Todo管理画面'
  },
  {
    text: 'AI Todo',
    path: '/aiTodo',
    icon: <SmartToyIcon />,
    description: 'AI搭載Todo機能'
  },
  {
    text: '削除済みTodo',
    path: '/todo-deleted',
    icon: <DeleteIcon />,
    description: '削除されたTodoアイテム'
  }
];

/**
 * ハンバーガーメニュー付きのヘッダーコンポーネント
 * 
 * @description Material-UIを使用したレスポンシブなヘッダーとサイドバーナビゲーション
 *              ハンバーガーメニューから各ページへの遷移が可能
 *              リアルタイム検索機能を搭載
 *              認証機能とログアウト機能を統合
 */
export default function SearchAppBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 検索機能の状態管理
  const { 
    searchQuery, 
    setSearchQuery, 
    clearSearch, 
    searchMode 
  } = useSearch();

  // 認証機能の状態管理
  const { user, logout } = useAuth();

  /**
   * ドロワーの開閉を切り替える関数
   */
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  /**
   * ナビゲーション実行関数
   * 
   * @param {string} path - 遷移先のパス
   */
  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false); // ナビゲーション後にドロワーを閉じる
  };

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    try {
      await logout();
      setDrawerOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  /**
   * 現在のパスがアクティブかどうかを判定
   * 
   * @param {string} path - チェックするパス
   * @returns {boolean} アクティブな場合true
   */
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  /**
   * 検索入力変更時の処理
   * 
   * @param {Event} event - 入力イベント
   */
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  /**
   * 検索クリア処理
   */
  const handleClearSearch = () => {
    clearSearch();
  };

  /**
   * 検索入力のキーダウン処理
   * 
   * @param {Event} event - キーボードイベント
   */
  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      clearSearch();
    }
  };

  /**
   * ユーザー名の最初の文字を取得（アバター用）
   */
  const getUserInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  };

  /**
   * ドロワーの内容を描画
   */
  const DrawerContent = () => (
    <Box
      sx={{ 
        width: 280,
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column'
      }}
      role="presentation"
    >
      {/* ドロワーヘッダー */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Todo App
        </Typography>
        <IconButton 
          onClick={toggleDrawer(false)}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* ユーザー情報セクション */}
      {user && (
        <Box sx={{ 
          padding: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 1
          }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: 40,
              height: 40
            }}>
              {getUserInitial()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.75rem'
              }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
          
          {/* プロフィール編集ボタン */}
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => handleNavigation('/profile')}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.75rem',
              py: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            プロフィール編集
          </Button>
        </Box>
      )}

      {/* メニューリスト */}
      <List sx={{ paddingTop: 2, flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                margin: '4px 8px',
                borderRadius: '8px',
                backgroundColor: isActivePath(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemIcon sx={{ 
                color: 'white',
                minWidth: 40
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                secondary={item.description}
                secondaryTypographyProps={{
                  sx: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* ログアウトボタン */}
      <Box sx={{ padding: 2 }}>
        <LogoutButton
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          ログアウト
        </LogoutButton>
      </Box>

      {/* フッター情報 */}
      <Box sx={{ 
        padding: 2, 
        textAlign: 'center'
      }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Todo Management System
        </Typography>
        <Typography variant="caption" sx={{ 
          display: 'block', 
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.7rem'
        }}>
          Version 1.3
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer(true)}
            sx={{ 
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              flexGrow: 1, 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 600
            }}
          >
            Todo App
          </Typography>

          {/* ユーザー情報（ヘッダー右側） */}
          {user && (
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1,
              mr: 2
            }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                width: 32,
                height: 32
              }}>
                {getUserInitial()}
              </Avatar>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {user.name}
              </Typography>
            </Box>
          )}
          
          {/* 検索バー */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Todoを検索..."
              inputProps={{ 'aria-label': 'search todos' }}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <ClearButton
                size="small"
                onClick={handleClearSearch}
                aria-label="clear search"
              >
                <ClearIcon fontSize="small" />
              </ClearButton>
            )}
            
            {/* 検索結果の表示 */}
            <SearchResults />
          </Search>
        </Toolbar>
      </AppBar>

      {/* サイドバードロワー */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        <DrawerContent />
      </Drawer>
    </Box>
  );
}
