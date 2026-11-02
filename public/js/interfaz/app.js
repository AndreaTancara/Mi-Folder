'use strict';
/* Mi Folder · Aplicación principal
   Estado guardado en el navegador, pantallas (inicio, folder, cartas, guía, editor)
   y manejo de clics, cambios y formularios. Usa FolderCore (core.js). */

/* ---------- Estado y almacenamiento ---------- */
const C = FolderCore,
  KEY = 'mi-folder-v2';
let state = C.seed(),
  storageOK = true,
  search = '',
  filter = 'all',
  opened = new Set();
try {
  const raw = localStorage.getItem(KEY) || localStorage.getItem('mi-folder-v1');
  if (raw) state = C.validate(JSON.parse(raw));
} catch (e) {
  storageOK = false;
}
const app = document.getElementById('app'),
  modal = document.getElementById('modal'),
  form = document.getElementById('reqform');
const esc = v =>
  String(v ?? '').replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
let timer;
function toast(t) {
  document.getElementById('notice').textContent = t;
  clearTimeout(timer);
  timer = setTimeout(() => (document.getElementById('notice').textContent = ''), 6000);
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch (e) {
    storageOK = false;
    toast('No se pudo guardar. Exporta un respaldo antes de cerrar.');
  }
}

/* ---------- Pantallas ---------- */
function banner() {
  return `<div class="callout compact ${state.mode === 'real' ? 'info' : ''}">${state.mode === 'demo' ? '<strong>Modo demostración:</strong> ejemplos ficticios, no realices pagos con ellos.' : 'Según avisos de Kardex de 2026. <strong>Confirma que sigan vigentes.</strong>'}${!storageOK ? ' No se puede guardar en este navegador: exporta un respaldo.' : ''}</div>`;
}
function modes() {
  if (!Object.values(state.demo).some(a => a.length))
    return '<span class="tag">Fuentes facilitadas · octubre 2026</span>';
  return `<div class="segmented" aria-label="Origen de la información"><button data-mode="demo" class="${state.mode === 'demo' ? 'active' : ''}" aria-pressed="${state.mode === 'demo'}">Demostración</button><button data-mode="real" class="${state.mode === 'real' ? 'active' : ''}" aria-pressed="${state.mode === 'real'}">Mi guía real</button></div>`;
}
function home() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">Menos dudas. Un paso a la vez.</div><h1>Tu folder empieza<br>con un paso claro.</h1><p>Te decimos qué documentos necesitas, dónde conseguirlos y cuántos certificados comprar.</p><div class="actions hero-actions no-print"><a class="button primary big" href="#asistente">Empezar mi trámite →</a></div></div><div class="art" aria-hidden="true"><div class="folder orange"></div><div class="folder blue"><span>MI PRÓXIMO PASO</span><strong>Ya sé por<br>dónde empezar.</strong></div><div class="art-badge">✓ A tu ritmo, paso a paso</div></div></section><section class="stats-strip"><div><b data-count="38">38</b><span>requisitos explicados</span></div><div><b data-count="4">4</b><span>folders guiados</span></div><div><b data-count="5">5</b><span>cartas listas para imprimir</span></div><div><b>0</b><span>récords enviados a internet</span></div></section><div class="section-head"><h2>Mis folders</h2>${modes()}</div>${banner()}<section class="cards">${Object.entries(
    C.levels
  )
    .map(([id, l]) => {
      const s = C.stats(state, id);
      return `<a class="card ${l.color}" href="#folder/${id}"><div class="card-top"><div><div class="level">${l.folder}</div><h2>${l.name}</h2></div>${ring(s.percent, '', l.name)}</div><p>${s.total ? s.done + ' de ' + s.total + ' documentos reunidos' : 'Sin requisitos cargados'}</p><span class="card-go">${id.startsWith('crema') ? 'Ver etapa posterior' : 'Iniciar o continuar'} →</span></a>`;
    })
    .join(
      ''
    )}</section><section class="steps"><div class="step"><b>1</b><h3>Elige tu trámite</h3><p>Técnico Superior o Licenciatura.</p></div><div class="step"><b>2</b><h3>Revisa cada requisito</h3><p>Dónde se consigue, cuánto cuesta y qué revisar.</p></div><div class="step"><b>3</b><h3>Marca lo que reúnes</h3><p>Ve lo que te falta e imprime tu lista.</p></div></section>`;
  animateCounts(app);
}
function folder() {
  if (!workflowGate(state.level)) return;
  const l = C.levels[state.level],
    s = C.stats(state);
  app.style.setProperty(
    '--accent',
    l.color === 'blue' ? '#2669bd' : l.color === 'orange' ? '#b85b16' : '#8c702a'
  );
  app.innerHTML = `<a class="back" href="#inicio">← Mis folders</a><div class="page-title"><div><span class="eyebrow">${l.folder}</span><h1>${l.name}</h1></div></div><p class="print-head">Lista personal · ${new Date().toLocaleDateString('es-BO')} · ${s.done} de ${s.total} marcados</p>${banner()}<div class="section-head no-print"><h2>Mis documentos</h2>${modes()}</div><div class="workspace"><section><div class="toolbar no-print"><input id="search" type="search" aria-label="Buscar documento" placeholder="Buscar un documento…" value="${esc(search)}"><select id="filter" aria-label="Filtrar documentos"><option value="all">Todos</option><option value="pending">Pendientes</option><option value="done">Reunidos</option></select></div><div id="requirements"></div></section><aside><div class="panel"><span class="eyebrow">Tu avance</span><div class="aside-ring">${ring(s.percent, 'lg')}<p class="muted"><strong>${s.done} de ${s.total}</strong> reunidos${s.excluded ? `<br>${s.excluded} no aplican a tu caso` : ''}</p></div><h3>👉 Tu siguiente paso</h3><p class="next-step">${esc(!s.total ? 'Incorpora los requisitos contrastados con Kardex desde el editor.' : s.done === s.total ? '¡Todo marcado! Revisa el orden y llévalo a Kardex.' : C.applicable(state).find(r => !state.progress[C.key(state, r.id)]).title)}</p><button class="small" data-reset>Reiniciar avance</button></div><div class="panel"><h3>Después de preparar</h3><p style="white-space:pre-line">${esc(state.mode === 'demo' ? '1. Revisar la carpeta.\n2. Consultar el lugar de recepción.\n3. Atender observaciones.' : state.process[state.level] || 'Pendiente de confirmar con Kardex. No se han informado oficinas, plazos ni etapas oficiales.')}</p></div></aside></div>`;
  document.getElementById('filter').value = filter;
  list();
  workflowPanel();
  animateCounts(app);
}
// Requisitos que son una carta: llevan al generador con esa carta ya elegida.
const letterFor = {
  azul_carta: 'cert_ts',
  naranja_carta: 'cert_lic',
  azul_resolucion: 'res_ts',
  cts_carta: 'mod_ts',
  cl_carta: 'mod_lic'
};
function letterTool(r) {
  const type = letterFor[r.id];
  if (!type) return '';
  return `<div class="req-tool no-print"><span>✍️ Llena tus datos y descarga esta carta lista para firmar.</span><a class="button small primary" href="#cartas/${type}">Generar mi carta →</a></div>`;
}
// Plan de estudios: se indica cuál pedir en Kardex según lo leído en el récord.
function planText(plans) {
  if (!plans || !plans.length) return '';
  if (plans.length === 1)
    return `Según tu récord, tu plan de estudios es el ${plans[0]}. Pide su fotocopia legalizada en Kardex.`;
  const last = plans[plans.length - 1];
  return `Según tu récord, cursaste con los planes ${plans.slice(0, -1).join(', ')} y ${last}. Pide en Kardex una fotocopia legalizada de cada uno.`;
}
function planTool(r) {
  if (!/^(azul|naranja)_plan$/.test(r.id)) return '';
  const plans = state.workflow?.[state.level]?.purchase?.plans;
  return plans && plans.length
    ? `<div class="req-tool no-print"><span>📘 ${esc(planText(plans))}</span></div>`
    : `<div class="req-tool no-print"><span>📘 ¿Qué plan te corresponde? Aparece en tu récord. Súbelo en <strong>Certificados de calificaciones</strong> y te lo mostramos.</span><a class="button small" href="#calculadora">Subir mi récord</a></div>`;
}
function list() {
  const all = C.items(state),
    visible = all.filter(
      r =>
        r.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (filter === 'all' || !!state.progress[C.key(state, r.id)] === (filter === 'done'))
    );
  document.getElementById('requirements').innerHTML = !all.length
    ? '<div class="empty"><h3>Tu guía real está por comenzar</h3><p>Agrega los requisitos de la lista oficial y dónde obtenerlos.</p><a class="button primary" href="#editor">Cargar requisitos</a></div>'
    : !visible.length
      ? '<div class="empty"><h3>No hay documentos en este filtro</h3><p>Prueba otra búsqueda o selecciona Todos.</p></div>'
      : visible
          .map(
            r =>
              `<article class="requirement"><div class="requirement-head"><input type="checkbox" ${r.condition && state.excluded[C.key(state, r.id)] ? 'disabled' : ''} id="check-${r.id}" data-check="${r.id}" ${state.progress[C.key(state, r.id)] ? 'checked' : ''}><label for="check-${r.id}"><strong>${esc(r.title)}</strong><span class="chips"><span class="chip">📍 ${esc(r.where)}</span>${state.mode === 'demo' ? '<span class="tag">Ejemplo ficticio</span>' : r.verified ? '<span class="tag ok">✓ Contrastado</span>' : ''}</span></label><button class="small" data-details="${r.id}" aria-expanded="${opened.has(r.id)}" aria-controls="details-${r.id}">${opened.has(r.id) ? 'Ocultar' : 'Ver más'}</button></div>${/^(azul|naranja)_notas$/.test(r.id) && !state.level.startsWith('crema') ? `<div class="req-tool no-print">${state.workflow?.[state.level]?.purchase ? `<span>✅ Ya calculaste: <strong>${state.workflow[state.level].purchase.quantity} certificados</strong> · cómpralos en venta de valores</span><a class="button small" href="#calculadora">Volver a calcular</a>` : `<span>🧮 ¿Cuántos certificados compras? Sube tu récord y te lo calculamos.</span><a class="button small primary" href="#calculadora">Calcular con mi récord →</a>`}</div>` : ''}${letterTool(r)}${planTool(r)}${r.condition ? `<div class="condition"><strong>Solo si:</strong> ${esc(r.condition)}<label class="inline"><input type="checkbox" data-exclude="${r.id}" ${state.excluded[C.key(state, r.id)] ? 'checked' : ''}> No es mi caso <small class="muted">(si dudas, pregunta en Kardex)</small></label></div>` : ''}<div class="details" id="details-${r.id}" ${opened.has(r.id) ? '' : 'hidden'}><div class="example" data-example="${r.id}"></div><dl><dt>📄 Para qué sirve</dt><dd>${esc(r.description)}</dd><dt>📍 Dónde conseguirlo</dt><dd>${esc(r.where)}</dd><dt>🛠️ Cómo hacerlo</dt><dd>${esc(r.how)}</dd><dt>⏱ Tiempo</dt><dd>${esc(r.time || 'Por confirmar')}</dd><dt>⚠️ Ojo antes de incluirlo</dt><dd>${esc(r.check)}</dd></dl><div class="source">Fuente: ${esc(r.source)} · ${esc(r.date)}</div></div></article>`
          )
          .join('');
  fillExamples();
}
function editor() {
  const items = state.catalog[state.level];
  app.innerHTML = `${adminBar()}<a class="back" href="#inicio">← Volver</a><div class="page-title"><div><span class="eyebrow">Solo personal de Kardex</span><h1>Editor de la guía</h1></div><div class="actions"><button data-export>Exportar respaldo</button><button data-import>Importar respaldo</button><input id="import-file" type="file" accept="application/json,.json" hidden></div></div><div class="callout info"><strong>Los cambios se guardan en la base de datos</strong> y todos los estudiantes ven la guía actualizada al abrir la página.</div><div class="panel"><label for="editor-level">Folder que vas a editar</label><select id="editor-level"><option value="azul">Folder azul · Técnico Superior</option><option value="naranja">Folder naranja · Licenciatura</option><option value="crema_ts">Folder crema · Técnico Superior</option><option value="crema_lic">Folder crema · Licenciatura</option></select><div class="section-head"><h2>Requisitos reales (${items.length})</h2><button class="primary" data-add>+ Agregar requisito</button></div><p class="muted">Usa la lista vigente. Incluye la fuente. Las flechas definen el orden de la carpeta.</p><div class="callout info compact">📷 Usa <strong>Imagen</strong> para subir un ejemplo de cada documento. Usa documentos <strong>sin datos personales reales</strong> (tapa nombres y números). Se guardan en este navegador; para que se vean en todas las computadoras copia la imagen en la carpeta <code>public/ejemplos/</code> del proyecto con el nombre que indica cada requisito.</div>${items.length ? items.map((r, i) => `<div class="editor-row"><div><strong>${i + 1}. ${esc(r.title)}</strong><span class="tag">${r.verified ? 'Contrastado por editor local' : 'Fuente indicada · confirmar vigencia'}</span> <span class="tag">archivo: ejemplos/${esc(r.id)}.jpg</span></div><div class="actions"><button class="small" data-move="${r.id}" data-dir="-1" aria-label="Subir ${esc(r.title)}" ${i === 0 ? 'disabled' : ''}>↑</button><button class="small" data-move="${r.id}" data-dir="1" aria-label="Bajar ${esc(r.title)}" ${i === items.length - 1 ? 'disabled' : ''}>↓</button><button class="small" data-img-pick="${r.id}">📷 Imagen</button><button class="small" data-edit="${r.id}">Editar</button><button class="small danger" data-delete="${r.id}">Eliminar</button></div></div>`).join('') : '<div class="empty"><h3>Aún no hay requisitos reales</h3><p>La demostración permanece separada de esta guía.</p></div>'}</div><form id="process-form" class="panel"><h2>¿Qué sigue después?</h2><label for="process">Etapas, lugares, fuente y fecha de consulta</label><textarea id="process" maxlength="6000" rows="6" placeholder="Completar solo con información confirmada por Kardex.">${esc(state.process[state.level])}</textarea><p class="muted">Incluye fuente y fecha. Si desconoces el proceso, deja el campo vacío.</p><button class="primary">Guardar proceso</button></form><a class="button" data-open-real href="#folder/${state.level}">Ver mi guía real →</a>`;
  document.getElementById('editor-level').value = state.level;
}
function guide() {
  app.innerHTML = `<div class="guide"><span class="eyebrow">Ayuda</span><h1>Preguntas frecuentes</h1><p class="lead">Las dudas que más llegan a Kardex, respondidas en corto.</p>${faqHTML()}<div class="panel note"><strong>Importante:</strong> Mi Folder es una guía de apoyo. La revisión y aprobación oficial siempre la hace Kardex.</div><div class="actions"><a class="button primary" href="#asistente">Empezar mi trámite →</a><a class="button" href="#editor">🔐 Acceso Kardex</a></div><div class="panel privacy"><h2>🔒 Tus datos están protegidos</h2><ul><li>Tu récord se lee en tu equipo y <strong>nunca se envía a internet</strong> ni se guarda.</li><li>Los datos de tu carta se borran al cerrar la página.</li><li>Sin cuenta, tu avance se guarda solo en este navegador. Con tu cuenta, se guarda en Mi Folder y solo tú lo ves.</li></ul><p class="muted">¿Usaste una computadora compartida (feria, laboratorio, Kardex)? Borra tu avance antes de irte.</p><button class="danger" data-wipe>Borrar mis datos de este equipo</button></div></div>`;
}

/* ---------- Enrutador: muestra la pantalla según el #hash ---------- */
function render() {
  app.style.removeProperty('--accent');
  const route = location.hash.slice(1) || 'inicio',
    id = route.split('/')[1];
  if (route.startsWith('folder/') && Object.hasOwn(C.levels, id)) {
    state.level = id;
    save();
    folder();
  } else if (route === 'editor') {
    if (editorUnlocked()) editor();
    else editorLock();
  } else if (route === 'guia') guide();
  else if (route === 'asistente') wizard();
  else if (route === 'calculadora') calculator();
  else if (route === 'cartas' || route.startsWith('cartas/')) letters(id);
  else home();
}

/* ---------- Editor de la guía ---------- */
function edit(id) {
  form.reset();
  const r = state.catalog[state.level].find(x => x.id === id);
  for (const f of [
    'id',
    'title',
    'description',
    'where',
    'how',
    'cost',
    'time',
    'check',
    'condition',
    'source',
    'date'
  ])
    form.elements[f].value = r ? r[f] : f === 'date' ? new Date().toISOString().slice(0, 10) : '';
  form.elements.verified.checked = !!r?.verified;
  document.getElementById('mtitle').textContent = r ? 'Editar requisito' : 'Nuevo requisito';
  modal.showModal();
}

/* ---------- Eventos de la interfaz ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button,a');
  if (!b) return;
  const d = b.dataset;
  if (d.mode) {
    state.mode = d.mode;
    search = '';
    filter = 'all';
    opened.clear();
    save();
    render();
  } else if ('details' in d) {
    opened.has(d.details) ? opened.delete(d.details) : opened.add(d.details);
    list();
  } else if ('print' in d) {
    search = '';
    filter = 'all';
    folder();
    window.print();
  } else if ('reset' in d) {
    if (confirm('¿Reiniciar las marcas de este folder y modo? Se conservan los requisitos.')) {
      C.items(state).forEach(r => delete state.progress[C.key(state, r.id)]);
      save();
      render();
    }
  } else if ('export' in d) {
    const url = URL.createObjectURL(
        new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      ),
      a = document.createElement('a');
    a.href = url;
    a.download = 'mi-folder-respaldo.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Respaldo preparado. Conserva el archivo descargado.');
  } else if ('import' in d) document.getElementById('import-file').click();
  else if ('add' in d) {
    if (state.catalog[state.level].length >= 100) toast('Máximo 100 requisitos por folder.');
    else edit();
  } else if ('edit' in d) edit(d.edit);
  else if ('close' in d) modal.close();
  else if ('delete' in d) {
    if (confirm('¿Eliminar este requisito de la guía? Dejará de verse para todos.')) {
      state.catalog[state.level] = state.catalog[state.level].filter(r => r.id !== d.delete);
      delete state.progress['real:' + state.level + ':' + d.delete];
      save();
      render();
    }
  } else if ('move' in d) {
    const l = state.catalog[state.level],
      i = l.findIndex(r => r.id === d.move),
      j = i + Number(d.dir);
    if (j >= 0 && j < l.length) {
      [l[i], l[j]] = [l[j], l[i]];
      save();
      render();
    }
  } else if ('openReal' in d) {
    state.mode = 'real';
    save();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'search') {
    search = e.target.value;
    list();
  }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.exclude) {
    state.excluded[C.key(state, el.dataset.exclude)] = el.checked;
    save();
    folder();
  } else if (el.dataset.check) {
    state.progress[C.key(state, el.dataset.check)] = el.checked;
    save();
    folder();
  } else if (el.id === 'filter') {
    filter = el.value;
    list();
  } else if (el.id === 'editor-level') {
    state.level = el.value;
    save();
    editor();
  } else if (el.id === 'import-file' && el.files[0]) {
    try {
      if (el.files[0].size > 1000000) throw Error('El archivo supera 1 MB.');
      const next = C.validate(JSON.parse(await el.files[0].text()));
      if (confirm('La importación reemplazará guía y avance locales. ¿Continuar?')) {
        state = next;
        save();
        render();
        toast('Respaldo importado.');
      }
    } catch (err) {
      toast('No se importó: ' + err.message);
    }
    el.value = '';
  }
});
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(form),
    r = {};
  for (const f of [
    'id',
    'title',
    'description',
    'where',
    'how',
    'cost',
    'time',
    'check',
    'condition',
    'source',
    'date'
  ])
    r[f] = String(data.get(f) || '').trim();
  if (['title', 'description', 'where', 'how', 'check', 'source', 'date'].some(f => !r[f]))
    return toast('Completa los campos obligatorios.');
  r.id = r.id || 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  r.verified = form.elements.verified.checked;
  const l = state.catalog[state.level],
    i = l.findIndex(x => x.id === r.id);
  i < 0 ? l.push(r) : l.splice(i, 1, r);
  save();
  modal.close();
  editor();
  toast('Requisito guardado.');
});
document.addEventListener('submit', e => {
  if (e.target.id === 'process-form') {
    e.preventDefault();
    state.process[state.level] = document.getElementById('process').value.trim();
    save();
    toast('Proceso guardado.');
  }
});
window.addEventListener('hashchange', () => {
  if (!location.hash.startsWith('#calculadora')) clearRecord();
  search = '';
  filter = 'all';
  opened.clear();
  render();
  window.scrollTo(0, 0);
});
render();
