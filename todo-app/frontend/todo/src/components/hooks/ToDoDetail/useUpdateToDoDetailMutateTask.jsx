import axios from "axios";
import { useMutation } from "react-query";

const useUpdateToDoDetailMutateTask = () => {
    const updateToDoDetailMutation = useMutation((toDoDetail) => axios.put("/api/tododetails/" + toDoDetail.id, {
        description: toDoDetail.description,
        completed: toDoDetail.completed,
    }));
    return { updateToDoDetailMutation };
};

export default useUpdateToDoDetailMutateTask;