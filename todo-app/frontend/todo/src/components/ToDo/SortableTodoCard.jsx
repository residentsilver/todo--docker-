import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Form from './Form';

/**
 * ドラッグ可能なTodoカードコンポーネント
 * 
 * @description dnd-kitを使用してTodoカードにドラッグアンドドロップ機能を追加
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.toDo - Todoアイテムのデータ
 * @param {boolean} props.isSearchMode - 検索モードかどうか
 * @returns {JSX.Element} ドラッグ可能なTodoカード
 */
const SortableTodoCard = ({ toDo, isSearchMode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: toDo.id,
        disabled: isSearchMode // 検索モードではドラッグを無効化
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                position: 'relative',
                '&:hover .drag-handle': {
                    opacity: isSearchMode ? 0 : 1,
                },
            }}
        >
            {/* ドラッグハンドル */}
            {!isSearchMode && (
                <Tooltip title="ドラッグしてTodoの順序を変更" placement="left">
                    <IconButton
                        {...attributes}
                        {...listeners}
                        className="drag-handle"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: -16,
                            zIndex: 10,
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            width: 32,
                            height: 32,
                            cursor: 'grab',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            },
                            '&:active': {
                                cursor: 'grabbing',
                            },
                        }}
                        size="small"
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {/* 検索モードの場合のドラッグ無効化表示 */}
            {isSearchMode && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: -16,
                        zIndex: 10,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'action.disabledBackground',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                    }}
                >
                    <DragIndicatorIcon 
                        fontSize="small" 
                        sx={{ color: 'action.disabled' }}
                    />
                </Box>
            )}

            {/* Todoフォーム */}
            <Form toDo={toDo} />
        </Box>
    );
};

export default SortableTodoCard; 