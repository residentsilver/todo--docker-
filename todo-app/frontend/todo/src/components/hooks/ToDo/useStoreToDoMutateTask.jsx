import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

/**
 * ToDoアイテムを保存するためのカスタムフック
 * 
 * @returns {Object} - ミューテーションオブジェクト
 */
const useStoreToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const storeToDoMutation = useMutation(
        /**
         * ToDoアイテムを保存する関数
         * 
         * @param {Object} toDo - 保存対象のToDoアイテム
         * @returns {Promise} - AxiosのPOSTリクエストのレスポンス
         */
        (toDo) => axios.post("/api/todos", toDo),
        {
            onSettled: () => {
                queryClient.invalidateQueries("toDoList");
            }
        }
    );
    return { storeToDoMutation };
};

export default useStoreToDoMutateTask;