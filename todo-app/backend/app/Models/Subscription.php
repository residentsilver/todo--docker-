<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

/**
 * サブスクリプション情報モデル
 * ユーザーが契約しているサブスクリプションサービスの情報を管理
 * 
 * @property int $id
 * @property int $user_id
 * @property string $service_name
 * @property string|null $description
 * @property Carbon $start_date
 * @property Carbon $end_date
 * @property float $amount
 * @property string $contract_type
 * @property string|null $url
 * @property string $status
 * @property array|null $reminder_days
 * @property string|null $reminder_time
 * @property string $timezone
 * @property string|null $custom_message
 * @property bool $notification_enabled
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Subscription extends Model
{
    use HasFactory;

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'user_id',
        'service_name',
        'description',
        'start_date',
        'end_date',
        'amount',
        'contract_type',
        'url',
        'status',
        'reminder_days',
        'reminder_time',
        'timezone',
        'custom_message',
        'notification_enabled',
    ];

    /**
     * 属性のキャスト
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'amount' => 'decimal:2',
        'reminder_days' => 'array',
        'reminder_time' => 'datetime:H:i',
        'notification_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 契約タイプの定数
     */
    public const CONTRACT_TYPES = [
        'monthly' => '月額',
        'yearly' => '年額',
        'free_trial' => '無料トライアル',
        'one_time' => '一回払い',
        'other' => 'その他',
    ];

    /**
     * ステータスの定数
     */
    public const STATUSES = [
        'active' => 'アクティブ',
        'expired' => '期限切れ',
        'cancelled' => '解約済み',
        'paused' => '一時停止',
        'pending_renewal' => '更新待ち',
    ];

    /**
     * ユーザーとのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * リマインド履歴とのリレーション
     */
    public function reminderHistories(): HasMany
    {
        return $this->hasMany(ReminderHistory::class);
    }

    /**
     * 終了日までの残り日数を取得
     */
    public function getDaysUntilEndAttribute(): int
    {
        return Carbon::now()->diffInDays($this->end_date, false);
    }

    /**
     * 期限切れかどうかを判定
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->end_date < Carbon::now();
    }

    /**
     * アクティブなサブスクリプションのスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * 通知が有効なサブスクリプションのスコープ
     */
    public function scopeNotificationEnabled($query)
    {
        return $query->where('notification_enabled', true);
    }

    /**
     * 指定した日数以内に終了するサブスクリプションのスコープ
     */
    public function scopeEndingWithinDays($query, int $days)
    {
        return $query->where('end_date', '<=', Carbon::now()->addDays($days))
                    ->where('end_date', '>=', Carbon::now());
    }

    /**
     * 契約タイプの日本語名を取得
     */
    public function getContractTypeNameAttribute(): string
    {
        return self::CONTRACT_TYPES[$this->contract_type] ?? $this->contract_type;
    }

    /**
     * ステータスの日本語名を取得
     */
    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }
}
