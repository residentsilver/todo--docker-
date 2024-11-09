import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

/**
 * ToDo詳細の順序更新用カスタムフック
 * @returns {Object} updateToDoDetailOrderMutation - 順序更新用のミューテーション
 */
const useUpdateToDoDetailOrderMutateTask = () => {
    const queryClient = useQueryClient();
    const updateToDoDetailOrderMutation = useMutation(
        ({ todoId, order }) => axios.put(`/api/todoDetails/${todoId}/order`, { order }),
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