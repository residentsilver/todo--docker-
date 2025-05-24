// データの取得
import { useQuery, useQueryClient } from 'react-query';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのTodoリストを取得するフック
 * 
 * @description AuthContextを使用して認証付きでTodoリストを取得
 */

const useGetToDoList = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest, isAuthenticated } = useAuth();

    /**
     * 認証付きでTodoリストを取得する関数
     * 
     * @returns {Promise<Array>} Todoリスト
     */
    const getToDoList = async () => {
        if (!isAuthenticated) {
            throw new Error('認証が必要です');
        }
        
        const data = await authenticatedRequest('/todos');
        return data;
    };

    // 認証されている場合のみクエリを実行
    return useQuery('toDoList', getToDoList, {
        enabled: isAuthenticated, // 認証されている場合のみクエリを実行
        onError: (error) => {
            console.error('Todoリストの取得に失敗しました:', error);
            queryClient.setQueryData('toDoList', null);
        },
        retry: (failureCount, error) => {
            // 認証エラーの場合はリトライしない
            if (error.message.includes('認証')) {
                return false;
            }
            return failureCount < 3;
        }
    });
};

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
