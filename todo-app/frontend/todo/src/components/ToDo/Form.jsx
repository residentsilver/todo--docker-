import {
    Card,
    CardContent,
    List,
    TextField,
    CardActions,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/AddCircle';
import React, { useEffect, useState } from 'react';
import {
    useUpdateToDoMutateTask,
    useDeleteToDoMutateTask,
    
} from '../hooks/ToDo';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableToDoDetails from './SortableToDoDetails';
import { useStoreToDoDetailMutateTask ,useUpdateToDoDetailOrderMutateTask} from '../hooks/ToDoDetail';


/**
 * Todoフォームコンポーネント
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Object} props.toDo - Todoアイテムのデータ
 * @returns {JSX.Element} Todoフォーム
 */
const Form = (props) => {
    const [timer, setTimer] = useState(null);
    const [details, setDetails] = useState(props.toDo.todo_details);
    const { updateToDoMutation } = useUpdateToDoMutateTask();
    const { updateToDoDetailOrderMutation } = useUpdateToDoDetailOrderMutateTask();

    const ToDo = {
        id: props.toDo.id,
        title: props.toDo.title,
    };

    const toDo = {
        id: props.toDo.id,
    };

    // 名称更新イベント
    const eventUpdateToDo = (event) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            const data = {
                ...ToDo,
                title: event.target.value,
            }
            updateToDoMutation.mutate(data);
        }, 500);

        setTimer(newTimer);
    };

    // 削除イベント
    const { deleteToDoMutation } = useDeleteToDoMutateTask();
    const eventDeleteToDo = (event) => {
        deleteToDoMutation.mutate(ToDo);
    }

    // 追加イベント
    const { storeToDoDetailMutation } = useStoreToDoDetailMutateTask();
    const eventStoreToDoDetail = (event) => {
        storeToDoDetailMutation.mutate(toDo);
    };

    // Drag and Dropセンサーの設定
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    /**
     * タスクの順序変更ハンドラー
     * @param {Object} event - ドラッグイベント
     */
    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = details.findIndex(detail => detail.id === active.id);
            const newIndex = details.findIndex(detail => detail.id === over.id);

            const newDetails = arrayMove(details, oldIndex, newIndex);
            setDetails(newDetails);

            // 新しい順序をバックエンドに保存
            const order = newDetails.map(detail => detail.id);
            updateToDoDetailOrderMutation.mutate({ todoId: toDo.id, order });
        }
    };

    // タイトルテキストフィールドのキーダウンイベント
    const eventKeyDownTitle = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            // detailsが存在し、少なくとも1つ要素がある場合
            if (details && details.length > 0) {
                // 最初のdetailのテキストフィールドにフォーカスを移動
                const firstDetailElement = document.querySelector(
                    `input[data-detail-id="${details[0].id}"]`
                );
                if (firstDetailElement) {
                    firstDetailElement.focus();
                }
            }
        }
    };

    useEffect(() => {
        setDetails(props.toDo.todo_details);
    }, [props.toDo.todo_details]);
    
    return (
        <>
            <Card>
                <TextField
                    variant="standard"
                    margin="dense"
                    defaultValue={props.toDo.title}
                    fullWidth
                    onChange={eventUpdateToDo}
                    onKeyDown={eventKeyDownTitle}
                />
                {/* props （引数＝DBから得た情報　todosテーブルのtitleカラム） */}
                <CardContent>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={details.map(detail => detail.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <List>
                                {details.map((detail) => (
                                    <SortableToDoDetails
                                        key={detail.id}
                                        id={detail.id}
                                        description={detail.description}
                                        completed={detail.completed}
                                        to_do_id={detail.to_do_id}
                                        setDetails={setDetails}
                                        details={details}
                                        onAddNewDetail={eventStoreToDoDetail}
                                    />
                                ))}
                            </List>
                        </SortableContext>
                    </DndContext>
                </CardContent>
                <CardActions>
                    <IconButton
                        edge="start"
                        aria-label="add"
                        color="primary"
                        onClick={eventStoreToDoDetail}>
                        <AddIcon />
                    </IconButton>
                    <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={eventDeleteToDo}>
                        <DeleteIcon />
                    </IconButton>
                </CardActions>
            </Card>
        </>
    );
}

export default Form;