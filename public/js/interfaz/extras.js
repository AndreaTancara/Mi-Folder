'use strict';
/* Mi Folder · Asistente paso a paso, contador animado, anillos de progreso y preguntas frecuentes.
   Usa las mismas reglas de core.js; no cambia cómo se guardan los datos. */

/* ---------- Anillo de progreso ---------- */
function ring(percent, size = '', label = '') {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  return `<div class="ring ${size}" data-percent="${p}" style="--p:${p}" role="img" aria-label="${p}% ${label || 'completado'}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle class="ring-bg" cx="18" cy="18" r="15.9"/><circle class="ring-fg" cx="18" cy="18" r="15.9" pathLength="100"/></svg><span><b data-count="${p}">${p}</b>%</span></div>`;
}

/* ---------- Números que corren ---------- */
function animateCounts(scope = document) {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scope.querySelectorAll('[data-count]').forEach(el => {
    const end = Number(el.dataset.count) || 0;
    if (reduce || !end) {
      el.textContent = end.toLocaleString('es-BO');
      return;
    }
    const dur = Math.min(1400, 500 + end * 12),
      t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / dur),
        v = Math.round(end * (1 - Math.pow(1 - k, 3)));
      el.textContent = v.toLocaleString('es-BO');
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  });
}

/* ---------- Resultado de certificados ----------
   Al estudiante solo se le muestra cuántos comprar y dónde.
   La regla de cálculo es interna de Kardex y vive en core.js (estimate). */
function purchaseResult(quantity) {
  return `<strong class="purchase-big"><b data-count="${quantity}">${quantity}</b> certificados de calificaciones</strong>
  <p class="calc-where">📍 Cómpralos en la <strong>ventanilla de venta de valores</strong> (donde se compran timbres).</p>`;
}

/* ---------- Asistente paso a paso ---------- */
let wiz = { step: 1, level: null };
function wizard() {
  ensureWorkflow();
  const dots = [1, 2, 3].map(n => `<span class="${n <= wiz.step ? 'on' : ''}"></span>`).join('');
  let body = '';
  if (wiz.step === 1) {
    body = `<h1>¿Qué título vas a tramitar?</h1><p class="lead">Elige una opción. Puedes cambiarla después.</p>
    <div class="choices">
      <button class="choice blue" data-wiz-level="azul"><span class="emoji">🎓</span><strong>Técnico Superior</strong><small>Folder azul · necesitas octavo completo</small></button>
      <button class="choice orange" data-wiz-level="naranja"><span class="emoji">🏛️</span><strong>Licenciatura</strong><small>Folder naranja · necesitas décimo completo</small></button>
    </div>`;
  } else if (wiz.step === 2) {
    const w = state.workflow[wiz.level],
      name = wiz.level === 'azul' ? 'azul' : 'naranja';
    body = `<h1>¿En qué parte vas?</h1><p class="lead">Así te mostramos solo lo que necesitas ahora.</p>
    <div class="choices">
      <button class="choice" data-wiz-stage="start"><span class="emoji">🚀</span><strong>Recién empiezo</strong><small>Veo los requisitos del folder ${name}</small></button>
      <button class="choice" data-wiz-stage="delivered"><span class="emoji">📦</span><strong>Ya entregué mi folder</strong><small>Registro la entrega y la devolución</small></button>
      <button class="choice cream" data-wiz-stage="cream" ${w.returned ? '' : 'disabled'}><span class="emoji">📜</span><strong>Kardex me lo devolvió</strong><small>${w.returned ? 'Preparo el folder crema' : 'Disponible cuando registres la devolución'}</small></button>
    </div>
    <button class="link" data-wiz-back>← Volver</button>`;
  } else {
    const base = wiz.level,
      w = state.workflow[base],
      cream = base === 'azul' ? 'crema_ts' : 'crema_lic',
      target = w.returned ? cream : base;
    const s = C.stats(state, target),
      next = C.applicable(state, target).find(r => !state.progress[C.key(state, r.id, target)]);
    body = `<h1>Tu siguiente paso</h1>
    <div class="next-card">
      ${ring(s.percent, 'lg')}
      <div><span class="eyebrow">${C.levels[target].folder}</span>
      <h2>${next ? esc(next.title) : '¡Tienes todo marcado!'}</h2>
      <p class="muted">${next ? `Te faltan ${s.total - s.done} de ${s.total} documentos.` : 'Revisa el orden y llévalo a Kardex.'}</p>
      <a class="button primary big" href="#folder/${target}">Ver mis documentos →</a></div>
    </div>
    <button class="link" data-wiz-back>← Volver</button>`;
  }
  app.innerHTML = `<section class="wizard"><div class="wiz-dots" aria-label="Paso ${wiz.step} de 3">${dots}</div>${body}</section>`;
  app.classList.remove('page-in');
  void app.offsetWidth;
  app.classList.add('page-in');
  animateCounts(app);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-wiz-level],[data-wiz-stage],[data-wiz-back]');
  if (!b) return;
  const d = b.dataset;
  if (d.wizLevel) {
    wiz = { step: 2, level: d.wizLevel };
    state.level = d.wizLevel;
    save();
  } else if (d.wizStage) {
    if (d.wizStage === 'start') {
      location.hash = 'folder/' + wiz.level;
      return;
    }
    if (d.wizStage === 'delivered') {
      location.hash = 'folder/' + wiz.level;
      return;
    }
    wiz.step = 3;
  } else if ('wizBack' in d) wiz.step = Math.max(1, wiz.step - 1);
  wizard();
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#asistente') wiz = { step: 1, level: null };
});

