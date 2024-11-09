import { useMutation, useQueryClient } from 'react-query';
import api from '../services/api';

/**
 * 新しいタスクを保存するためのカスタムフック
 */
export const useStoreToDoDetailMutateTask = () => {
    const queryClient = useQueryClient();

    return useMutation(
        (toDo) => {
            return api.post(`/todos/${toDo.id}/details`, { description: '新しいタスク' });
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['todos', toDo.id]);
            },
        }
    );
};
