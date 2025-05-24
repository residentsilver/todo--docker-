import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Fade,
    Grow,
    Divider
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

/**
 * スタイル付きコンポーネント
 */
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    borderRadius: theme.spacing(2),
    border: '1px solid rgba(255, 255, 255, 0.2)',
}));

const StyledContainer = styled(Container)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.spacing(1),
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
        },
        '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 1)',
        },
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1.5, 4),
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
    '&:hover': {
        background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
        boxShadow: '0 6px 25px rgba(102, 126, 234, 0.4)',
        transform: 'translateY(-2px)',
    },
    '&:disabled': {
        background: 'linear-gradient(45deg, #cccccc 30%, #999999 90%)',
        boxShadow: 'none',
    },
    transition: 'all 0.3s ease',
}));

const BackButton = styled(Button)(({ theme }) => ({
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1, 2),
    fontSize: '0.9rem',
    fontWeight: 500,
    textTransform: 'none',
    color: 'white',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
}));

/**
 * プロフィール編集ページコンポーネント
 * 
 * @description Material-UIを使用した美しいプロフィール編集ページ
 *              名前、メールアドレス、パスワードの変更が可能
 */
const ProfilePage = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    /**
     * フォーム入力値の変更ハンドラー
     * 
     * @param {Event} e - 入力イベント
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // エラーをクリア
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        // 成功メッセージをクリア
        if (success) {
            setSuccess('');
        }
    };

    /**
     * パスワード表示切り替え
     */
    const handleToggleCurrentPasswordVisibility = () => {
        setShowCurrentPassword(!showCurrentPassword);
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleTogglePasswordConfirmationVisibility = () => {
        setShowPasswordConfirmation(!showPasswordConfirmation);
    };

    /**
     * フォーム送信ハンドラー
     * 
     * @param {Event} e - 送信イベント
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setSuccess('');

        // パスワード変更時の確認チェック
        if (formData.password && formData.password !== formData.password_confirmation) {
            setErrors({
                password_confirmation: 'パスワードが一致しません'
            });
            setLoading(false);
            return;
        }

        try {
            // 更新データを準備（空でない値のみ送信）
            const updateData = {
                current_password: formData.current_password
            };

            if (formData.name !== user.name) {
                updateData.name = formData.name;
            }

            if (formData.email !== user.email) {
                updateData.email = formData.email;
            }

            if (formData.password) {
                updateData.password = formData.password;
                updateData.password_confirmation = formData.password_confirmation;
            }

            const result = await updateProfile(updateData);
            setSuccess(result.message || 'プロフィールが正常に更新されました');
            
            // パスワード関連フィールドをクリア
            setFormData(prev => ({
                ...prev,
                current_password: '',
                password: '',
                password_confirmation: ''
            }));

        } catch (error) {
            // console.error('プロフィール更新エラー:', error);
            
            // バリデーションエラーの処理
            if (error.fieldErrors) {
                setErrors(error.fieldErrors);
                return;
            }
            
            // その他のエラーメッセージの処理
            const errorMessage = error.message || 'プロフィールの更新に失敗しました';
            
            // 特定のエラーパターンをチェック
            if (errorMessage.includes('現在のパスワードが正しくありません')) {
                setErrors({
                    current_password: '現在のパスワードが正しくありません'
                });
            } else if (errorMessage.includes('パスワードは8文字以上')) {
                setErrors({
                    password: 'パスワードは8文字以上で入力してください。'
                });
            } else if (errorMessage.includes('パスワード確認が一致しません')) {
                setErrors({
                    password_confirmation: 'パスワード確認が一致しません。'
                });
            } else if (errorMessage.includes('このメールアドレスは既に使用されています')) {
                setErrors({
                    email: 'このメールアドレスは既に使用されています。'
                });
            } else if (errorMessage.includes('HTTPメソッドが許可されていません')) {
                setErrors({
                    general: 'サーバーとの通信に問題があります。管理者にお問い合わせください。'
                });
            } else if (errorMessage.includes('APIエンドポイントが見つかりません')) {
                setErrors({
                    general: 'プロフィール更新機能が利用できません。管理者にお問い合わせください。'
                });
            } else {
                // 一般的なエラーメッセージ
                setErrors({
                    general: errorMessage
                });
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * 戻るボタンのハンドラー
     */
    const handleBack = () => {
        navigate('/');
    };

    /**
     * APIテスト機能
     */
    const testApiEndpoint = async () => {
        try {
            setDebugInfo('APIテスト開始...\n');
            
            // 1. /me エンドポイントのテスト
            const response = await fetch('http://127.0.0.1:8000/api/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            
            setDebugInfo(prev => prev + `GET /me: ${response.status} ${response.statusText}\n`);
            setDebugInfo(prev => prev + `Response URL: ${response.url}\n`);
            
            // 2. /profile エンドポイントのテスト（OPTIONS）
            const optionsResponse = await fetch('http://127.0.0.1:8000/api/profile', {
                method: 'OPTIONS',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });
            
            setDebugInfo(prev => prev + `OPTIONS /profile: ${optionsResponse.status} ${optionsResponse.statusText}\n`);
            setDebugInfo(prev => prev + `CORS Headers: ${optionsResponse.headers.get('Access-Control-Allow-Methods')}\n`);
            
        } catch (error) {
            setDebugInfo(prev => prev + `エラー: ${error.message}\n`);
        }
    };

    return (
        <StyledContainer maxWidth={false}>
            <Grow in={true} timeout={800}>
                <Box sx={{ width: '100%', maxWidth: 500 }}>
                    <Box sx={{ mb: 2 }}>
                        <BackButton
                            variant="outlined"
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBack}
                        >
                            戻る
                        </BackButton>
                    </Box>
                    
                    <StyledPaper elevation={0}>
                        <Fade in={true} timeout={1000}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <PersonIcon 
                                    sx={{ 
                                        fontSize: 48, 
                                        color: 'primary.main',
                                        mb: 2,
                                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }} 
                                />
                                <Typography 
                                    variant="h4" 
                                    component="h1" 
                                    gutterBottom
                                    sx={{ 
                                        fontWeight: 700,
                                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    プロフィール編集
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    アカウント情報を更新してください
                                </Typography>
                            </Box>
                        </Fade>

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                            {/* 基本情報セクション */}
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                基本情報
                            </Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <StyledTextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="ユーザー名"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <StyledTextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="メールアドレス"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* パスワード変更セクション */}
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                パスワード変更
                            </Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <StyledTextField
                                    fullWidth
                                    id="current_password"
                                    name="current_password"
                                    label="現在のパスワード"
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    required
                                    value={formData.current_password}
                                    onChange={handleChange}
                                    error={!!errors.current_password}
                                    helperText={errors.current_password}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle current password visibility"
                                                    onClick={handleToggleCurrentPasswordVisibility}
                                                    edge="end"
                                                >
                                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <StyledTextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label="新しいパスワード（変更する場合のみ）"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    error={!!errors.password}
                                    helperText={errors.password}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleTogglePasswordVisibility}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <StyledTextField
                                    fullWidth
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    label="新しいパスワード確認"
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    error={!!errors.password_confirmation}
                                    helperText={errors.password_confirmation}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password confirmation visibility"
                                                    onClick={handleTogglePasswordConfirmationVisibility}
                                                    edge="end"
                                                >
                                                    {showPasswordConfirmation ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            {/* エラーメッセージ */}
                            {errors.general && (
                                <Fade in={true}>
                                    <Alert 
                                        severity="error" 
                                        sx={{ 
                                            mb: 2,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {errors.general}
                                    </Alert>
                                </Fade>
                            )}

                            {/* 成功メッセージ */}
                            {success && (
                                <Fade in={true}>
                                    <Alert 
                                        severity="success" 
                                        sx={{ 
                                            mb: 2,
                                            borderRadius: 1,
                                        }}
                                    >
                                        {success}
                                    </Alert>
                                </Fade>
                            )}

                            <StyledButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            >
                                {loading ? '更新中...' : 'プロフィールを更新'}
                            </StyledButton>

                            {/* デバッグセクション */}
                            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                    デバッグ情報
                                </Typography>
                                
                                <Button
                                    variant="outlined"
                                    onClick={testApiEndpoint}
                                    sx={{ mb: 2 }}
                                >
                                    API接続テスト
                                </Button>
                                
                                {debugInfo && (
                                    <Box
                                        sx={{
                                            backgroundColor: '#f5f5f5',
                                            padding: 2,
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            whiteSpace: 'pre-wrap',
                                            maxHeight: 200,
                                            overflow: 'auto'
                                        }}
                                    >
                                        {debugInfo}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </StyledPaper>
                </Box>
            </Grow>
        </StyledContainer>
    );
};

export default ProfilePage; 