<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ajuste;
use App\Models\Nivel;
use App\Models\Requisito;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

// La guía de requisitos: todos la leen, solo Kardex la cambia.
class CatalogoController extends Controller
{
    public function index()
    {
        $catalogo = [];
        $procesos = [];
        foreach (Nivel::with('requisitos')->get() as $nivel) {
            $catalogo[$nivel->clave] = $nivel->requisitos->map->paraPagina()->values();
            $procesos[$nivel->clave] = (string) $nivel->proceso;
        }

        return [
            'catalog' => $catalogo,
            'process' => $procesos,
            // Fecha límite para presentar documentos al acto de colación (la pone Kardex en el panel).
            'colacion' => [
                'fecha' => Ajuste::leer('colacion_fecha'),
                'texto' => Ajuste::leer('colacion_texto'),
            ],
        ];
    }

    // Reemplaza la lista completa de un folder (así también se guarda el orden).
    public function actualizar(Request $request, string $clave)
    {
        $nivel = Nivel::findOrFail($clave);
        $datos = $request->validate([
            'requisitos' => ['present', 'array', 'max:100'],
            'requisitos.*.id' => ['required', 'regex:/^[a-zA-Z0-9_-]{1,100}$/', 'distinct'],
            'requisitos.*.title' => ['required', 'string', 'max:160'],
            'requisitos.*.description' => ['required', 'string', 'max:1200'],
            'requisitos.*.where' => ['required', 'string', 'max:400'],
            'requisitos.*.how' => ['required', 'string', 'max:1600'],
            'requisitos.*.cost' => ['nullable', 'string', 'max:150'],
            'requisitos.*.time' => ['nullable', 'string', 'max:150'],
            'requisitos.*.check' => ['required', 'string', 'max:1000'],
            'requisitos.*.condition' => ['nullable', 'string', 'max:2000'],
            'requisitos.*.validity' => ['nullable', 'in:'.implode(',', Requisito::VIGENCIAS)],
            'requisitos.*.source' => ['required', 'string', 'max:400'],
            'requisitos.*.date' => ['required', 'date_format:Y-m-d'],
            'requisitos.*.verified' => ['boolean'],
            'proceso' => ['nullable', 'string', 'max:6000'],
        ]);

        DB::transaction(function () use ($nivel, $datos) {
            $codigos = array_column($datos['requisitos'], 'id');
            Requisito::where('nivel', $nivel->clave)->whereNotIn('codigo', $codigos)->delete();
            foreach ($datos['requisitos'] as $orden => $r) {
                Requisito::updateOrCreate(
                    ['nivel' => $nivel->clave, 'codigo' => $r['id']],
                    Requisito::desdePagina($r) + ['orden' => $orden]
                );
            }
            $nivel->update(['proceso' => $datos['proceso'] ?? '']);
        });

        return ['ok' => true];
    }
}
