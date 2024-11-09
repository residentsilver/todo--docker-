import React from 'react';
import ToDoDetails from './ToDoDetails';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { IconButton } from '@mui/material';

/**
 * SortableToDoDetailsコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @returns {JSX.Element} SortableToDoDetails
 */
const SortableToDoDetails = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {/* ドラッグハンドルアイコン */}
            <IconButton
                {...attributes}
                {...listeners}
                aria-label="ドラッグハンドル"
                size="small"
                style={{ cursor: 'grab', marginRight: '8px' }}
            >
                <DragIndicatorIcon />
            </IconButton>
            {/* ToDoDetailsコンポーネント */}
            <ToDoDetails
                id={props.id}
                description={props.description}
                completed={props.completed}
                to_do_id={props.to_do_id}
                setDetails={props.setDetails}
                details={props.details}
            />
        </div>
    );
}

export default SortableToDoDetails;
