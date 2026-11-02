<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

// Valores sueltos que Kardex configura, guardados como clave => valor.
#[Fillable(['clave', 'valor'])]
class Ajuste extends Model
{
    protected $primaryKey = 'clave';

    public $incrementing = false;

    protected $keyType = 'string';

    public static function leer(string $clave, ?string $porDefecto = null): ?string
    {
        return static::find($clave)?->valor ?? $porDefecto;
    }

    public static function guardar(string $clave, ?string $valor): void
    {
        static::updateOrCreate(['clave' => $clave], ['valor' => $valor]);
    }
}
