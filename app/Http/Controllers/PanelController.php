<?php

namespace App\Http\Controllers;

use App\Models\Avance;
use App\Models\Carta;
use App\Models\Requisito;
use App\Models\User;

// Panel del personal de Kardex: cuántos estudiantes hay en cada etapa y qué cartas se generan.
class PanelController extends Controller
{
    public function index()
    {
        $etapas = ['azul' => 0, 'naranja' => 0, 'crema_ts' => 0, 'crema_lic' => 0];
        $entregados = 0;
        foreach (Avance::all() as $avance) {
            $etapas[$avance->nivel] = ($etapas[$avance->nivel] ?? 0) + 1;
            foreach ($avance->tramite ?? [] as $t) {
                if (! empty($t['delivered'])) {
                    $entregados++;
                }
            }
        }

        $cartas = Carta::selectRaw('tipo, count(*) as total')->groupBy('tipo')->pluck('total', 'tipo');

        return view('panel', [
            'estudiantes' => User::where('rol', 'estudiante')->count(),
            'requisitos' => Requisito::count(),
            'etapas' => $etapas,
            'entregados' => $entregados,
            'cartas' => $cartas,
            'totalCartas' => $cartas->sum(),
            'recientes' => User::where('rol', 'estudiante')->latest()->take(8)->get(),
        ]);
    }
}
