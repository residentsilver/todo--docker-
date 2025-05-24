<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Todoモデルクラス
 * 
 * @description Todoアイテムを管理するEloquentモデル
 *              ソフトデリート機能と順序管理機能、ユーザー関連付け機能を提供
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
        'user_id',
        'order',
    ];

    /**
     * ソフトデリートで使用する日付カラム
     *
     * @var array<string>
     */
    protected $dates = ['deleted_at'];

    /**
     * デフォルトの並び順を設定
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        // 新しいTodoが作成される際に、自動的に最大のorder値+1を設定
        static::creating(function ($todo) {
            if (is_null($todo->order)) {
                $todo->order = static::max('order') + 1;
            }
        });
    }

    /**
     * Userとの多対1のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * TodoDetailとの1対多のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function todoDetails()
    {
        return $this->hasMany(TodoDetail::class);
    }

    /**
     * デフォルトのクエリスコープ：order順で並び替え
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    /**
     * 特定のユーザーのTodoのみを取得するスコープ
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $userId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}