/* ---------- Preguntas frecuentes ---------- */
const faqs = [
  [
    '¿Por dónde empiezo?',
    'Entra a <a href="#asistente">Empezar mi trámite</a>. Te hace dos preguntas y te muestra solo lo que necesitas.'
  ],
  [
    '¿Qué necesito para iniciar?',
    'Técnico Superior: octavo semestre completo y sus folios. Licenciatura: décimo semestre completo y sus folios. Kardex revisa tu plan de estudios.'
  ],
  [
    '¿Cuántos certificados de calificaciones compro?',
    'En tus documentos, abre el requisito <strong>Certificados de calificaciones</strong> y sube tu récord: Mi Folder te dice la cantidad exacta.'
  ],
  [
    '¿Dónde los compro?',
    'En la ventanilla de venta de valores, donde se compran timbres. Ahí también se compra el juego de 4 certificados de conclusión de estudios.'
  ],
  [
    '¿Qué récord debo subir?',
    'El récord académico de asignaturas aprobadas en PDF digital original. No sirve el historial, fotos ni escaneos.'
  ],
  ['¿Mi récord se envía a internet?', 'No. Se lee en tu propio equipo y no se guarda.'],
  [
    '¿Cuándo preparo el folder crema?',
    'Después de entregar el folder azul o naranja y de que Kardex te lo devuelva revisado.'
  ],
  [
    '¿El 100 % significa que ya está aprobado?',
    'No. Solo indica que marcaste todo. La revisión oficial la hace Kardex.'
  ],
  [
    '¿Cómo guardo mi avance?',
    'Crea tu cuenta en <a href="/registro">Registrarme</a>: tu avance se guarda y lo ves desde cualquier equipo. Sin cuenta, se guarda solo en este navegador.'
  ]
];
function faqHTML() {
  return `<div class="faq">${faqs.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`;
}

/* ---------- Acceso del personal de Kardex al editor ----------
   Página sin servidor: esta clave evita cambios casuales en un equipo compartido,
   pero no es una seguridad fuerte. Cada navegador guarda su propia copia de la guía. */
const ADMIN_KEY = 'mi-folder-admin',
  ADMIN_SALT = 'mifolder-salt:',
  ADMIN_DEFAULT = 'b4d18ed8864a72ea8a54649615d3b468268c24af6b8a7f3ad18692ea0c17caf8';
