<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

// Ingresar, crear cuenta y salir.
class AuthController extends Controller
{
    public function mostrarIngreso()
    {
        return view('auth.ingresar');
    }

    public function ingresar(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Máximo 5 intentos por minuto para evitar que adivinen la clave.
        $llave = Str::lower($datos['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($llave, 5)) {
            throw ValidationException::withMessages([
                'email' => 'Demasiados intentos. Espera '.RateLimiter::availableIn($llave).' segundos.',
            ]);
        }

        if (! Auth::attempt($datos, $request->boolean('recordar'))) {
            RateLimiter::hit($llave);
            throw ValidationException::withMessages(['email' => 'Correo o contraseña incorrectos.']);
        }

        RateLimiter::clear($llave);
        $request->session()->regenerate();

        return redirect()->intended(Auth::user()->esKardex() ? '/panel' : '/');
    }

    public function mostrarRegistro()
    {
        return view('auth.registro');
    }

    public function registrar(Request $request)
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'registro_universitario' => ['nullable', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // Toda cuenta nueva es de estudiante. El rol "kardex" solo se da desde la base de datos.
        $user = User::create($datos);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/')->with('aviso', '¡Cuenta creada! Tu avance ahora se guarda en tu cuenta.');
    }

    // Página "Mi cuenta": datos del usuario y botón para salir.
    public function cuenta(Request $request)
    {
        $user = $request->user();
        $avance = $user->avance()->first();

        return view('auth.cuenta', [
            'user' => $user,
            'marcados' => $avance ? count($avance->marcados ?? []) : 0,
        ]);
    }

    public function actualizarCuenta(Request $request)
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'registro_universitario' => ['nullable', 'string', 'max:40'],
        ]);
        $request->user()->update($datos);

        return back()->with('ok', 'Datos guardados.');
    }

    public function salir(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
