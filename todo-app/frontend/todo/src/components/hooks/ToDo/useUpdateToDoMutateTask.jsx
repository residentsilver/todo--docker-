import { useMutation, useQueryClient } from "react-query";
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのToDoアイテムを更新するためのカスタムフック
 * 
 * @description AuthContextを使用して認証付きでToDoアイテムを更新
 * @returns {Object} - ミューテーションオブジェクト
 */
const useUpdateToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    const updateToDoMutation = useMutation(
        /**
         * 認証付きでToDoアイテムを更新する関数
         * 
         * @param {Object} toDo - 更新対象のToDoアイテム
         * @returns {Promise} - APIレスポンス
         */
        async (toDo) => {
            const data = await authenticatedRequest(`/todos/${toDo.id}`, {
                method: 'PUT',
                body: JSON.stringify({ title: toDo.title }),
            });
            return data;
        },
        {
            onMutate: async (toDo) => {
                await queryClient.cancelQueries("toDoList");
                const previousToDoList = queryClient.getQueriesData("toDoList");
                queryClient.setQueryData("toDoList", (oldToDoList) =>
                    oldToDoList.map((oldToDo) => {
                        if (oldToDo.id == toDo.id) {
                            return {
                                ...oldToDo,
                                title: toDo.title,
                            };
                        }
                        return oldToDo;
                    })
                );
                // 以前のToDoリストを返す	
                return { previousToDoList };
            },
            onSuccess: () => {
                // 更新成功時にToDoリストを再取得
                queryClient.invalidateQueries("toDoList");
            },
            onError: (error, toDo, context) => {
                console.error('ToDoの更新に失敗しました:', error);
                // エラー時に以前の状態に戻す
                if (context?.previousToDoList) {
                    queryClient.setQueryData("toDoList", context.previousToDoList);
                }
            },
            // ミューテーションが成功またはエラーになった後にクエリを再フェッチ	
            onSettled: () => {
                queryClient.invalidateQueries("toDoList");
            }
        }
    );
    return { updateToDoMutation };
};

export default useUpdateToDoMutateTask;