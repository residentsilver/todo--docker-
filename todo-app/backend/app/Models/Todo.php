<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Todoモデルクラス
 * 
 * @description Todoアイテムを管理するEloquentモデル
 *              ソフトデリート機能を提供
 * @author システム開発者
 * @version 1.1
 */
class Todo extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * 保護された属性
     *
     * @var array<string>
     */
    protected $fillable = [
        'title',
    ];

    /**
     * ソフトデリートで使用する日付カラム
     *
     * @var array<string>
     */
    protected $dates = ['deleted_at'];

    /**
     * TodoDetailとの1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function todoDetails()
    {
        return $this->hasMany(TodoDetail::class);
    }
}