<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Deja pasar solo a las cuentas con rol "kardex" (editor de la guía y panel).
class SoloKardex
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->esKardex(), 403, 'Solo para el personal de Kardex.');

        return $next($request);
    }
}
