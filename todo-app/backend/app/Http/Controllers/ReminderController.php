<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Subscription;
use App\Models\ReminderHistory;
use App\Models\UserSetting;
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
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('contract_type')) {
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
            $lineToken = $user->activeLineToken;
            if (!$lineToken || !$lineToken->is_valid) {
                return response()->json([
                    'status' => 'error',
                    'message' => '有効なLINE連携が見つかりません。先にLINE連携を行ってください。'
                ], 400);
            }

            $daysBefore = $request->get('days_before', 7);
            
            // テスト用のリマインド履歴を作成
            $testReminder = ReminderHistory::create([
                'subscription_id' => $subscription->id,
                'user_id' => $user->id,
                'days_before' => $daysBefore,
                'scheduled_at' => Carbon::now(),
                'status' => 'pending',
            ]);

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
        // 既存の送信待ちリマインドを削除
        $subscription->reminderHistories()->where('status', 'pending')->delete();
        
        // 新しいリマインド履歴を作成
        $this->createReminderHistories($subscription);
    }
}
