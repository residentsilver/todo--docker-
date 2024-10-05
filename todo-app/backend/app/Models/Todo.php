<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    use HasFactory;

    /**
     * 保護された属性
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'completed',
    ];
}