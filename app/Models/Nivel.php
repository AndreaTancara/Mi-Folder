<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['clave', 'nombre', 'proceso'])]
class Nivel extends Model
{
    protected $table = 'niveles';

    protected $primaryKey = 'clave';

    public $incrementing = false;

    protected $keyType = 'string';

    // Claves que usa la aplicación, en el orden en que se muestran.
    public const CLAVES = ['azul', 'naranja', 'crema_ts', 'crema_lic'];

    public function requisitos(): HasMany
    {
        return $this->hasMany(Requisito::class, 'nivel', 'clave')->orderBy('orden');
    }
}
