import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Paper,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSearch } from '../../contexts/SearchContext';
import { useNavigate } from 'react-router-dom';
import './SearchResults.css';

/**
 * 検索結果表示コンポーネント
 * 
 * @description 検索結果のTodoアイテムを表示し、
 *              検索クエリのハイライト機能を提供
 * @author システム開発者
 * @version 1.0
 */
const SearchResults = () => {
    const {
        searchQuery,
        searchResults,
        isSearching,
        searchMode,
        totalResults,
        hasResults,
        highlightSearchTerm,
        clearSearch
    } = useSearch();
    
    const navigate = useNavigate();

    /**
     * Todoアイテムクリック時の処理
     * 
     * @param {Object} todo - クリックされたTodoアイテム
     */
    const handleTodoClick = (todo) => {
        // Todo管理画面に遷移（必要に応じてTodoIDを含める）
        navigate('/youtube', { state: { selectedTodo: todo } });
        clearSearch();
    };

    /**
     * 検索結果のハイライト表示
     * 
     * @param {string} text - 表示するテキスト
     * @returns {JSX.Element} ハイライト処理されたテキスト
     */
    const renderHighlightedText = (text) => {
        if (!searchQuery || !text) return text;
        
        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return (
            <span>
                {parts.map((part, index) => 
                    part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark key={index} style={{ 
                            backgroundColor: '#ffeb3b', 
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontWeight: 'bold'
                        }}>
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    /**
     * Todo詳細の完了状況を取得
     * 
     * @param {Array} todoDetails - Todo詳細リスト
     * @returns {Object} 完了状況の統計
     */
    const getCompletionStats = (todoDetails) => {
        if (!todoDetails || todoDetails.length === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        
        const completed = todoDetails.filter(detail => detail.completed).length;
        const total = todoDetails.length;
        const percentage = Math.round((completed / total) * 100);
        
        return { completed, total, percentage };
    };

    // 検索モードでない場合は何も表示しない
    if (!searchMode) {
        return null;
    }

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                maxHeight: '400px',
                overflow: 'auto',
                mt: 1,
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}
        >
            {/* 検索ヘッダー */}
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon color="primary" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        検索結果
                    </Typography>
                    {isSearching && <CircularProgress size={16} />}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    「{searchQuery}」の検索結果: {totalResults}件
                </Typography>
            </Box>

            <Divider />

            {/* 検索中の表示 */}
            {isSearching && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        検索中...
                    </Typography>
                </Box>
            )}

            {/* 検索結果なしの表示 */}
            {!isSearching && !hasResults && (
                <Box sx={{ p: 3 }}>
                    <Alert severity="info" variant="outlined">
                        「{searchQuery}」に一致するTodoアイテムが見つかりませんでした。
                    </Alert>
                </Box>
            )}

            {/* 検索結果の表示 */}
            {!isSearching && hasResults && (
                <List sx={{ p: 0 }}>
                    {searchResults.map((todo, index) => {
                        const stats = getCompletionStats(todo.todo_details);
                        
                        return (
                            <React.Fragment key={todo.id}>
                                <ListItem
                                    button
                                    onClick={() => handleTodoClick(todo)}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: '#f0f7ff',
                                        },
                                        py: 2
                                    }}
                                >
                                    <ListItemIcon>
                                        <AssignmentIcon color="primary" />
                                    </ListItemIcon>
                                    
                                    <ListItemText
                                        primary={
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {renderHighlightedText(todo.title)}
                                                </Typography>
                                                
                                                {/* 完了状況の表示 */}
                                                {stats.total > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            label={`${stats.completed}/${stats.total} 完了`}
                                                            color={stats.percentage === 100 ? 'success' : 'default'}
                                                            variant="outlined"
                                                        />
                                                        <Typography variant="caption" color="text.secondary">
                                                            ({stats.percentage}%)
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            todo.todo_details && todo.todo_details.length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        詳細項目:
                                                    </Typography>
                                                    {todo.todo_details
                                                        .filter(detail => 
                                                            detail.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                                        )
                                                        .slice(0, 2) // 最大2件まで表示
                                                        .map((detail, detailIndex) => (
                                                            <Box key={detail.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                                {detail.completed ? (
                                                                    <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                                ) : (
                                                                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                )}
                                                                <Typography variant="caption">
                                                                    {renderHighlightedText(detail.description)}
                                                                </Typography>
                                                            </Box>
                                                        ))
                                                    }
                                                    {todo.todo_details.filter(detail => 
                                                        detail.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    ).length > 2 && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            ...他 {todo.todo_details.filter(detail => 
                                                                detail.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                                            ).length - 2} 件
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )
                                        }
                                    />
                                </ListItem>
                                
                                {index < searchResults.length - 1 && <Divider />}
                            </React.Fragment>
                        );
                    })}
                </List>
            )}
        </Paper>
    );
};

export default SearchResults; 