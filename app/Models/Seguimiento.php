<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'autor', 'motivo', 'detalle'])]
class Seguimiento extends Model
{
    // Por qué un estudiante pausa su trámite.
    public const MOTIVOS = [
        'dinero' => 'Falta de dinero para los depósitos',
        'tiempo' => 'Falta de tiempo o trabajo',
        'documento' => 'Me falta un documento difícil de conseguir',
        'requisito' => 'No entendí algún requisito',
        'kardex' => 'Esperando una respuesta de Kardex',
        'vencido' => 'Se me venció un documento',
        'otro' => 'Otro motivo',
    ];

    // Otros registros que no son pausas.
    public const RETOMADO = 'retomado';

    public const NOTA = 'nota';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function texto(): string
    {
        return self::MOTIVOS[$this->motivo]
            ?? ($this->motivo === self::RETOMADO ? 'Retomó su trámite' : 'Nota de Kardex');
    }
}
