<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TodoDetail extends Model
{
    use HasFactory;
    protected $table = 'todo_details';

    protected $fillable = [
        'todo_id',
        'description',
        'completed',
        'order'
    ];

    protected $casts = [
        'completed' => 'boolean',
    ];
    
    public function Todo(){
        return $this->belongsTo(Todo::class);
    }
}
