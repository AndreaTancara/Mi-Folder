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
      <a class="brand" href="{{ url('/') }}"><span class="logo" aria-hidden="true"></span>Mi Folder</a>
      <nav>
        <a href="{{ url('/') }}">Volver a Mi Folder</a>
        @auth
          <form method="POST" action="{{ url('/salir') }}" class="nav-form">
            @csrf
            <button class="link">Salir</button>
          </form>
        @endauth
      </nav>
    </header>
    <main>@yield('contenido')</main>
  </body>
</html>
