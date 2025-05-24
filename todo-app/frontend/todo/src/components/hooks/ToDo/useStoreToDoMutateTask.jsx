import { useMutation, useQueryClient } from "react-query";
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのToDoアイテムを保存するためのカスタムフック
 * 
 * @description AuthContextを使用して認証付きでToDoアイテムを保存
 * @returns {Object} - ミューテーションオブジェクト
 */
const useStoreToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    const storeToDoMutation = useMutation(
        /**
         * 認証付きでToDoアイテムを保存する関数
         * 
         * @param {Object} toDo - 保存対象のToDoアイテム
         * @returns {Promise} - APIレスポンス
         */
        async (toDo) => {
            const data = await authenticatedRequest('/todos', {
                method: 'POST',
                body: JSON.stringify(toDo),
            });
            return data;
        },
        {
            onSuccess: () => {
                // 成功時にToDoリストを再取得
                queryClient.invalidateQueries("toDoList");
            },
            onError: (error) => {
                console.error('ToDoの保存に失敗しました:', error);
            },
            onSettled: () => {
                // 成功・失敗に関わらずクエリを無効化
                queryClient.invalidateQueries("toDoList");
            }
        }
    );
    
    return { storeToDoMutation };
};

export default useStoreToDoMutateTask;