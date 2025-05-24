import { useMutation, useQueryClient } from "react-query";
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのToDo詳細を更新するためのカスタムフック
 * 
 * @description AuthContextを使用して認証付きでToDo詳細を更新
 * @returns {Object} - ミューテーションオブジェクト
 */
const useUpdateToDoDetailMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    const updateToDoDetailMutation = useMutation(
        /**
         * 認証付きでToDo詳細を更新する関数
         * 
         * @param {Object} toDoDetail - 更新するToDo詳細アイテム
         * @returns {Promise} - APIレスポンス
         */
        async (toDoDetail) => {
            const data = await authenticatedRequest(`/tododetails/${toDoDetail.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    description: toDoDetail.description,
                    completed: toDoDetail.completed,
                }),
            });
            return data;
        },
        {
            onMutate: async (toDoDetail) => {
                await queryClient.cancelQueries("toDoList");
                const previousToDoList = queryClient.getQueriesData("toDoList");
                queryClient.setQueryData("toDoList", (oldToDoList) =>
                    oldToDoList.map((oldToDo) => {
                        if (oldToDo.id == toDoDetail.to_do_id) {
                            let newToDoDeitals = [];
                            oldToDo.to_do_detail.map((oldToDoDetail) => {
                                if (oldToDoDetail.id == toDoDetail.id) {
                                    newToDoDeitals.push({
                                        ...oldToDoDetail,
                                        description: toDoDetail.description,
                                        completed: toDoDetail.completed
                                    });
                                } else {
                                    newToDoDeitals.push(oldToDoDetail);
                                }
                            });
                            oldToDo.to_do_details = newToDoDeitals;
                        }
                            return oldToDo;
                        })
                );
                // 以前のToDoリストを返す	
                return { previousToDoList };
            },
            // ミューテーションが成功またはエラーになった後にクエリを再フェッチ	
            onSettled: () => {
                queryClient.invalidateQueries("toDoList");
            },
            onError: (error) => {
                console.error('ToDo詳細の更新に失敗しました:', error);
            }
        }
    );

    return { updateToDoDetailMutation };
};

export default useUpdateToDoDetailMutateTask;