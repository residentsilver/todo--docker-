import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    Box,
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Link as MuiLink,
    InputAdornment,
    IconButton,
    Fade,
    Grow
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

/**
 * スタイル付きコンポーネント
 */
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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

/**
 * ユーザー登録ページコンポーネント
 * 
 * @description Material-UIを使用した美しい登録ページ
 *              LoginPageと統一感のあるデザイン
 */
const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

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
    };

    /**
     * パスワード表示切り替え
     */
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    /**
     * パスワード確認表示切り替え
     */
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

        // パスワード確認チェック
        if (formData.password !== formData.password_confirmation) {
            setErrors({
                password_confirmation: 'パスワードが一致しません'
            });
            setLoading(false);
            return;
        }

        try {
            await register(formData);
            navigate('/'); // 登録成功後はホームページにリダイレクト
        } catch (error) {
            console.error('登録エラー:', error);
            setErrors({
                general: error.message || 'ユーザー登録に失敗しました'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledContainer maxWidth={false}>
            <Grow in={true} timeout={800}>
                <Box sx={{ width: '100%', maxWidth: 450 }}>
                    <StyledPaper elevation={0}>
                        <Fade in={true} timeout={1000}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <PersonAddIcon 
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
                                    新規登録
                                </Typography>
                                <Typography 
                                    variant="body1" 
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    新しいアカウントを作成してください
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    既にアカウントをお持ちの方は{' '}
                                    <MuiLink 
                                        component={Link} 
                                        to="/login"
                                        sx={{ 
                                            color: 'primary.main',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            '&:hover': {
                                                textDecoration: 'underline',
                                            }
                                        }}
                                    >
                                        ログイン
                                    </MuiLink>
                                </Typography>
                            </Box>
                        </Fade>

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                            <Box sx={{ mb: 3 }}>
                                <StyledTextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="ユーザー名"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
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
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                <StyledTextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label="パスワード（8文字以上）"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
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
                                    label="パスワード確認"
                                    type={showPasswordConfirmation ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
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

                            <StyledButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                            >
                                {loading ? '登録中...' : 'アカウントを作成'}
                            </StyledButton>
                        </Box>
                    </StyledPaper>
                </Box>
            </Grow>
        </StyledContainer>
    );
};

export default RegisterPage;

 