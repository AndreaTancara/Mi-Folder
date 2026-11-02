@extends('layouts.base')

@section('titulo', $e->name)

@php
  $nombresNivel = ['azul' => 'Azul · Técnico Superior', 'naranja' => 'Naranja · Licenciatura', 'crema_ts' => 'Crema · Técnico Superior', 'crema_lic' => 'Crema · Licenciatura'];
  $estadosTencia = ['vigente' => 'Vigente', 'por_vencer' => 'Por vencer', 'vencida' => 'Vencida: debe volver a hacer el depósito'];
@endphp

@section('contenido')
  <a href="{{ url('/panel') }}">← Volver al panel</a>
  <span class="eyebrow" style="display: block; margin-top: 12px">Seguimiento</span>
  <h1>{{ $e->name }}</h1>

  @if (session('clave'))
    <div class="panel clave-nueva">
      <p>🔑 Nueva contraseña de {{ $e->name }}:</p>
      <b>{{ session('clave') }}</b>
      <p class="muted">Díctasela o anótasela. No se volverá a mostrar. Pídele que la cambie en "Mi cuenta".</p>
    </div>
  @endif
  @if (session('ok'))
    <p class="aviso-ok">✓ {{ session('ok') }}</p>
  @endif
  @if ($errors->any())
    <p class="aviso-error">{{ $errors->first() }}</p>
  @endif

  <div class="cards">
    <div class="panel">
      <h2>Datos</h2>
      <dl class="datos-lista">
        <dt>Correo</dt><dd>{{ $e->email }}</dd>
        <dt>R.U.</dt><dd>{{ $e->registro_universitario ?: '—' }}</dd>
        <dt>Folder</dt><dd>{{ $nombresNivel[$fila['nivel']] ?? 'Todavía no eligió' }}</dd>
        <dt>Avance</dt><dd>{{ $fila['porcentaje'] }}%</dd>
        <dt>Última actividad</dt><dd>{{ $fila['dias'] === 0 ? 'Hoy' : 'Hace '.$fila['dias'].' días' }}</dd>
        <dt>Tencia</dt>
        <dd>
          @if ($fila['tencia'])
            <span class="etiqueta {{ $fila['tencia']['estado'] }}">{{ $estadosTencia[$fila['tencia']['estado']] }}</span>
            <small class="muted">sacada el {{ \Illuminate\Support\Carbon::parse($fila['tencia']['sacada'])->format('d/m/Y') }}, vale hasta el {{ \Illuminate\Support\Carbon::parse($fila['tencia']['vence'])->format('d/m/Y') }}</small>
          @else
            —
          @endif
        </dd>
        <dt>Estado</dt>
        <dd>
          @if ($fila['pausa'])
            <span class="etiqueta pausa">⏸️ En pausa: {{ $fila['pausa']->texto() }}</span>
          @elseif ($fila['inactivo'])
            <span class="etiqueta inactivo">💤 Sin avanzar</span>
          @else
            <span class="etiqueta ok">Avanzando</span>
          @endif
        </dd>
      </dl>
    </div>

    <div class="panel">
      <h2>Agregar una nota</h2>
      <p class="muted">Por ejemplo: "Se le llamó el 3/11, dice que traerá el depósito la próxima semana". El estudiante no ve estas notas.</p>
      <form method="POST" action="{{ url('/panel/estudiantes/'.$e->id.'/notas') }}">
        @csrf
        <textarea name="detalle" rows="4" maxlength="1000" required>{{ old('detalle') }}</textarea>
        <button style="margin-top: 10px">Guardar nota</button>
      </form>

      <h2 style="margin-top: 24px">¿Olvidó su contraseña?</h2>
      <p class="muted">Verifica su carnet antes. Se creará una contraseña nueva y la anterior dejará de funcionar.</p>
      <form method="POST" action="{{ url('/panel/estudiantes/'.$e->id.'/clave') }}" onsubmit="return confirm('¿Darle una contraseña nueva a este estudiante?')">
        @csrf
        <button>Darle una contraseña nueva</button>
      </form>
    </div>
  </div>

  <div class="panel" style="margin-top: 24px">
    <h2>Historial</h2>
    @if ($e->seguimientos->isEmpty())
      <p class="muted">Todavía no hay nada registrado.</p>
    @else
      <ul class="historial">
        @foreach ($e->seguimientos as $s)
          <li>
            <small class="muted">{{ $s->created_at->format('d/m/Y H:i') }} · {{ $s->autor === 'kardex' ? 'Kardex' : 'Estudiante' }}</small>
            <b>{{ $s->texto() }}</b>
            @if ($s->detalle)
              <span>{{ $s->detalle }}</span>
            @endif
          </li>
        @endforeach
      </ul>
    @endif
  </div>
@endsection
