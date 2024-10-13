import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

/**
 * ToDo詳細を追加するためのカスタムフック
 * 
 * @returns {Object} - ミューテーションオブジェクト
 */
const useStoreToDoDetailMutateTask = () => {
    const queryClient = useQueryClient();

    const storeToDoDetailMutation = useMutation(
        /**
         * ToDo詳細を追加する関数
         * 
         * @param {Object} toDoDetail - 追加するToDo詳細アイテム
         * @returns {Promise} - AxiosのPOSTリクエストのレスポンス
         */
        (toDo) => axios.post(`/api/tododetails`,{
            todo_id: toDo.id,
        }),
            
        {
            /**
             * 楽観的更新を行う前に呼ばれる関数
             * 
             * @param {Object} toDoDetail - 追加するToDo詳細アイテム
             * @returns {Object} - 以前のToDoリストのデータ
             */
            onMutate: async (toDoDetail) => {
                await queryClient.cancelQueries("toDoList");
                const previousToDoList = queryClient.getQueryData("toDoList");

                // 新しいToDoDetailをローカルキャッシュに追加
                queryClient.setQueryData("toDoList", (oldToDoList) => {
                    return oldToDoList.map((todo) => {
                        if (todo.id == toDoDetail.to_do_id) {
                            return {
                                ...todo,
                                to_do_details: [...todo.to_do_details, toDoDetail],
                            };
                        }
                        return todo;
                    });
                });

                return { previousToDoList };
            },
            /**
             * ミューテーションが成功した後に呼び出される関数
             */
            onSuccess: () => {
                queryClient.invalidateQueries("toDoList");
            },
            /**
             * ミューテーションがエラーになった場合に呼び出される関数
             */
            onError: (error, toDoDetail, context) => {
                if (context?.previousToDoList) {
                    queryClient.setQueryData("toDoList", context.previousToDoList);
                }
                console.error(`ToDo詳細の追加に失敗しました: ${error.message}`);
                // 必要に応じてユーザーに通知を送信
            },
            /**
             * ミューテーションが完了した後に呼び出される関数
             */
            onSettled: () => {
                queryClient.invalidateQueries("toDoList");
            }
        }
    );

    return { storeToDoDetailMutation };
};

export default useStoreToDoDetailMutateTask;