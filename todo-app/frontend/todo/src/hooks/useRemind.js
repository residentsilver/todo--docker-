import { useQuery, useMutation, useQueryClient } from 'react-query';
import remindApi from '../api/remindApi';

/**
 * リマインド機能のカスタムフック
 * 
 * @description React Queryを使用してリマインド機能のデータ取得・更新を管理
 *              キャッシュ、ローディング状態、エラーハンドリングを含む
 */

// サブスクリプション関連フック
export const useSubscriptions = (params = {}) => {
    return useQuery(
        ['subscriptions', params],
        () => remindApi.subscriptions.getSubscriptions(params),
        {
            staleTime: 5 * 60 * 1000, // 5分間キャッシュ
            cacheTime: 10 * 60 * 1000, // 10分間保持
        }
    );
};

export const useSubscription = (id) => {
    return useQuery(
        ['subscription', id],
        () => remindApi.subscriptions.getSubscription(id),
        {
            enabled: !!id,
            staleTime: 5 * 60 * 1000,
        }
    );
};

export const useCreateSubscription = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        remindApi.subscriptions.createSubscription,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['subscriptions']);
                queryClient.invalidateQueries(['analytics']);
            },
        }
    );
};

export const useUpdateSubscription = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        ({ id, data }) => remindApi.subscriptions.updateSubscription(id, data),
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['subscriptions']);
                queryClient.invalidateQueries(['subscription', variables.id]);
                queryClient.invalidateQueries(['analytics']);
            },
        }
    );
};

export const useDeleteSubscription = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        remindApi.subscriptions.deleteSubscription,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['subscriptions']);
                queryClient.invalidateQueries(['analytics']);
            },
        }
    );
};

export const useSendTestReminder = () => {
    return useMutation(
        remindApi.subscriptions.sendTestReminder
    );
};

export const usePreviewMessage = (id) => {
    return useQuery(
        ['preview', id],
        () => remindApi.subscriptions.previewMessage(id),
        {
            enabled: !!id,
            staleTime: 1 * 60 * 1000, // 1分間キャッシュ
        }
    );
};

// リマインド履歴関連フック
export const useHistory = (params = {}) => {
    return useQuery(
        ['history', params],
        () => remindApi.history.getHistory(params),
        {
            staleTime: 2 * 60 * 1000, // 2分間キャッシュ
        }
    );
};

// 統計関連フック
export const useAnalytics = (params = {}) => {
    return useQuery(
        ['analytics', params],
        () => remindApi.analytics.getAnalytics(params),
        {
            staleTime: 10 * 60 * 1000, // 10分間キャッシュ
        }
    );
};

// 設定関連フック
export const useSettings = () => {
    return useQuery(
        ['settings'],
        remindApi.settings.getSettings,
        {
            staleTime: 30 * 60 * 1000, // 30分間キャッシュ
        }
    );
};

export const useUpdateSettings = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        remindApi.settings.updateSettings,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['settings']);
            },
        }
    );
};

export const useLineConnection = () => {
    return useQuery(
        ['lineConnection'],
        remindApi.settings.checkLineConnection,
        {
            staleTime: 5 * 60 * 1000,
        }
    );
};

export const useConnectLine = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        remindApi.settings.connectLine,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['lineConnection']);
                queryClient.invalidateQueries(['settings']);
            },
        }
    );
};

export const useDisconnectLine = () => {
    const queryClient = useQueryClient();
    
    return useMutation(
        remindApi.settings.disconnectLine,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['lineConnection']);
                queryClient.invalidateQueries(['settings']);
            },
        }
    );
}; 