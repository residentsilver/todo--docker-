<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * ユーザーモデル
 * 
 * @description ユーザー認証とTodo管理機能を提供するEloquentモデル
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * マスアサインメント可能な属性
     *
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * 隠す属性
     *
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * 属性の型キャスト
     *
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Todoとの1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function todos()
    {
        return $this->hasMany(Todo::class);
    }

    /**
     * サブスクリプションとの1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * リマインド履歴との1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function reminderHistories()
    {
        return $this->hasMany(ReminderHistory::class);
    }

    /**
     * LINE連携トークンとの1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function lineTokens()
    {
        return $this->hasMany(LineToken::class);
    }

    /**
     * ユーザー設定との1対1のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function userSetting()
    {
        return $this->hasOne(UserSetting::class);
    }

    /**
     * アクティブなLINE連携トークンを取得
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function activeLineToken()
    {
        return $this->hasOne(LineToken::class)->where('is_active', true)->latest();
    }
}