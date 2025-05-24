import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * 認証されたユーザーのTodoの順序を更新するMutationフック
 * 
 * @description AuthContextを使用して認証付きでTodoアイテムの表示順序を変更
 */
const useUpdateToDoOrderMutateTask = () => {
    const queryClient = useQueryClient();
    const { authenticatedRequest } = useAuth();

    /**
     * 認証付きでTodoの順序を更新するAPI呼び出し
     * 
     * @param {Object} orderData - 順序データ
     * @param {Array} orderData.order - TodoのIDの配列（新しい順序）
     * @returns {Promise} API呼び出しのPromise
     */
    const updateToDoOrder = async (orderData) => {
        try {
            console.log('Todo順序更新API呼び出し開始:', {
                orderData,
                orderArray: orderData.order,
                orderLength: orderData.order?.length
            });

            const requestPayload = {
                todos: orderData.order.map((id, index) => ({
                    id: id,
                    order: index + 1
                }))
            };

            console.log('送信するリクエストペイロード:', requestPayload);

            const data = await authenticatedRequest('/todos/order', {
                method: 'PUT',
                body: JSON.stringify(requestPayload),
            });
            
            console.log('Todo順序更新API呼び出し成功:', data);
            return data;
        } catch (error) {
            console.error('Todo順序の更新に失敗しました:', {
                error,
                errorMessage: error.message,
                requestData: orderData
            });
            throw error;
        }
    };

    const updateToDoOrderMutation = useMutation(
        updateToDoOrder,
        {
            onMutate: (variables) => {
                console.log('Todo順序更新Mutation開始:', variables);
                return variables;
            },
            onSuccess: (data, variables) => {
                console.log('Todo順序が正常に更新されました:', {
                    responseData: data,
                    originalVariables: variables
                });
                // Todoリストのキャッシュを無効化して再取得
                queryClient.invalidateQueries('toDoList');
            },
            onError: (error, variables) => {
                console.error('Todo順序の更新でエラーが発生しました:', {
                    error,
                    errorMessage: error.message,
                    originalVariables: variables
                });
                
                // エラーの詳細をユーザーに表示
                const errorMessage = error.message || 'Todo順序の更新に失敗しました。';
                alert(errorMessage);
            },
            onSettled: (data, error, variables) => {
                console.log('Todo順序更新Mutation完了:', {
                    success: !error,
                    data,
                    error,
                    variables
                });
                // 成功・失敗に関わらず、キャッシュを更新
                queryClient.invalidateQueries('toDoList');
            }
        }
    );

    return { updateToDoOrderMutation };
};

export default useUpdateToDoOrderMutateTask; 