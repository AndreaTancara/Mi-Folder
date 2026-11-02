<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nivel;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// El avance del estudiante que inició sesión.
class AvanceController extends Controller
{
    public function mostrar(Request $request)
    {
        $avance = $request->user()->avance()->first();

        // "avance" es null si el estudiante todavía no guardó nada.
        return ['avance' => $avance ? [
            'level' => $avance->nivel,
            'progress' => (object) $avance->marcados,
            'excluded' => (object) $avance->no_aplica,
            'workflow' => (object) $avance->tramite,
        ] : null];
    }

    public function guardar(Request $request)
    {
        $datos = $request->validate([
            'level' => ['required', Rule::in(Nivel::CLAVES)],
            'progress' => ['present', 'array', 'max:500'],
            'excluded' => ['present', 'array', 'max:500'],
            'workflow' => ['present', 'array'],
            'workflow.*' => ['array'],
        ]);

        $request->user()->avance()->updateOrCreate([], [
            'nivel' => $datos['level'],
            'marcados' => self::soloMarcas($datos['progress']),
            'no_aplica' => self::soloMarcas($datos['excluded']),
            'tramite' => array_intersect_key($datos['workflow'], array_flip(['azul', 'naranja'])),
        ]);

        return ['ok' => true];
    }

    // Guarda solo las claves con forma "real:azul:azul_ci" marcadas en true.
    private static function soloMarcas(array $marcas): array
    {
        return array_filter(
            $marcas,
            fn ($v, $k) => $v === true && preg_match('/^(real|demo):[a-z_]{1,20}:[a-zA-Z0-9_-]{1,100}$/', $k),
            ARRAY_FILTER_USE_BOTH
        );
    }
}
