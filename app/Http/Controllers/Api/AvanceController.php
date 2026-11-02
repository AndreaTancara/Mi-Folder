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

        $pausa = $request->user()->ultimaPausa();

        // "avance" es null si el estudiante todavía no guardó nada.
        return [
            'avance' => $avance ? [
                'level' => $avance->nivel,
                'progress' => (object) $avance->marcados,
                'excluded' => (object) $avance->no_aplica,
                'workflow' => (object) $avance->tramite,
                'dates' => (object) ($avance->fechas ?? []),
            ] : null,
            'pausa' => $pausa ? ['motivo' => $pausa->texto(), 'desde' => $pausa->created_at->format('Y-m-d')] : null,
        ];
    }

    public function guardar(Request $request)
    {
        $datos = $request->validate([
            'level' => ['required', Rule::in(Nivel::CLAVES)],
            'progress' => ['present', 'array', 'max:500'],
            'excluded' => ['present', 'array', 'max:500'],
            'workflow' => ['present', 'array'],
            'workflow.*' => ['array'],
            'dates' => ['nullable', 'array', 'max:100'],
        ]);

        $request->user()->avance()->updateOrCreate([], [
            'nivel' => $datos['level'],
            'marcados' => self::soloMarcas($datos['progress']),
            'no_aplica' => self::soloMarcas($datos['excluded']),
            'tramite' => array_intersect_key($datos['workflow'], array_flip(['azul', 'naranja'])),
            'fechas' => self::soloFechas($datos['dates'] ?? []),
        ]);

        return ['ok' => true];
    }

    // Guarda solo fechas válidas (AAAA-MM-DD) de claves con forma "real:azul:azul_documentos".
    private static function soloFechas(array $fechas): array
    {
        return array_filter(
            $fechas,
            fn ($v, $k) => is_string($v)
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)
                && preg_match('/^(real|demo):[a-z_]{1,20}:[a-zA-Z0-9_-]{1,100}$/', $k),
            ARRAY_FILTER_USE_BOTH
        );
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
