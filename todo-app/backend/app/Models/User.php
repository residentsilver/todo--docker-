<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * ユーザーモデル
 */
class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    /**
     * マスアサインメント可能な属性
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * 隠す属性
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * 属性の型キャスト
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];
}