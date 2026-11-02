'use strict';
/* Mi Folder · Conexión con el servidor Laravel
   - La guía de requisitos se lee de la base de datos (así todos ven la versión vigente).
   - Si el estudiante inició sesión, su avance se guarda en su cuenta y lo ve en cualquier equipo.
   - Sin sesión, todo sigue funcionando como antes: el avance queda en este navegador.
   - El editor de la guía se abre solo con la cuenta del personal de Kardex. */
const servidor = window.MiFolderServidor || {},
  usuario = servidor.usuario || null,
  esKardex = usuario?.rol === 'kardex',
  csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (r.status === 419) throw Error('La sesión expiró. Recarga la página.');
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Error(data.message || 'Error del servidor (' + r.status + ').');
  }
  return r.json();
}

/* ---------- Guardar: navegador + cuenta ---------- */
const guardarLocal = save;
let esperaAvance,
  guiaSincronizada = {};
const fotoGuia = l => JSON.stringify([state.catalog[l], state.process[l]]);
function avanceParaServidor() {
  return {
    level: state.level,
    progress: state.progress,
    excluded: state.excluded,
    workflow: state.workflow
  };
}
save = function () {
  guardarLocal();
  if (usuario) {
    clearTimeout(esperaAvance);
    esperaAvance = setTimeout(() => {
      api('PUT', '/api/avance', avanceParaServidor()).catch(e =>
        toast('No se guardó tu avance en tu cuenta: ' + e.message)
      );
    }, 600);
  }
  if (esKardex) {
    for (const l of Object.keys(C.levels)) {
      if (fotoGuia(l) === guiaSincronizada[l]) continue;
      guiaSincronizada[l] = fotoGuia(l);
      api('PUT', '/api/catalogo/' + l, { requisitos: state.catalog[l], proceso: state.process[l] })
        .then(() => toast('Guía actualizada para todos los estudiantes.'))
        .catch(e => {
          guiaSincronizada[l] = null;
          toast('No se guardó la guía en el servidor: ' + e.message);
        });
    }
  }
};

/* ---------- Editor: solo con la cuenta de Kardex ---------- */
editorUnlocked = () => esKardex;
editorLock = function () {
  app.innerHTML = `<section class="lock"><div class="lock-icon">🔐</div><span class="eyebrow">Solo personal autorizado</span><h1>Editor de la guía</h1><p class="lead">Esta sección es para el personal de Kardex. Ingresa con tu cuenta para continuar.</p><a class="button primary big" href="/ingresar">Ingresar</a></section>`;
};
adminBar = function () {
  return `<div class="admin-bar no-print"><span>🔓 Editando como ${esc(usuario?.name || '')}. Los cambios se guardan para todos.</span><div class="actions"><a class="button small" href="/panel">Ver panel</a></div></div>`;
};

/* ---------- Inicio: invitación a crear cuenta ---------- */
const inicioOriginal = home;
home = function () {
  inicioOriginal();
  const tira = app.querySelector('.stats-strip');
  if (!tira) return;
  tira.insertAdjacentHTML(
    'afterend',
    usuario
      ? `<div class="callout info compact">👋 Hola, <strong>${esc(usuario.name)}</strong>. Tu avance se guarda en tu cuenta.</div>`
      : `<div class="callout info compact cuenta-aviso">💾 ¿Quieres ver tu avance desde cualquier computadora? <a href="/registro"><strong>Crea tu cuenta gratis</strong></a> o <a href="/ingresar">ingresa</a>.</div>`
  );
};

/* ---------- Cartas: contar cuántas se generan (sin guardar los datos escritos) ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('[data-pdf-letter],[data-print-letter],[data-download-letter]'))
    api('POST', '/api/cartas', { tipo: letterData.type }).catch(() => {});
});

/* ---------- Al abrir la página ---------- */
(async function iniciar() {
  try {
    const guia = await api('GET', '/api/catalogo');
    for (const l of Object.keys(C.levels)) {
      state.catalog[l] = guia.catalog[l] || [];
      state.process[l] = guia.process[l] || '';
      guiaSincronizada[l] = fotoGuia(l);
    }
    if (usuario) {
      const { avance } = await api('GET', '/api/avance');
      if (avance) {
        state = C.validate({ ...state, ...avance, version: 2, mode: 'real' });
        ensureWorkflow();
      } else {
        // Primera vez con cuenta: se sube lo que ya tenía marcado en este navegador.
        await api('PUT', '/api/avance', avanceParaServidor());
      }
    }
    guardarLocal();
    render();
  } catch (e) {
    toast('Sin conexión con el servidor: se usa la guía guardada en este navegador.');
  }
  if (servidor.aviso) toast(servidor.aviso);
})();
