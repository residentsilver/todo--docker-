<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * イベントモデル
 */
class Event extends Model
{
    use HasFactory;

    /**
     * マスアサインメント可能な属性
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'name',
        'deadline',
    ];

    /**
     * ユーザーとのリレーション
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}