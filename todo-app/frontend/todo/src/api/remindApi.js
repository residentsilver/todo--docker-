import apiClient from './axios';

/**
 * リマインドAPI サービス
 * 
 * @description サブスクリプション管理、リマインド履歴、統計、設定に関するAPI呼び出しを管理
 */

// サブスクリプション関連API
export const subscriptionApi = {
    // サブスクリプション一覧取得
    getSubscriptions: (params = {}) => {
        return apiClient.get('/remind/subscriptions', { params });
    },

    // サブスクリプション詳細取得
    getSubscription: (id) => {
        return apiClient.get(`/remind/subscriptions/${id}`);
    },

    // サブスクリプション作成
    createSubscription: (data) => {
        return apiClient.post('/remind/subscriptions', data);
    },

    // サブスクリプション更新
    updateSubscription: (id, data) => {
        return apiClient.put(`/remind/subscriptions/${id}`, data);
    },

    // サブスクリプション削除
    deleteSubscription: (id) => {
        return apiClient.delete(`/remind/subscriptions/${id}`);
    },

    // テストリマインド送信
    sendTestReminder: (id) => {
        return apiClient.post(`/remind/subscriptions/${id}/test`);
    },

    // メッセージプレビュー
    previewMessage: (id) => {
        return apiClient.get(`/remind/subscriptions/${id}/preview`);
    },
};

// リマインド履歴関連API
export const historyApi = {
    // リマインド履歴取得
    getHistory: (params = {}) => {
        return apiClient.get('/remind/history', { params });
    },
};

// 統計関連API
export const analyticsApi = {
    // 統計データ取得
    getAnalytics: (params = {}) => {
        return apiClient.get('/remind/analytics', { params });
    },
};

// 設定関連API
export const settingsApi = {
    // ユーザー設定取得
    getSettings: () => {
        return apiClient.get('/remind/settings');
    },

    // ユーザー設定更新
    updateSettings: (data) => {
        return apiClient.put('/remind/settings', data);
    },

    // LINE連携状態確認
    checkLineConnection: () => {
        return apiClient.get('/remind/line/status');
    },

    // LINE連携設定
    connectLine: (data) => {
        return apiClient.post('/remind/line/connect', data);
    },

    // LINE連携解除
    disconnectLine: () => {
        return apiClient.delete('/remind/line/disconnect');
    },
};

// 統合API（全ての機能をまとめたオブジェクト）
const remindApi = {
    subscriptions: subscriptionApi,
    history: historyApi,
    analytics: analyticsApi,
    settings: settingsApi,
};

export default remindApi; 