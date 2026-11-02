@extends('layouts.base')

@section('titulo', 'Panel de Kardex')

@section('contenido')
  <span class="eyebrow">Solo personal de Kardex</span>
  <h1>Panel</h1>
  <div class="actions">
    <a class="button primary" href="{{ url('/#editor') }}">Editar la guía de requisitos</a>
  </div>

  <div class="panel-grid">
    <div class="panel"><b>{{ $estudiantes }}</b>estudiantes con cuenta</div>
    <div class="panel"><b>{{ $entregados }}</b>folders entregados</div>
    <div class="panel"><b>{{ $totalCartas }}</b>cartas generadas</div>
    <div class="panel"><b>{{ $requisitos }}</b>requisitos en la guía</div>
  </div>

  <div class="cards">
    <div class="panel">
      <h2>¿En qué folder está cada estudiante?</h2>
      <table class="tabla">
        <tr><th>Folder</th><th>Estudiantes</th></tr>
        <tr><td>Azul · Técnico Superior</td><td>{{ $etapas['azul'] }}</td></tr>
        <tr><td>Naranja · Licenciatura</td><td>{{ $etapas['naranja'] }}</td></tr>
        <tr><td>Crema · Técnico Superior</td><td>{{ $etapas['crema_ts'] }}</td></tr>
        <tr><td>Crema · Licenciatura</td><td>{{ $etapas['crema_lic'] }}</td></tr>
      </table>
    </div>
    <div class="panel">
      <h2>Cartas generadas</h2>
      <table class="tabla">
        <tr><th>Tipo</th><th>Cantidad</th></tr>
        @foreach (\App\Models\Carta::TIPOS as $tipo => $nombre)
          <tr><td>{{ $nombre }}</td><td>{{ $cartas[$tipo] ?? 0 }}</td></tr>
        @endforeach
      </table>
    </div>
  </div>

  <div class="panel" style="margin-top: 24px">
    <h2>Últimos estudiantes registrados</h2>
    @if ($recientes->isEmpty())
      <p class="muted">Todavía no hay estudiantes registrados.</p>
    @else
      <table class="tabla">
        <tr><th>Nombre</th><th>R.U.</th><th>Registrado</th></tr>
        @foreach ($recientes as $e)
          <tr><td>{{ $e->name }}</td><td>{{ $e->registro_universitario ?: '—' }}</td><td>{{ $e->created_at->format('d/m/Y') }}</td></tr>
        @endforeach
      </table>
    @endif
  </div>
@endsection
