<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'tipo'])]
class Carta extends Model
{
    // Tipos de carta que existen en features.js.
    public const TIPOS = [
        'cert_ts' => 'Calificaciones y conclusión · TS',
        'cert_lic' => 'Calificaciones y conclusión · Licenciatura',
        'res_ts' => 'Resolución H.C.C. · TS',
        'mod_ts' => 'Modalidad de graduación · TS',
        'mod_lic' => 'Modalidad de graduación · Licenciatura',
    ];
}
