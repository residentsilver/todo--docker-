<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Subscription;
use App\Models\ReminderHistory;
use App\Models\UserSetting;
use App\Models\LineToken;
use Carbon\Carbon;

/**
 * リマインド機能コントローラー
 * サブスクリプション管理とリマインド通知機能を提供
 */
class ReminderController extends Controller
{
    /**
     * サブスクリプション一覧を取得
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = $user->subscriptions()->with(['reminderHistories']);

            // フィルタリング
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            if ($request->has('contract_type') && !empty($request->contract_type)) {
                $query->where('contract_type', $request->contract_type);
            }

            // ソート
            $sortBy = $request->get('sort_by', 'end_date');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $subscriptions = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $subscriptions,
                'message' => 'サブスクリプション一覧を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'サブスクリプション一覧の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * サブスクリプションを作成
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'service_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after:start_date',
                'amount' => 'required|numeric|min:0',
                'contract_type' => 'required|in:monthly,yearly,free_trial,one_time,other',
                'url' => 'nullable|url',
                'reminder_days' => 'nullable|array',
                'reminder_days.*' => 'integer|min:1',
                'reminder_time' => 'nullable|date_format:H:i',
                'timezone' => 'nullable|string',
                'custom_message' => 'nullable|string',
                'notification_enabled' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'バリデーションエラーが発生しました',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $userSetting = UserSetting::getOrCreateForUser($user->id);

            // デフォルト値の設定
            $data = $validator->validated();
            $data['user_id'] = $user->id;
            $data['reminder_days'] = $data['reminder_days'] ?? $userSetting->default_reminder_days_or_fallback;
            $data['reminder_time'] = $data['reminder_time'] ?? $userSetting->default_reminder_time_or_fallback;
            $data['timezone'] = $data['timezone'] ?? $userSetting->timezone;
            $data['notification_enabled'] = $data['notification_enabled'] ?? true;

            $subscription = Subscription::create($data);

            // リマインド履歴の作成
            $this->createReminderHistories($subscription);

            return response()->json([
                'status' => 'success',
                'data' => $subscription->load('reminderHistories'),
                'message' => 'サブスクリプションを作成しました'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'サブスクリプションの作成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * サブスクリプション詳細を取得
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $user->subscriptions()
                ->with(['reminderHistories' => function($query) {
                    $query->orderBy('days_before', 'desc');
                }])
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => $subscription,
                'message' => 'サブスクリプション詳細を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'サブスクリプション詳細の取得に失敗しました',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * サブスクリプションを更新
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $user->subscriptions()->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'service_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'start_date' => 'sometimes|required|date',
                'end_date' => 'sometimes|required|date|after:start_date',
                'amount' => 'sometimes|required|numeric|min:0',
                'contract_type' => 'sometimes|required|in:monthly,yearly,free_trial,one_time,other',
                'url' => 'nullable|url',
                'status' => 'sometimes|required|in:active,expired,cancelled,paused,pending_renewal',
                'reminder_days' => 'nullable|array',
                'reminder_days.*' => 'integer|min:1',
                'reminder_time' => 'nullable|date_format:H:i',
                'timezone' => 'nullable|string',
                'custom_message' => 'nullable|string',
                'notification_enabled' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'バリデーションエラーが発生しました',
                    'errors' => $validator->errors()
                ], 422);
            }

            $subscription->update($validator->validated());

            // 終了日やリマインド設定が変更された場合、リマインド履歴を再作成
            if ($request->has(['end_date', 'reminder_days', 'reminder_time'])) {
                $this->recreateReminderHistories($subscription);
            }

            return response()->json([
                'status' => 'success',
                'data' => $subscription->load('reminderHistories'),
                'message' => 'サブスクリプションを更新しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'サブスクリプションの更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * サブスクリプションを削除
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $user->subscriptions()->findOrFail($id);
            
            $subscription->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'サブスクリプションを削除しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'サブスクリプションの削除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * リマインド履歴を取得
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function reminderHistories(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = $user->reminderHistories()->with(['subscription']);

            // フィルタリング
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('subscription_id')) {
                $query->where('subscription_id', $request->subscription_id);
            }

            // ソート
            $sortBy = $request->get('sort_by', 'scheduled_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $histories = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $histories,
                'message' => 'リマインド履歴を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'リマインド履歴の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 月別支払い合計を取得
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function monthlyTotals(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $year = $request->get('year', Carbon::now()->year);

            $monthlyTotals = [];
            for ($month = 1; $month <= 12; $month++) {
                $startDate = Carbon::create($year, $month, 1);
                $endDate = $startDate->copy()->endOfMonth();

                $total = $user->subscriptions()
                    ->where('status', 'active')
                    ->where(function($query) use ($startDate, $endDate) {
                        $query->where('start_date', '<=', $endDate)
                              ->where('end_date', '>=', $startDate);
                    })
                    ->sum('amount');

                $monthlyTotals[] = [
                    'month' => $month,
                    'total' => $total,
                    'formatted_total' => number_format($total)
                ];
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'year' => $year,
                    'monthly_totals' => $monthlyTotals,
                    'yearly_total' => array_sum(array_column($monthlyTotals, 'total'))
                ],
                'message' => '月別支払い合計を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => '月別支払い合計の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * メッセージプレビューを生成
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function messagePreview(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $user->subscriptions()->findOrFail($id);
            
            $daysBefore = $request->get('days_before', 7);
            
            $lineMessagingService = app(\App\Services\LineMessagingService::class);
            $preview = $lineMessagingService->generateMessagePreview($subscription, $daysBefore);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'preview' => $preview,
                    'subscription' => $subscription,
                    'days_before' => $daysBefore
                ],
                'message' => 'メッセージプレビューを生成しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'メッセージプレビューの生成に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * テストリマインダーを送信
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function sendTestReminder(Request $request, int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $subscription = $user->subscriptions()->findOrFail($id);
            
            // ユーザーのアクティブなLINEトークンを確認
            $lineToken = $user->activeLineToken; // ← 既に正しい呼び出し方法です
            if (!$lineToken || !$lineToken->is_valid) {
                \Log::warning('LINE連携エラー', [
                    'user_id' => $user->id,
                    'has_line_token' => $lineToken !== null,
                    'is_valid' => $lineToken ? $lineToken->is_valid : null,
                    'is_active' => $lineToken ? $lineToken->is_active : null,
                    'token_expires_at' => $lineToken ? $lineToken->token_expires_at : null,
                ]);
                
                return response()->json([
                    'status' => 'error',
                    'message' => '有効なLINE連携が見つかりません。先にLINE連携を行ってください。',
                    'debug' => [
                        'has_line_token' => $lineToken !== null,
                        'is_valid' => $lineToken ? $lineToken->is_valid : null,
                    ]
                ], 400);
            }

            $daysBefore = $request->get('days_before', 7);
            
            // 既存のリマインド履歴を確認
            $existingReminder = ReminderHistory::where('subscription_id', $subscription->id)
                ->where('days_before', $daysBefore)
                ->first();
            
            if ($existingReminder) {
                return response()->json([
                    'status' => 'error',
                    'message' => '同じサブスクリプションの同じ日数前通知が既に存在します',
                    'details' => [
                        'subscription_name' => $subscription->service_name,
                        'subscription_id' => $subscription->id,
                        'days_before' => $daysBefore,
                        'existing_reminder' => [
                            'id' => $existingReminder->id,
                            'status' => $existingReminder->status,
                            'scheduled_at' => $existingReminder->scheduled_at,
                            'sent_at' => $existingReminder->sent_at,
                            'created_at' => $existingReminder->created_at,
                        ]
                    ],
                    'suggestion' => '既存のリマインドを削除してから再実行するか、異なる日数を指定してください。'
                ], 409); // 409 Conflict
            }
            
            // テスト用のリマインド履歴を作成
            try {
                $testReminder = ReminderHistory::create([
                    'subscription_id' => $subscription->id,
                    'user_id' => $user->id,
                    'days_before' => $daysBefore,
                    'scheduled_at' => Carbon::now(),
                    'status' => 'pending',
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                // unique制約違反の場合
                if ($e->errorInfo[1] == 1062) { // MySQL duplicate entry error
                    return response()->json([
                        'status' => 'error',
                        'message' => 'データベース制約違反: 同じリマインド設定が既に存在します',
                        'details' => [
                            'subscription_name' => $subscription->service_name,
                            'subscription_id' => $subscription->id,
                            'days_before' => $daysBefore,
                            'constraint' => 'unique_subscription_reminder',
                            'database_error' => $e->getMessage()
                        ],
                        'suggestion' => '既存のリマインドを確認してください。'
                    ], 409);
                }
                // その他のデータベースエラー
                throw $e;
            }

            $lineMessagingService = app(\App\Services\LineMessagingService::class);
            $success = $lineMessagingService->sendReminderMessage($testReminder);

            if ($success) {
                return response()->json([
                    'status' => 'success',
                    'data' => $testReminder->fresh(),
                    'message' => 'テストリマインダーを送信しました'
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'テストリマインダーの送信に失敗しました',
                    'data' => $testReminder->fresh()
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('テスト送信エラー', [
                'user_id' => auth()->id(),
                'subscription_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'テストリマインダーの送信に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * リマインド履歴を作成
     * 
     * @param Subscription $subscription
     * @return void
     */
    private function createReminderHistories(Subscription $subscription): void
    {
        if (!$subscription->notification_enabled || !$subscription->reminder_days) {
            return;
        }

        foreach ($subscription->reminder_days as $daysBefore) {
            $scheduledAt = Carbon::parse($subscription->end_date)
                ->subDays($daysBefore)
                ->setTimeFromTimeString($subscription->reminder_time ?? '09:00:00');

            // 過去の日付の場合はスキップ
            if ($scheduledAt < Carbon::now()) {
                continue;
            }

            ReminderHistory::create([
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id,
                'days_before' => $daysBefore,
                'scheduled_at' => $scheduledAt,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * リマインド履歴を再作成
     * 
     * @param Subscription $subscription
     * @return void
     */
    private function recreateReminderHistories(Subscription $subscription): void
    {
        // 既存のリマインド履歴を削除
        $subscription->reminderHistories()->delete();
        
        // 新しいリマインド履歴を作成
        $this->createReminderHistories($subscription);
    }

    /**
     * リマインド履歴を取得
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getHistory(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = ReminderHistory::whereHas('subscription', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->with(['subscription']);

            // フィルタリング
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            if ($request->has('from_date')) {
                $query->where('reminder_date', '>=', $request->from_date);
            }
            
            if ($request->has('to_date')) {
                $query->where('reminder_date', '<=', $request->to_date);
            }

            // ソート
            $sortBy = $request->get('sort_by', 'reminder_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // ページネーション
            $perPage = $request->get('per_page', 15);
            $histories = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $histories,
                'message' => 'リマインド履歴を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'リマインド履歴の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 統計データを取得
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $startDate = $request->get('start_date', now()->subMonths(12)->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());
            
            // 基本統計
            $totalSubscriptions = $user->subscriptions()->count();
            $activeSubscriptions = $user->subscriptions()->where('status', 'active')->count();
            $totalAmount = $user->subscriptions()->where('status', 'active')->sum('amount');
            
            // 期間内の統計
            $subscriptionsInPeriod = $user->subscriptions()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();
                
            // 契約タイプ別統計
            $contractTypeStats = $user->subscriptions()
                ->selectRaw('contract_type, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupBy('contract_type')
                ->get();
                
            // 月別統計
            $monthlyStats = $user->subscriptions()
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count, SUM(amount) as total_amount')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => [
                        'total_subscriptions' => $totalSubscriptions,
                        'active_subscriptions' => $activeSubscriptions,
                        'total_monthly_amount' => $totalAmount,
                        'subscriptions_in_period' => $subscriptionsInPeriod,
                    ],
                    'contract_type_stats' => $contractTypeStats,
                    'monthly_stats' => $monthlyStats,
                ],
                'message' => '統計データを取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => '統計データの取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ユーザー設定を取得
     * 
     * @return JsonResponse
     */
    public function getSettings(): JsonResponse
    {
        try {
            $user = Auth::user();
            $settings = UserSetting::getOrCreateForUser($user->id);

            return response()->json([
                'status' => 'success',
                'data' => $settings,
                'message' => 'ユーザー設定を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'ユーザー設定の取得に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * ユーザー設定を更新
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'timezone' => 'nullable|string',
                'default_reminder_days' => 'nullable|array',
                'default_reminder_days.*' => 'integer|min:1',
                'default_reminder_time' => 'nullable|date_format:H:i',
                'line_notification_enabled' => 'boolean',
                'email_notification_enabled' => 'boolean',
                'auto_renewal_reminder' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'バリデーションエラーが発生しました',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $settings = UserSetting::getOrCreateForUser($user->id);
            $settings->update($validator->validated());

            return response()->json([
                'status' => 'success',
                'data' => $settings->fresh(),
                'message' => 'ユーザー設定を更新しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'ユーザー設定の更新に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * LINE連携状態を確認
     * 
     * @return JsonResponse
     */
    public function checkLineConnection(): JsonResponse
    {
        try {
            $user = Auth::user();
            $lineToken = $user->activeLineToken;

            return response()->json([
                'status' => 'success',
                'data' => [
                    'connected' => $lineToken !== null,
                    'connection_date' => $lineToken ? $lineToken->created_at : null,
                    'line_user_id' => $lineToken ? $lineToken->line_user_id : null,
                    'line_display_name' => $lineToken ? $lineToken->line_display_name : null,
                    'line_picture_url' => $lineToken ? $lineToken->line_picture_url : null,
                ],
                'message' => 'LINE連携状態を取得しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'LINE連携状態の確認に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * LINE連携を設定
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function connectLine(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'line_user_id' => 'required|string',
                'access_token' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'バリデーションエラーが発生しました',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            // 既存のアクティブなトークンを無効化
            $user->lineTokens()->update(['is_active' => false]);
            
            // 新しいLINEトークンを作成
            $lineToken = $user->lineTokens()->create([
                'line_user_id' => $request->line_user_id,
                'access_token' => $request->access_token,
                'is_active' => true,
            ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'connected' => true,
                    'connection_date' => $lineToken->created_at,
                    'line_user_id' => $lineToken->line_user_id,
                ],
                'message' => 'LINE連携を設定しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'LINE連携の設定に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * LINE連携を解除
     * 
     * @return JsonResponse
     */
    public function disconnectLine(): JsonResponse
    {
        try {
            $user = Auth::user();
            $user->lineTokens()->update(['is_active' => false]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'connected' => false,
                ],
                'message' => 'LINE連携を解除しました'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'LINE連携の解除に失敗しました',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
