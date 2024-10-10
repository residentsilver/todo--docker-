//取得したデータを取り出す
import { useQueryClient } from 'react-query';
const useCurrentToDoList = () => {
    //queryClientが箱を持つ
    //そのためデータを取り出すために、queryClientを使用する必要がある
    //queryClientを使用して、toDoListという変数名で取得したデータを取り出す
    const queryClient = useQueryClient();
    return queryClient.getQueryData('toDoList');
}

export default useCurrentToDoList;

