import axios from "axios";
import { useMutation, useQueryClient } from "react-query";

const useUpdateToDoDetailMutateTask = () => {
    const queryClient = useQueryClient();

    const updateToDoDetailMutation = useMutation(
        (toDoDetail) => axios.put("/api/tododetails/" + toDoDetail.id,
            {
                description: toDoDetail.description,
                completed: toDoDetail.completed,
            }),
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
            }
        }
    );

    return { updateToDoDetailMutation };
};

export default useUpdateToDoDetailMutateTask;