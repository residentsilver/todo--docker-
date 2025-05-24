import { useMutation, useQueryClient } from "react-query";
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのToDo詳細の順序更新用カスタムフック
 * 
 * @description AuthContextを使用して認証付きでToDo詳細の順序を更新
 * @returns {Object} updateToDoDetailOrderMutation - 順序更新用のミューテーション
 */
const useUpdateToDoDetailOrderMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    const updateToDoDetailOrderMutation = useMutation(
        /**
         * 認証付きでToDo詳細の順序を更新する関数
         * 
         * @param {Object} params - パラメータオブジェクト
         * @param {number} params.todoId - TodoのID
         * @param {Array} params.order - 新しい順序の配列
         * @returns {Promise} - APIレスポンス
         */
        async ({ todoId, order }) => {
            const data = await authenticatedRequest(`/todoDetails/${todoId}/order`, {
                method: 'PUT',
                body: JSON.stringify({ order }),
            });
            return data;
        },
        {
            onMutate: async ({ todoId, order }) => {
                // キャッシュの更新を防ぐため、進行中のクエリをキャンセル
                await queryClient.cancelQueries(["toDoDetails", todoId]);
                
                // 現在のToDoDetailsの状態を保存
                const previousToDoDetails = queryClient.getQueryData(["toDoDetails", todoId]);
                
                // 楽観的な更新を実行
                queryClient.setQueryData(["toDoDetails", todoId], (oldData) => {
                    if (!oldData) return oldData;
                    
                    // 新しい順序でデータを並び替え
                    const newData = [...oldData];
                    const orderedData = order.map(id => 
                        newData.find(item => item.id === id)
                    ).filter(Boolean);
                    
                    return orderedData;
                });
                
                // ロールバック用に以前の状態を返す
                return { previousToDoDetails };
            },
            onError: (err, variables, context) => {
                console.error('ToDo詳細の順序更新に失敗しました:', err);
                
                // エラー時に以前の状態に戻す
                if (context?.previousToDoDetails) {
                    queryClient.setQueryData(
                        ["toDoDetails", variables.todoId],
                        context.previousToDoDetails
                    );
                }
            },
            onSettled: (data, error, variables) => {
                // ミューテーション完了後にデータを再取得
                queryClient.invalidateQueries(["toDoDetails", variables.todoId]);
            }
        }
    );
    
    return { updateToDoDetailOrderMutation };
};

export default useUpdateToDoDetailOrderMutateTask;