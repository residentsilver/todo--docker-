<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * TodoDetailモデルクラス
 * 
 * @description Todo詳細情報を管理するEloquentモデル
 *              ソフトデリート機能を提供
 * @author システム開発者
 * @version 1.1
 */
class TodoDetail extends Model
{
    use HasFactory, SoftDeletes;
    
    /**
     * テーブル名の指定
     *
     * @var string
     */
    protected $table = 'todo_details';

    /**
     * 保護された属性
     *
     * @var array<string>
     */
    protected $fillable = [
        'todo_id',
        'description',
        'completed',
        'order'
    ];

    /**
     * 属性のキャスト
     *
     * @var array<string, string>
     */
    protected $casts = [
        'completed' => 'boolean',
    ];

    /**
     * ソフトデリートで使用する日付カラム
     *
     * @var array<string>
     */
    protected $dates = ['deleted_at'];
    
    /**
     * Todoとの多対1のリレーションシップ
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function todo()
    {
        return $this->belongsTo(Todo::class);
    }
}
