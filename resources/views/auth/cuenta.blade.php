@extends('layouts.base')

@section('titulo', 'Mi cuenta')

@section('contenido')
  <div class="panel cuenta">
    <span class="eyebrow">{{ $user->esKardex() ? 'Personal de Kardex' : 'Estudiante' }}</span>
    <h1>Mi cuenta</h1>

    @if (session('ok'))
      <p class="ok">✓ {{ session('ok') }}</p>
    @endif
    @if ($errors->any())
      <p class="errores">{{ $errors->first() }}</p>
    @endif

    <dl class="datos">
      <dt>Correo</dt>
      <dd>{{ $user->email }}</dd>
      @unless ($user->esKardex())
        <dt>Documentos marcados</dt>
        <dd>{{ $marcados }}</dd>
      @endunless
      <dt>Cuenta creada</dt>
      <dd>{{ $user->created_at->format('d/m/Y') }}</dd>
    </dl>

    <form method="POST" action="{{ url('/cuenta') }}">
      @csrf
      @method('PUT')
      <label for="name">Nombres y apellidos</label>
      <input id="name" name="name" value="{{ old('name', $user->name) }}" required maxlength="120" />
      @unless ($user->esKardex())
        <label for="ru">Registro universitario</label>
        <input id="ru" name="registro_universitario" value="{{ old('registro_universitario', $user->registro_universitario) }}" maxlength="40" />
      @endunless
      <button style="margin-top: 14px">Guardar cambios</button>
    </form>

    <details class="cambiar-clave" @if ($errors->hasAny(['clave_actual', 'password'])) open @endif>
      <summary>🔑 Cambiar mi contraseña</summary>
      <form method="POST" action="{{ url('/cuenta/clave') }}">
        @csrf
        @method('PUT')
        <label for="clave_actual">Contraseña actual</label>
        <div class="clave"><input id="clave_actual" name="clave_actual" type="password" required autocomplete="current-password" /><button type="button" data-ver-clave>Mostrar</button></div>
        <label for="password">Contraseña nueva (mínimo 8 caracteres)</label>
        <div class="clave"><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" /><button type="button" data-ver-clave>Mostrar</button></div>
        <label for="password_confirmation">Repite la contraseña nueva</label>
        <div class="clave"><input id="password_confirmation" name="password_confirmation" type="password" required autocomplete="new-password" /><button type="button" data-ver-clave>Mostrar</button></div>
        <button style="margin-top: 14px">Cambiar contraseña</button>
      </form>
    </details>

    <div class="acciones">
      @if ($user->esKardex())
        <a class="button primary" href="{{ url('/panel') }}">Ir al panel</a>
        <a class="button" href="{{ url('/#editor') }}">Editar la guía</a>
      @else
        <a class="button primary" href="{{ url('/#inicio') }}">Ir a mis folders</a>
      @endif
      <form method="POST" action="{{ url('/salir') }}">
        @csrf
        <button class="danger">Cerrar sesión</button>
      </form>
    </div>
  </div>
@endsection
