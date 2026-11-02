<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seguimiento;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// El estudiante avisa que pausó su trámite (y por qué) o que lo retomó.
class SeguimientoController extends Controller
{
    public function registrar(Request $request)
    {
        $datos = $request->validate([
            'motivo' => ['required', Rule::in([...array_keys(Seguimiento::MOTIVOS), Seguimiento::RETOMADO])],
            'detalle' => ['nullable', 'string', 'max:500'],
        ]);

        $s = $request->user()->seguimientos()->create($datos + ['autor' => 'estudiante']);

        return [
            'pausa' => $s->motivo === Seguimiento::RETOMADO ? null : ['motivo' => $s->texto(), 'desde' => $s->created_at->format('Y-m-d')],
        ];
    }
}
