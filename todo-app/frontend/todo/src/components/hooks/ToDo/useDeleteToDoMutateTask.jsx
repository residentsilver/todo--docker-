import { useMutation, useQueryClient } from "react-query";
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのToDoアイテムを削除するためのカスタムフック
 * 
 * @description AuthContextを使用して認証付きでToDoアイテムを削除
 * @returns {Object} - ミューテーションオブジェクト
 */
const useDeleteToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    const deleteToDoMutation = useMutation(
        /**
         * 認証付きでToDoアイテムを削除する関数
         * 
         * @param {Object} toDo - 削除対象のToDoアイテム
         * @returns {Promise} - APIレスポンス
         */
        async (toDo) => {
            const data = await authenticatedRequest(`/todos/${toDo.id}`, {
                method: 'DELETE',
            });
            return data;
        },
        {
            onSuccess: () => {
                // 削除成功時にToDoリストを再取得
                queryClient.invalidateQueries("toDoList");
            },
            onError: (error) => {
                console.error('ToDoの削除に失敗しました:', error);
            },
            onSettled: () => {
                queryClient.invalidateQueries("toDoList");
            }
        }
    );
    return { deleteToDoMutation };
};

export default useDeleteToDoMutateTask;