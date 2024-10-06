 // データの取得
import { useQuery, useQueryClient } from 'react-query';
import axios from 'axios';

const getToDoList = async () => {
    const { data } = await axios.get('/api/todos');
    return data;
}

const useGetToDoList = () => {
    const queryClient = useQueryClient();
    //第一引数toDoListという変数名
    //第二引数 getToDoList データを取得する関数
    //第三引数 エラーが発生した場合の処理(nullが入る)
    return useQuery('toDoList', getToDoList, {
        onError: () => {
            queryClient.setQueryData('toDoList', null);
        }
    });
}

export default useGetToDoList;

// const useGetToDoList = () => {
//     const [toDoList, setToDoList] = useState([]);
//     useEffect(() => {
//         fetch('http://localhost:8080/api/todo')
//             .then(response => response.json())
//             .then(data => setToDoList(data));
//     }, []);
//     return toDoList;
// }
