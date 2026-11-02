{{-- Botón de la cuenta (arriba a la derecha). El botón de modo claro/oscuro se agrega aquí con ui.js. --}}
<div class="header-tools no-print">
  @auth
    <a class="cuenta-chip" href="{{ url('/cuenta') }}" title="Mi cuenta">
      <span class="avatar" aria-hidden="true">{{ mb_strtoupper(mb_substr(auth()->user()->name, 0, 1)) }}</span>
      <span class="cuenta-nombre">{{ Str::before(auth()->user()->name, ' ') }}</span>
    </a>
  @else
    <a class="cuenta-chip invitado" href="{{ url('/ingresar') }}">
      <span class="avatar" aria-hidden="true">👤</span>
      <span class="cuenta-nombre">Ingresar</span>
    </a>
  @endauth
</div>
