@extends('layouts.base')

@section('titulo', 'Sesión expirada')

@section('contenido')
  <div class="error-pagina">
    <div class="icono">⏳</div>
    <h1>La página estuvo abierta mucho tiempo</h1>
    <p class="muted">Por seguridad, vuelve atrás, recarga la página e inténtalo otra vez.</p>
    <a class="button primary" href="{{ url('/') }}">Volver a Mi Folder</a>
  </div>
@endsection
