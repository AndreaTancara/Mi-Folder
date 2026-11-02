<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>@yield('titulo') · Mi Folder</title>
    <link rel="stylesheet" href="{{ asset('css/styles.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/extra.css') }}" />
    <link rel="stylesheet" href="{{ asset('css/modern.css') }}" />
    <script>
      try {
        var t = localStorage.getItem('mi-folder-tema');
        document.documentElement.dataset.theme =
          t || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      } catch (e) {}
    </script>
  </head>
  <body>
    <header>
      <a class="brand" href="{{ url('/') }}">
        <span class="logo" aria-hidden="true"></span>
        Mi Folder
        <small>PROTOTIPO</small>
      </a>
      <nav>
        <a href="{{ url('/#inicio') }}">Mis folders</a>
        <a href="{{ url('/#cartas') }}">Cartas</a>
        <a href="{{ url('/#guia') }}">Ayuda</a>
        @if (auth()->user()?->esKardex())
          <a href="{{ url('/panel') }}">Panel Kardex</a>
        @endif
      </nav>
      @include('partes.cuenta')
    </header>
    <main>@yield('contenido')</main>
    <script src="{{ asset('js/interfaz/ui.js') }}"></script>
    <script>
      // Botones "Mostrar" de las contraseñas.
      document.addEventListener('click', e => {
        const b = e.target.closest('[data-ver-clave]');
        if (!b) return;
        const input = b.parentElement.querySelector('input');
        const ver = input.type === 'password';
        input.type = ver ? 'text' : 'password';
        b.textContent = ver ? 'Ocultar' : 'Mostrar';
      });
    </script>
  </body>
</html>
