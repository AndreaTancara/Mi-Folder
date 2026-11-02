@extends('layouts.base')

@section('titulo', 'Ingresar')

@section('contenido')
  <form method="POST" action="{{ url('/ingresar') }}" class="panel cuenta">
    @csrf
    <span class="eyebrow">Mi cuenta</span>
    <h1>Ingresar</h1>
    @if ($errors->any())
      <p class="errores">{{ $errors->first() }}</p>
    @endif
    <label for="email">Correo</label>
    <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus autocomplete="email" />
    <label for="password">Contraseña</label>
    <input id="password" name="password" type="password" required autocomplete="current-password" />
    <label class="inline"><input type="checkbox" name="recordar" /> Recordarme en este equipo</label>
    <button class="primary" style="width: 100%; margin-top: 16px">Ingresar</button>
    <p class="muted">¿No tienes cuenta? <a href="{{ url('/registro') }}">Crea una gratis</a>.</p>
  </form>
@endsection