async function sha(text) {
  if (!window.crypto || !crypto.subtle)
    throw Error('Este navegador no permite verificar la clave. Abre la página en Chrome o Edge.');
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ADMIN_SALT + text));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function adminHash() {
  try {
    return localStorage.getItem(ADMIN_KEY) || ADMIN_DEFAULT;
  } catch (e) {
    return ADMIN_DEFAULT;
  }
}
function editorUnlocked() {
  try {
    return sessionStorage.getItem(ADMIN_KEY) === '1';
  } catch (e) {
    return false;
  }
}
function editorLock() {
  app.innerHTML = `<section class="lock"><div class="lock-icon">🔐</div><span class="eyebrow">Solo personal autorizado</span><h1>Editor de la guía</h1><p class="lead">Esta sección es para el personal de Kardex. Ingresa la clave para continuar.</p><form id="admin-form" class="panel lock-form"><label for="admin-pass">Clave de acceso</label><input id="admin-pass" type="password" autocomplete="current-password" required><button class="primary">Entrar</button><p id="admin-msg" class="muted" role="status"></p></form><div class="panel"><h3>¿Eres estudiante?</h3><p class="muted">Para pasar tu avance a otro equipo usa el respaldo:</p><div class="actions"><button data-export>Exportar mi respaldo</button><button data-import>Importar respaldo</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></div></section>`;
  setTimeout(() => document.getElementById('admin-pass')?.focus(), 50);
}
function adminBar() {
  return `<div class="admin-bar no-print"><span>🔓 Sesión de editor abierta</span><div class="actions"><button class="small" data-admin-pass>Cambiar clave</button><button class="small" data-admin-out>Cerrar sesión</button></div></div>`;
}
document.addEventListener('submit', async e => {
  if (e.target.id !== 'admin-form') return;
  e.preventDefault();
  const msg = document.getElementById('admin-msg');
  try {
    const h = await sha(document.getElementById('admin-pass').value);
    if (h === adminHash()) {
      sessionStorage.setItem(ADMIN_KEY, '1');
      render();
      toast('Sesión de editor abierta.');
    } else {
      msg.textContent = 'Clave incorrecta.';
      e.target.classList.remove('shake');
      void e.target.offsetWidth;
      e.target.classList.add('shake');
    }
  } catch (err) {
    msg.textContent = err.message;
  }
});
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-admin-out],[data-admin-pass],[data-wipe]');
  if (!b) return;
  if ('adminOut' in b.dataset) {
    try {
      sessionStorage.removeItem(ADMIN_KEY);
    } catch (err) {}
    location.hash = 'inicio';
    toast('Sesión de editor cerrada.');
  } else if ('adminPass' in b.dataset) {
    const p = prompt('Nueva clave (mínimo 6 caracteres):');
    if (p === null) return;
    if (p.length < 6) return toast('La clave debe tener al menos 6 caracteres.');
    if (prompt('Repite la nueva clave:') !== p) return toast('Las claves no coinciden.');
    try {
      localStorage.setItem(ADMIN_KEY, await sha(p));
      toast('Clave cambiada en este navegador.');
    } catch (err) {
      toast('No se pudo cambiar la clave: ' + err.message);
    }
  } else if ('wipe' in b.dataset) {
    if (
      !confirm(
        '¿Borrar tu avance, tus marcas y el estado de tu trámite en este equipo? La guía de requisitos se conserva.'
      )
    )
      return;
    state.progress = {};
    state.excluded = {};
    state.workflow = {};
    ensureWorkflow();
    save();
    if (typeof letterData !== 'undefined') {
      letterData.name = letterData.ci = letterData.ru = letterData.semester = letterData.phone = '';
    }
    toast('Tus datos se borraron de este equipo.');
  }
});

/* ---------- Imágenes de ejemplo de cada documento ----------
   Dos formas de tenerlas:
   1) El personal de Kardex las sube desde el editor (con clave). Quedan guardadas en este navegador.
   2) Para que salgan en cualquier computadora: copiar la imagen en la carpeta public/ejemplos/
      con el nombre del requisito, por ejemplo  ejemplos/azul_ci.jpg  (el editor muestra el nombre). */
