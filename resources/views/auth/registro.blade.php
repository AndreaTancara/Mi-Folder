@extends('layouts.base')

@section('titulo', 'Crear cuenta')

@section('contenido')
  <form method="POST" action="{{ url('/registro') }}" class="panel cuenta">
    @csrf
    <span class="eyebrow">Mi cuenta</span>
    <h1>Crear cuenta</h1>
    <p class="muted">Así tu avance se guarda y lo ves desde cualquier computadora.</p>
    @if ($errors->any())
      <ul class="errores">
        @foreach ($errors->all() as $error)
          <li>{{ $error }}</li>
        @endforeach
      </ul>
    @endif
    <label for="name">Nombres y apellidos</label>
    <input id="name" name="name" value="{{ old('name') }}" required maxlength="120" autocomplete="name" />
    <label for="ru">Registro universitario (opcional)</label>
    <input id="ru" name="registro_universitario" value="{{ old('registro_universitario') }}" maxlength="40" />
    <label for="email">Correo</label>
    <input id="email" name="email" type="email" value="{{ old('email') }}" required autocomplete="email" />
    <label for="password">Contraseña (mínimo 8 caracteres)</label>
    <div class="clave"><input id="password" name="password" type="password" required autocomplete="new-password" /><button type="button" data-ver-clave>Mostrar</button></div>
    <label for="password_confirmation">Repite la contraseña</label>
    <div class="clave"><input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" /><button type="button" data-ver-clave>Mostrar</button></div>
    <button class="primary" style="width: 100%; margin-top: 16px">Crear mi cuenta</button>
    <p class="muted">¿Ya tienes cuenta? <a href="{{ url('/ingresar') }}">Ingresa</a>.</p>
  </form>
@endsection
