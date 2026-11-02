<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Mi Folder · Tu siguiente paso</title>
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
      <a class="brand" href="#inicio">
        <span class="logo" aria-hidden="true"></span>
        Mi Folder
        <small>PROTOTIPO</small>
      </a>
      <nav>
        <a href="#inicio">Mis folders</a>
        <a href="#cartas">Cartas</a>
        <a href="#guia">Ayuda</a>
        @if (auth()->user()?->esKardex())
          <a href="{{ url('/panel') }}">Panel Kardex</a>
        @endif
        <a href="#asistente" class="nav-cta">Empezar</a>
      </nav>
      @include('partes.cuenta')
    </header>
    <main id="app"></main>
    <footer>
      <strong>Mi Folder</strong>
      <span>Orientación académica · Ingeniería de Sistemas</span>
      <small>
        Prototipo independiente. La aprobación corresponde a Kardex.
        <br />
        Procesamiento local. El PDF no se envía ni se conserva.
      </small>
    </footer>
    <div id="notice" role="status" aria-live="polite"></div>
    <dialog id="modal">
      <form id="reqform">
        <h2 id="mtitle">Nuevo requisito</h2>
        <input name="id" type="hidden" />
        <label>
          Nombre
          <input name="title" required maxlength="160" />
        </label>
        <label>
          Para qué sirve
          <textarea name="description" required maxlength="1200"></textarea>
        </label>
        <label>
          Dónde conseguirlo
          <input name="where" required maxlength="400" />
        </label>
        <label>
          Cómo obtenerlo
          <textarea name="how" required maxlength="1600"></textarea>
        </label>
        <label>
          Costo informado
          <input name="cost" maxlength="100" placeholder="Por confirmar" />
        </label>
        <label>
          Tiempo u horario informado
          <input name="time" maxlength="150" placeholder="Por confirmar" />
        </label>
        <label>
          Qué revisar
          <textarea name="check" required maxlength="1000"></textarea>
        </label>
        <label>
          Condición de aplicabilidad
          <textarea
            name="condition"
            maxlength="2000"
            placeholder="Vacío para requisito general"
          ></textarea>
        </label>
        <label>
          ¿Vence?
          <select name="validity">
            <option value="">No vence</option>
            <option value="gestion">Sí, vale hasta el 31 de diciembre del año en que se saca</option>
          </select>
        </label>
        <label>
          Fuente consultada
          <input name="source" required maxlength="400" />
        </label>
        <label>
          Fecha de consulta
          <input name="date" type="date" required />
        </label>
        <label class="inline">
          <input type="checkbox" name="verified" />
          Contrastado con la fuente por el editor local
        </label>
        <p class="muted">Esta marca no constituye certificación institucional.</p>
        <button class="primary">Guardar</button>
        <button type="button" data-close>Cancelar</button>
      </form>
    </dialog>
    <script src="{{ asset('vendor/pdf.worker.js') }}"></script>
    <script src="{{ asset('vendor/pdf.js') }}"></script>
    <script src="{{ asset('vendor/jspdf.umd.min.js') }}"></script>
    <script src="{{ asset('js/nucleo/record-parser.js') }}"></script>
    <script src="{{ asset('js/interfaz/workflow.js') }}"></script>
    <script src="{{ asset('js/nucleo/catalog.js') }}"></script>
    <script src="{{ asset('js/nucleo/core.js') }}"></script>
    <script src="{{ asset('js/interfaz/features.js') }}"></script>
    <script src="{{ asset('js/interfaz/extras.js') }}"></script>

    <script src="{{ asset('js/interfaz/app.js') }}"></script>

    <script src="{{ asset('js/interfaz/ui.js') }}"></script>
    <script>
      window.MiFolderServidor = {{ Js::from(['usuario' => auth()->user()?->only('id', 'name', 'rol'), 'aviso' => session('aviso'), 'salio' => (bool) session('salio'), 'motivos' => \App\Models\Seguimiento::MOTIVOS]) }};
    </script>
    <script src="{{ asset('js/interfaz/servidor.js') }}"></script>
    <script src="{{ asset('js/interfaz/ayudas.js') }}"></script>
  </body>
</html>