const IMG_DB = 'mi-folder-imagenes';
function imgDB() {
  return new Promise((ok, fail) => {
    if (!window.indexedDB) return fail(Error('Este navegador no permite guardar imágenes.'));
    const r = indexedDB.open(IMG_DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('ejemplos');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => fail(r.error || Error('No se pudo abrir el almacén de imágenes.'));
  });
}
async function imgGet(id) {
  try {
    const db = await imgDB();
    return await new Promise(ok => {
      const q = db.transaction('ejemplos').objectStore('ejemplos').get(id);
      q.onsuccess = () => ok(q.result || null);
      q.onerror = () => ok(null);
    });
  } catch (e) {
    return null;
  }
}
async function imgSet(id, val) {
  const db = await imgDB();
  await new Promise((ok, fail) => {
    const t = db.transaction('ejemplos', 'readwrite');
    val ? t.objectStore('ejemplos').put(val, id) : t.objectStore('ejemplos').delete(id);
    t.oncomplete = ok;
    t.onerror = () => fail(t.error);
  });
}
function shrink(file) {
  return new Promise((ok, fail) => {
    if (!/^image\//.test(file.type)) return fail(Error('Elige una imagen (JPG o PNG).'));
    if (file.size > 15e6) return fail(Error('La imagen supera 15 MB.'));
    const url = URL.createObjectURL(file),
      im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1400 / Math.max(im.width, im.height)),
        c = document.createElement('canvas');
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      const x = c.getContext('2d');
      x.fillStyle = '#fff';
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.82));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      fail(Error('No se pudo leer la imagen.'));
    };
    im.src = url;
  });
}
function exampleHTML(src, title) {
  return `<figure class="example-fig"><figcaption>📷 Así se ve este documento</figcaption><button type="button" class="example-open" data-zoom><img src="${src}" alt="Ejemplo de ${esc(title)}" loading="lazy"></button><small class="muted">Ejemplo referencial. Toca la imagen para verla grande.</small></figure>`;
}
async function fillExamples() {
  for (const box of document.querySelectorAll('[data-example]')) {
    if (box.dataset.done || box.closest('[hidden]')) continue;
    box.dataset.done = '1';
    const id = box.dataset.example,
      r = C.items(state).find(x => x.id === id),
      title = r ? r.title : '';
    const saved = await imgGet(id);
    if (saved) {
      box.innerHTML = exampleHTML(saved, title);
      continue;
    }
    const probe = new Image();
    probe.onload = () => {
      box.innerHTML = exampleHTML(probe.src, title);
    };
    probe.src = 'ejemplos/' + encodeURIComponent(id) + '.jpg';
  }
}
document.addEventListener('click', async e => {
  const z = e.target.closest('[data-zoom]');
  if (z) {
    const img = z.querySelector('img');
    const o = document.createElement('div');
    o.className = 'lightbox';
    o.innerHTML = `<img src="${img.src}" alt="${esc(img.alt)}"><button type="button" aria-label="Cerrar">✕</button>`;
    o.addEventListener('click', () => o.remove());
    document.body.appendChild(o);
    return;
  }
  const pick = e.target.closest('[data-img-pick]');
  if (pick) {
    if (!editorUnlocked()) return;
    const id = pick.dataset.imgPick,
      has = !!(await imgGet(id));
    if (
      has &&
      confirm('Este requisito ya tiene imagen. ¿Quieres QUITARLA? (Cancelar para reemplazarla)')
    ) {
      await imgSet(id, null);
      toast('Imagen quitada.');
      return;
    }
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = async () => {
      try {
        const f = inp.files[0];
        if (!f) return;
        await imgSet(id, await shrink(f));
        toast(
          'Imagen guardada. Para otras computadoras copia el archivo como ejemplos/' + id + '.jpg'
        );
      } catch (err) {
        toast('No se guardó: ' + err.message);
      }
    };
    inp.click();
  }
});
const closeLightbox = () => document.querySelectorAll('.lightbox').forEach(x => x.remove());
window.addEventListener('hashchange', closeLightbox);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});
