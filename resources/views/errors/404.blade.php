@extends('layouts.base')

@section('titulo', 'No encontrado')

@section('contenido')
  <div class="error-pagina">
    <div class="icono">🧭</div>
    <h1>No encontramos esa página</h1>
    <p class="muted">Puede que el enlace esté mal escrito.</p>
    <a class="button primary" href="{{ url('/') }}">Volver a Mi Folder</a>
  </div>
@endsection
