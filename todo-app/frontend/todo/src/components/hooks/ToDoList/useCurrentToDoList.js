//取得したデータを取り出す
import { useQueryClient } from 'react-query';
const useCurrentToDoList = () => {
    //queryClientが箱を持っち得る
    //そのためデータを取り出すために、queryClientを使用する必要がある
    //queryClientを使用して、toDoListという変数名で取得したデータを取り出す
    const queryClient = useQueryClient();
    const toDoList = queryClient.getQueryData('toDoList');
    return queryClient.getQueryData('toDoList');
}

export default useCurrentToDoList;

