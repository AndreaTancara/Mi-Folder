@extends('layouts.base')

@section('titulo', 'Sin permiso')

@section('contenido')
  <div class="error-pagina">
    <div class="icono">🔐</div>
    <h1>Esta parte es solo para Kardex</h1>
    <p class="muted">Tu cuenta no tiene permiso para ver esta página.</p>
    <a class="button primary" href="{{ url('/') }}">Volver a Mi Folder</a>
  </div>
@endsection
