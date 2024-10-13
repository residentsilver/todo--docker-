import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

/**
 * ToDo詳細を削除するためのカスタムフック
 * 
 * @returns {Object} - ミューテーションオブジェクト
 */
const useDeleteToDoDetailMutateTask = () => {
    const queryClient = useQueryClient();

    const deleteToDoDetailMutation = useMutation(
        /**
         * ToDo詳細を削除する関数
         * 
         * @param {Object} toDoDetail - 削除対象のToDo詳細アイテム
         * @returns {Promise} - AxiosのDELETEリクエストのレスポンス
         */
        (toDoDetail) => axios.delete(`/api/tododetails/${toDoDetail.id}`),
        {
            /**
             * ミューテーションが開始される前に呼び出される関数
             * 楽観的更新を行い、UIを即時に反映させる
             * 
             * @param {Object} toDoDetail - 削除対象のToDo詳細アイテム
             * @returns {Object} - 以前のToDoリストのデータ
             */
            onMutate: async (toDoDetail) => {
                await queryClient.cancelQueries("toDoList");
                const previousToDoList = queryClient.getQueryData("toDoList");

                queryClient.setQueryData("toDoList", (oldToDoList) =>
                    oldToDoList.map((oldToDo) => {
                        if (oldToDo.id === toDoDetail.to_do_id) {
                            const newToDoDetails = oldToDo.to_do_details.filter(
                                (detail) => detail.id !== toDoDetail.id
                            );
                            return { ...oldToDo, to_do_details: newToDoDetails };
                        }
                        return oldToDo;
                    })
                );

                // 以前のToDoリストを返す
                return { previousToDoList };
            },
            /**
             * ミューテーションが成功またはエラーになった後に呼び出される関数
             * クエリを再フェッチして最新のデータを取得する
             * 
             * @param {Object} data - ミューテーションのレスポンスデータ
             * @param {Error} error - エラー情報（存在する場合）
             * @param {Object} toDoDetail - 削除対象のToDo詳細アイテム
             * @param {Object} context - onMutateから返されたコンテキスト
             */
            onSettled: (data, error, toDoDetail, context) => {
                if (error) {
                    console.error(`ToDo詳細の削除に失敗しました: ${error.message}`);
                    // 必要に応じてユーザーに通知を送信
                }
                queryClient.invalidateQueries("toDoList");
            },
            /**
             * ミューテーションがエラーになった場合に以前のデータをロールバックする関数
             * 
             * @param {Error} error - エラー情報
             * @param {Object} toDoDetail - 削除対象のToDo詳細アイテム
             * @param {Object} context - onMutateから返されたコンテキスト
             */
            onError: (error, toDoDetail, context) => {
                if (context?.previousToDoList) {
                    queryClient.setQueryData("toDoList", context.previousToDoList);
                }
                console.error(`ロールバックを実行しました: ${error.message}`);
            }
        }
    );

    return { deleteToDoDetailMutation };
};

export default useDeleteToDoDetailMutateTask;