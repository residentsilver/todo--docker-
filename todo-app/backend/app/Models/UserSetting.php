<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

/**
 * ユーザー設定モデル
 * ユーザーごとのデフォルト設定や通知設定を管理
 * 
 * @property int $id
 * @property int $user_id
 * @property array|null $default_reminder_days
 * @property string $default_reminder_time
 * @property string $timezone
 * @property string|null $default_custom_message
 * @property bool $notification_enabled
 * @property bool $line_notification_enabled
 * @property string $currency
 * @property string $date_format
 * @property string $theme
 * @property bool $email_notification_enabled
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class UserSetting extends Model
{
    use HasFactory;

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'user_id',
        'default_reminder_days',
        'default_reminder_time',
        'timezone',
        'default_custom_message',
        'notification_enabled',
        'line_notification_enabled',
        'currency',
        'date_format',
        'theme',
        'email_notification_enabled',
    ];

    /**
     * 属性のキャスト
     */
    protected $casts = [
        'default_reminder_days' => 'array',
        'default_reminder_time' => 'datetime:H:i',
        'notification_enabled' => 'boolean',
        'line_notification_enabled' => 'boolean',
        'email_notification_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * テーマの定数
     */
    public const THEMES = [
        'light' => 'ライトモード',
        'dark' => 'ダークモード',
        'auto' => '自動',
    ];

    /**
     * 通貨の定数
     */
    public const CURRENCIES = [
        'JPY' => '日本円',
        'USD' => '米ドル',
        'EUR' => 'ユーロ',
    ];

    /**
     * 日付フォーマットの定数
     */
    public const DATE_FORMATS = [
        'Y-m-d' => 'YYYY-MM-DD',
        'Y/m/d' => 'YYYY/MM/DD',
        'd/m/Y' => 'DD/MM/YYYY',
        'm/d/Y' => 'MM/DD/YYYY',
    ];

    /**
     * ユーザーとのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * デフォルトのリマインド日数を取得（設定がない場合のフォールバック）
     */
    public function getDefaultReminderDaysOrFallbackAttribute(): array
    {
        return $this->default_reminder_days ?? [30, 7, 1];
    }

    /**
     * デフォルトのリマインド時間を取得（設定がない場合のフォールバック）
     */
    public function getDefaultReminderTimeOrFallbackAttribute(): string
    {
        return $this->default_reminder_time ?? '09:00:00';
    }

    /**
     * テーマの日本語名を取得
     */
    public function getThemeNameAttribute(): string
    {
        return self::THEMES[$this->theme] ?? $this->theme;
    }

    /**
     * 通貨の日本語名を取得
     */
    public function getCurrencyNameAttribute(): string
    {
        return self::CURRENCIES[$this->currency] ?? $this->currency;
    }

    /**
     * 日付フォーマットの表示名を取得
     */
    public function getDateFormatNameAttribute(): string
    {
        return self::DATE_FORMATS[$this->date_format] ?? $this->date_format;
    }

    /**
     * 通知が有効かどうかを判定
     */
    public function getIsNotificationEnabledAttribute(): bool
    {
        return $this->notification_enabled && $this->line_notification_enabled;
    }

    /**
     * ユーザーの設定を取得または作成
     */
    public static function getOrCreateForUser(int $userId): self
    {
        return self::firstOrCreate(
            ['user_id' => $userId],
            [
                'default_reminder_days' => [30, 7, 1],
                'default_reminder_time' => '09:00:00',
                'timezone' => 'Asia/Tokyo',
                'notification_enabled' => true,
                'line_notification_enabled' => true,
                'currency' => 'JPY',
                'date_format' => 'Y-m-d',
                'theme' => 'light',
                'email_notification_enabled' => false,
            ]
        );
    }
}
