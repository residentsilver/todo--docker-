import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

/**
 * Todoの順序を更新するMutationフック
 * 
 * @description Todoアイテムの表示順序を変更するためのAPI呼び出しを管理
 * @author システム開発者
 * @version 1.1
 */
const useUpdateToDoOrderMutateTask = () => {
    const queryClient = useQueryClient();

    /**
     * Todoの順序を更新するAPI呼び出し
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
                order: orderData.order
            };

            console.log('送信するリクエストペイロード:', requestPayload);

            const response = await axios.put('/api/todos/order', requestPayload);
            
            console.log('Todo順序更新API呼び出し成功:', {
                status: response.status,
                data: response.data,
                responseHeaders: response.headers
            });

            return response.data;
        } catch (error) {
            console.error('Todo順序の更新に失敗しました:', {
                error,
                errorMessage: error.message,
                errorResponse: error.response?.data,
                errorStatus: error.response?.status,
                errorHeaders: error.response?.headers,
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
                    errorResponse: error.response?.data,
                    errorStatus: error.response?.status,
                    originalVariables: variables
                });
                
                // エラーの詳細をユーザーに表示
                const errorMessage = error.response?.data?.message || 'Todo順序の更新に失敗しました。';
                const errorDetails = error.response?.data?.errors ? 
                    '\n詳細: ' + JSON.stringify(error.response.data.errors, null, 2) : '';
                
                alert(errorMessage + errorDetails);
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