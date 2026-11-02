<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carta;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Cuenta cuántas cartas se generan de cada tipo. No guarda los datos escritos en la carta.
class CartaController extends Controller
{
    public function registrar(Request $request)
    {
        $datos = $request->validate(['tipo' => ['required', Rule::in(array_keys(Carta::TIPOS))]]);
        Carta::create(['tipo' => $datos['tipo'], 'user_id' => $request->user()?->id]);

        return ['ok' => true];
    }
}
