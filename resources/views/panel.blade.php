@extends('layouts.base')

@section('titulo', 'Panel de Kardex')

@php
  $nombresNivel = ['azul' => 'Azul', 'naranja' => 'Naranja', 'crema_ts' => 'Crema T.S.', 'crema_lic' => 'Crema Lic.'];
  $estadosTencia = ['vigente' => 'Vigente', 'por_vencer' => 'Por vencer', 'vencida' => 'Vencida'];
@endphp

@section('contenido')
  <span class="eyebrow">Solo personal de Kardex</span>
  <h1>Panel</h1>
  <div class="actions">
    <a class="button primary" href="{{ url('/#editor') }}">Editar la guía de requisitos</a>
  </div>

  @if ($claveInicial)
    <p class="aviso-error">⚠️ Tu cuenta todavía usa la contraseña de ejemplo. <a href="{{ url('/cuenta') }}">Cámbiala en Mi cuenta</a> antes de publicar la página.</p>
  @endif
  @if (session('ok'))
    <p class="aviso-ok">✓ {{ session('ok') }}</p>
  @endif
  @if ($errors->any())
    <p class="aviso-error">{{ $errors->first() }}</p>
  @endif

  <div class="panel-grid">
    <div class="panel"><b>{{ $estudiantes }}</b>estudiantes con cuenta</div>
    <div class="panel"><b>{{ $entregados }}</b>folders entregados</div>
    <div class="panel alerta"><b>{{ $enPausa }}</b>pausaron su trámite</div>
    <div class="panel alerta"><b>{{ $inactivos }}</b>sin avanzar hace {{ \App\Http\Controllers\PanelController::DIAS_INACTIVO }}+ días</div>
    <div class="panel alerta"><b>{{ $vencidas }}</b>tencias vencidas</div>
    <div class="panel"><b>{{ $porVencer }}</b>tencias por vencer</div>
    <div class="panel"><b>{{ $totalCartas }}</b>cartas generadas</div>
    <div class="panel"><b>{{ $requisitos }}</b>requisitos en la guía</div>
  </div>

  <div class="panel colacion-form">
    <h2>🎓 Acto de colación</h2>
    <p class="muted">Los estudiantes verán cuántos días les quedan para presentar sus documentos. Deja la fecha vacía para quitar el aviso.</p>
    <form method="POST" action="{{ url('/panel/colacion') }}">
      @csrf
      <div>
        <label for="fecha">Fecha límite para presentar documentos</label>
        <input type="date" id="fecha" name="fecha" value="{{ old('fecha', $colacionFecha) }}" />
      </div>
      <div>
        <label for="texto">Nombre del acto (opcional)</label>
        <input id="texto" name="texto" maxlength="150" placeholder="Acto de colación de diciembre" value="{{ old('texto', $colacionTexto) }}" />
      </div>
      <button>Guardar</button>
    </form>
  </div>

  <div class="panel" style="margin-top: 24px">
    <h2>Seguimiento de estudiantes</h2>
    <p class="muted">Primero aparecen quienes necesitan atención: pausaron su trámite, no avanzan hace tiempo o se les venció la tencia.</p>
    <form method="GET" action="{{ url('/panel') }}" class="buscador">
      <input type="search" name="buscar" value="{{ $buscar }}" placeholder="Buscar por nombre, R.U. o correo…" aria-label="Buscar estudiante" />
      <button>Buscar</button>
      @if ($buscar !== '')
        <a class="button" href="{{ url('/panel') }}">Ver todos</a>
      @endif
    </form>
    @if ($filas->isEmpty())
      <p class="muted">{{ $buscar !== '' ? 'Nadie coincide con "'.$buscar.'".' : 'Todavía no hay estudiantes registrados.' }}</p>
    @else
      <div class="tabla-scroll">
        <table class="tabla">
          <tr><th>Estudiante</th><th>Folder</th><th>Avance</th><th>Última actividad</th><th>Estado</th><th>Tencia</th><th></th></tr>
          @foreach ($filas as $f)
            <tr @class(['fila-atencion' => $f['atencion']])>
              <td>{{ $f['user']->name }}<br /><small class="muted">{{ $f['user']->registro_universitario ?: 'Sin R.U.' }}</small></td>
              <td>{{ $nombresNivel[$f['nivel']] ?? '—' }}</td>
              <td>{{ $f['porcentaje'] }}%</td>
              <td>{{ $f['dias'] === 0 ? 'Hoy' : 'Hace '.$f['dias'].' '.($f['dias'] === 1 ? 'día' : 'días') }}</td>
              <td>
                @if ($f['pausa'])
                  <span class="etiqueta pausa">⏸️ {{ $f['pausa']->texto() }}</span>
                @elseif ($f['inactivo'])
                  <span class="etiqueta inactivo">💤 Sin avanzar</span>
                @elseif ($f['entregado'])
                  <span class="etiqueta ok">📦 Entregó folder</span>
                @else
                  <span class="etiqueta ok">Avanzando</span>
                @endif
              </td>
              <td>
                @if ($f['tencia'])
                  <span class="etiqueta {{ $f['tencia']['estado'] }}">{{ $estadosTencia[$f['tencia']['estado']] }}</span>
                  <br /><small class="muted">hasta {{ \Illuminate\Support\Carbon::parse($f['tencia']['vence'])->format('d/m/Y') }}</small>
                @else
                  <span class="muted">—</span>
                @endif
              </td>
              <td><a href="{{ url('/panel/estudiantes/'.$f['user']->id) }}">Ver</a></td>
            </tr>
          @endforeach
        </table>
      </div>
    @endif
  </div>

  <div class="cards" style="margin-top: 24px">
    <div class="panel">
      <h2>¿Por qué pausan su trámite?</h2>
      <table class="tabla">
        <tr><th>Motivo</th><th>Estudiantes</th></tr>
        @foreach (\App\Models\Seguimiento::MOTIVOS as $clave => $texto)
          <tr><td>{{ $texto }}</td><td>{{ $motivos[$clave] ?? 0 }}</td></tr>
        @endforeach
      </table>
    </div>
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
@endsection
