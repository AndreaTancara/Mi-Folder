<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['nivel', 'marcados', 'no_aplica', 'tramite', 'fechas'])]
class Avance extends Model
{
    protected function casts(): array
    {
        return [
            'marcados' => 'array',
            'no_aplica' => 'array',
            'tramite' => 'array',
            'fechas' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
