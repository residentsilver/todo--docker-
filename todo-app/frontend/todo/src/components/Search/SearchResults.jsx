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
 *              検索に一致するtodoDetailsのみを表示
 *              詳細な検索統計情報を表示
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
        searchStats,
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
     * 検索クエリに一致するTodo詳細を取得（searchMetaから取得）
     * 
     * @param {Object} todo - Todoオブジェクト（searchMeta付き）
     * @returns {Array} 検索クエリに一致する詳細項目のリスト
     */
    const getMatchingDetails = (todo) => {
        return todo.searchMeta?.matchingDetails || [];
    };

    /**
     * Todo詳細の完了状況を取得（検索に一致する項目のみ）
     * 
     * @param {Array} matchingDetails - 検索に一致するTodo詳細リスト
     * @returns {Object} 完了状況の統計
     */
    const getCompletionStats = (matchingDetails) => {
        if (!matchingDetails || matchingDetails.length === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        
        const completed = matchingDetails.filter(detail => detail.completed).length;
        const total = matchingDetails.length;
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
                    「{searchQuery}」の検索結果: {totalResults}件のTodo
                </Typography>
                
                {/* 詳細な検索統計 */}
                {searchStats && !isSearching && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {searchStats.titleMatches > 0 && (
                            <Chip
                                size="small"
                                label={`タイトル一致: ${searchStats.titleMatches}件`}
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                        )}
                        {searchStats.detailMatches > 0 && (
                            <Chip
                                size="small"
                                label={`詳細一致: ${searchStats.totalDetailMatches}項目`}
                                color="secondary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                        )}
                    </Box>
                )}
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
                        // searchMetaから情報を取得
                        const matchingDetails = getMatchingDetails(todo);
                        const stats = getCompletionStats(matchingDetails);
                        const titleMatches = todo.searchMeta?.titleMatch || false;
                        const hasDetailMatch = todo.searchMeta?.detailMatch || false;
                        
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
                                                
                                                {/* マッチタイプの表示 */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    {titleMatches && (
                                                        <Chip
                                                            size="small"
                                                            label="タイトル一致"
                                                            color="primary"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    )}
                                                    {hasDetailMatch && (
                                                        <Chip
                                                            size="small"
                                                            label={`詳細 ${matchingDetails.length}件一致`}
                                                            color="secondary"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.7rem', height: 20 }}
                                                        />
                                                    )}
                                                </Box>
                                                
                                                {/* 一致した詳細項目の完了状況表示 */}
                                                {hasDetailMatch && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                                        <Chip
                                                            size="small"
                                                            label={`一致項目: ${stats.completed}/${stats.total} 完了`}
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
                                            hasDetailMatch && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                        一致する詳細項目:
                                                    </Typography>
                                                    {matchingDetails
                                                        .slice(0, 3) // 最大3件まで表示
                                                        .map((detail, detailIndex) => (
                                                            <Box key={detail.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                                {detail.completed ? (
                                                                    <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                                ) : (
                                                                    <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                )}
                                                                <Typography variant="caption" sx={{ 
                                                                    color: detail.completed ? 'success.main' : 'text.primary',
                                                                    fontWeight: 500
                                                                }}>
                                                                    {renderHighlightedText(detail.description)}
                                                                </Typography>
                                                            </Box>
                                                        ))
                                                    }
                                                    {matchingDetails.length > 3 && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                                            ...他 {matchingDetails.length - 3} 件の一致項目
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