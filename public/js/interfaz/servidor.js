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
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrf
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (r.status === 419) throw Error('La sesión expiró. Recarga la página.');
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw Error(data.message || 'Error del servidor (' + r.status + ').');
  }
  return r.json();
}

/* ---------- Computadora compartida: cada persona ve solo su avance ---------- */
// El navegador recuerda de quién es el avance guardado ('' = sin cuenta, 'u5' = cuenta 5).
// Si cerró sesión o entra otra cuenta, se borra el avance anterior de este navegador.
// Excepción: si alguien avanzó sin cuenta y luego crea/inicia su cuenta, su avance se conserva.
const DUENO = 'mi-folder-dueno',
  yo = usuario ? 'u' + usuario.id : '';
function leerDueno() {
  try {
    return localStorage.getItem(DUENO);
  } catch (e) {
    return null;
  }
}
const duenoAnterior = leerDueno();
if (
  servidor.salio ||
  (duenoAnterior !== null && duenoAnterior !== yo && !(duenoAnterior === '' && usuario))
) {
  const catalogo = state.catalog,
    procesos = state.process;
  state = C.seed();
  state.catalog = catalogo;
  state.process = procesos;
  save();
  render();
}
try {
  localStorage.setItem(DUENO, yo);
} catch (e) {}

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
    workflow: state.workflow,
    dates: state.dates
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
      api('PUT', '/api/catalogo/' + l, {
        requisitos: state.catalog[l],
        proceso: state.process[l]
      })
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
  const accion = usuario
    ? `<p class="lead">Tu cuenta es de estudiante, así que no puede editar la guía.</p><a class="button primary big" href="#inicio">Volver a mis folders</a>`
    : `<p class="lead">Esta sección es para el personal de Kardex. Ingresa con tu cuenta para continuar.</p><a class="button primary big" href="/ingresar">Ingresar</a>`;
  app.innerHTML = `<section class="lock"><div class="lock-icon">🔐</div><span class="eyebrow">Solo personal autorizado</span><h1>Editor de la guía</h1>${accion}</section>`;
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
    esKardex
      ? `<div class="callout info compact">🗂️ Estás como <strong>personal de Kardex</strong>. <a href="/panel">Ver panel</a> o <a href="#editor">editar la guía</a>.</div>`
      : usuario
        ? `<div class="callout info compact">👋 Hola, <strong>${esc(usuario.name)}</strong>. Tu avance se guarda en tu cuenta.</div>`
        : `<div class="callout info compact cuenta-aviso">💾 ¿Quieres ver tu avance desde cualquier computadora? <a href="/registro"><strong>Crea tu cuenta gratis</strong></a> o <a href="/ingresar">ingresa</a>.</div>`
  );
};

/* ---------- Acto de colación: días que faltan para presentar documentos ---------- */
let colacion = null,
  pausa = null;
function avisoColacion() {
  if (!colacion?.fecha || esKardex) return '';
  const hoy = C.today();
  if (colacion.fecha < hoy) return '';
  const dias = Math.round((Date.parse(colacion.fecha) - Date.parse(hoy)) / 86400000),
    cuando =
      dias === 0
        ? '<strong>¡Hoy es el último día!</strong>'
        : `faltan <strong>${dias} ${dias === 1 ? 'día' : 'días'}</strong>`;
  return `<div class="aviso-colacion">🎓 ${esc(colacion.texto || 'Acto de colación')}: presenta tus documentos hasta el ${fmtDate(colacion.fecha)} (${cuando}).</div>`;
}
const inicioConCuenta = home;
home = function () {
  inicioConCuenta();
  app.insertAdjacentHTML('afterbegin', avisoColacion());
};

/* ---------- Folder: aviso de colación y "¿Pausaste tu trámite?" ---------- */
const folderOriginal = folder;
folder = function () {
  folderOriginal();
  if (!app.querySelector('.workspace')) return;
  app.querySelector('.back')?.insertAdjacentHTML('afterend', avisoColacion());
  if (!usuario || esKardex || state.mode !== 'real') return;
  const motivos = Object.entries(servidor.motivos || {})
    .map(([k, t]) => `<option value="${k}">${esc(t)}</option>`)
    .join('');
  app
    .querySelector('.workspace aside')
    ?.insertAdjacentHTML(
      'beforeend',
      pausa
        ? `<div class="panel pausa-tramite no-print"><h3>⏸️ Trámite en pausa</h3><p class="muted">Motivo: ${esc(pausa.motivo)}<br>Desde el ${fmtDate(pausa.desde)}</p><button class="small primary" data-retomar>Retomar mi trámite</button></div>`
        : `<details class="panel pausa-tramite no-print"><summary><strong>¿Pausaste tu trámite?</strong></summary><p class="muted">Cuéntale a Kardex por qué. Así pueden ayudarte o mejorar el proceso.</p><form id="pausa-form"><select name="motivo" required><option value="">Elige un motivo…</option>${motivos}</select><textarea name="detalle" maxlength="500" rows="3" placeholder="Detalle (opcional)"></textarea><button class="small">Avisar a Kardex</button></form></details>`
    );
};
async function registrarSeguimiento(datos) {
  try {
    ({ pausa } = await api('POST', '/api/seguimiento', datos));
    toast(
      pausa
        ? 'Gracias por avisar. Cuando quieras seguir, presiona "Retomar".'
        : '¡Bien! Tu trámite sigue en marcha.'
    );
    folder();
  } catch (e) {
    toast('No se pudo enviar: ' + e.message);
  }
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'pausa-form') return;
  e.preventDefault();
  const d = new FormData(e.target);
  registrarSeguimiento({
    motivo: d.get('motivo'),
    detalle: String(d.get('detalle') || '').trim() || null
  });
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-retomar]')) registrarSeguimiento({ motivo: 'retomado' });
});

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
    colacion = guia.colacion || null;
    if (usuario) {
      const respuesta = await api('GET', '/api/avance'),
        avance = respuesta.avance;
      pausa = respuesta.pausa;
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
