<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * リマインド通知履歴モデル
 * 送信された通知の履歴を管理し、重複送信を防ぐ
 * 
 * @property int $id
 * @property int $subscription_id
 * @property int $user_id
 * @property int $days_before
 * @property Carbon $scheduled_at
 * @property Carbon|null $sent_at
 * @property string $status
 * @property string|null $message
 * @property string|null $error_message
 * @property string|null $line_message_id
 * @property bool $is_read
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class ReminderHistory extends Model
{
    use HasFactory;

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'subscription_id',
        'user_id',
        'days_before',
        'scheduled_at',
        'sent_at',
        'status',
        'message',
        'error_message',
        'line_message_id',
        'is_read',
    ];

    /**
     * 属性のキャスト
     */
    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'is_read' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * ステータスの定数
     */
    public const STATUSES = [
        'pending' => '送信待ち',
        'sent' => '送信済み',
        'failed' => '送信失敗',
        'cancelled' => 'キャンセル',
    ];

    /**
     * サブスクリプションとのリレーション
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /**
     * ユーザーとのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 送信待ちのリマインドのスコープ
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * 送信済みのリマインドのスコープ
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * 送信失敗のリマインドのスコープ
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * 指定した日時以前に送信予定のリマインドのスコープ
     */
    public function scopeScheduledBefore($query, Carbon $datetime)
    {
        return $query->where('scheduled_at', '<=', $datetime);
    }

    /**
     * 未読のリマインドのスコープ
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * ステータスの日本語名を取得
     */
    public function getStatusNameAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * 送信済みかどうかを判定
     */
    public function getIsSentAttribute(): bool
    {
        return $this->status === 'sent';
    }

    /**
     * 送信失敗かどうかを判定
     */
    public function getIsFailedAttribute(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * 送信待ちかどうかを判定
     */
    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'pending';
    }
}
