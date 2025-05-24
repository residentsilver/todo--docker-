<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Carbon\Carbon;

/**
 * LINE連携トークン管理モデル
 * ユーザーとLINEアカウントの紐付け情報を安全に管理
 * 
 * @property int $id
 * @property int $user_id
 * @property string $line_user_id
 * @property string $access_token
 * @property string|null $refresh_token
 * @property Carbon|null $token_expires_at
 * @property string|null $line_display_name
 * @property string|null $line_picture_url
 * @property array|null $scope
 * @property bool $is_active
 * @property Carbon $linked_at
 * @property Carbon|null $last_used_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class LineToken extends Model
{
    use HasFactory;

    /**
     * 一括代入可能な属性
     */
    protected $fillable = [
        'user_id',
        'line_user_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'line_display_name',
        'line_picture_url',
        'scope',
        'is_active',
        'linked_at',
        'last_used_at',
    ];

    /**
     * 属性のキャスト
     */
    protected $casts = [
        'token_expires_at' => 'datetime',
        'scope' => 'array',
        'is_active' => 'boolean',
        'linked_at' => 'datetime',
        'last_used_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 隠す属性（JSONシリアライゼーション時）
     */
    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * ユーザーとのリレーション
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * アクティブなトークンのスコープ
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * 有効期限内のトークンのスコープ
     */
    public function scopeNotExpired($query)
    {
        return $query->where(function ($query) {
            $query->whereNull('token_expires_at')
                  ->orWhere('token_expires_at', '>', Carbon::now());
        });
    }

    /**
     * アクセストークンの暗号化
     */
    protected function accessToken(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => decrypt($value),
            set: fn ($value) => encrypt($value),
        );
    }

    /**
     * リフレッシュトークンの暗号化
     */
    protected function refreshToken(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? decrypt($value) : null,
            set: fn ($value) => $value ? encrypt($value) : null,
        );
    }

    /**
     * トークンが有効かどうかを判定
     */
    public function getIsValidAttribute(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->token_expires_at && $this->token_expires_at < Carbon::now()) {
            return false;
        }

        return true;
    }

    /**
     * 最終利用日時を更新
     */
    public function updateLastUsed(): void
    {
        $this->update(['last_used_at' => Carbon::now()]);
    }

    /**
     * トークンを無効化
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}
