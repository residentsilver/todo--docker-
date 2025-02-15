import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

const useUpdateToDoMutateTask = () => {
    const queryClient = useQueryClient();
    const updateToDoMutation = useMutation(
        (toDo) => axios.put("/api/todos/" + toDo.id, { title: toDo.title }),
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
                // ミューテーションが成功またはエラーになった後にクエリを再フェッチ	
                onSettled: () => {
                    queryClient.invalidateQueries("toDoList");
                }
            }
    );
    return { updateToDoMutation };
};
export default useUpdateToDoMutateTask;