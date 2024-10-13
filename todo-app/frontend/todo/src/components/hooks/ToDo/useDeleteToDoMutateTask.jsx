import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

/**
 * ToDoアイテムを削除するためのカスタムフック
 * 
 * @returns {Object} - ミューテーションオブジェクト
 */
const useDeleteToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const deleteToDoMutation = useMutation(
        /**
         * ToDoアイテムを削除する関数
         * 
         * @param {Object} toDo - 削除対象のToDoアイテム
         * @returns {Promise} - AxiosのDELETEリクエストのレスポンス
         */
        (toDo) => axios.delete("/api/todos/" + toDo.id),
        {
            onSettled: () => {
                queryClient.invalidateQueries("toDoList")
            }
        }
    );
    return { deleteToDoMutation };
};
export default useDeleteToDoMutateTask;