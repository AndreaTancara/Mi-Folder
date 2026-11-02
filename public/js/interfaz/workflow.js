'use strict';
/* Mi Folder · Flujo del trámite
   Orden de las etapas (folder base → folder crema), lectura del récord en PDF
   y contador de certificados de calificaciones. */

/* ---------- Estado del récord cargado ---------- */
let recordAnalysis = null,
  uploadEpoch = 0;
function clearRecord() {
  recordAnalysis = null;
  uploadEpoch++;
}

/* ---------- Etapas del trámite ---------- */
function parentLevel(level) {
  return level === 'azul' || level === 'crema_ts' ? 'azul' : 'naranja';
}
function ensureWorkflow() {
  if (!state.workflow) state.workflow = {};
  for (const level of ['azul', 'naranja'])
    if (!state.workflow[level])
      state.workflow[level] = {
        screened: false,
        delivered: false,
        returned: false,
        purchase: null
      };
}
function workflowGate(level) {
  ensureWorkflow();
  const base = parentLevel(level),
    w = state.workflow[base];
  if (level.startsWith('crema') && !w.returned) {
    app.innerHTML = `<a class="back" href="#inicio">← Mis folders</a><div class="panel"><h1>Primero completa la etapa anterior</h1><p>El folder crema se prepara después de entregar el folder ${base === 'azul' ? 'azul' : 'naranja'}, esperar su revisión y recibir la devolución de la documentación por Kardex.</p><p>Estado declarado: ${!w.screened ? 'revisión inicial pendiente' : !w.delivered ? 'folder inicial aún no entregado' : 'en espera de devolución'}.</p><a class="button primary" href="#folder/${base}">Ir al folder ${base}</a></div>`;
    return false;
  }
  if (!level.startsWith('crema') && !w.screened) {
    w.screened = true;
    save();
  }
  return true;
}
function workflowPanel() {
  ensureWorkflow();
  if (state.level.startsWith('crema')) return;
  const base = state.level,
    w = state.workflow[base],
    cream = base === 'azul' ? 'crema_ts' : 'crema_lic';
  app.insertAdjacentHTML(
    'afterbegin',
    w.purchase
      ? `<section class="panel purchase-card no-print"><div class="purchase-head"><span class="eyebrow">Tus certificados de calificaciones</span></div>${purchaseResult(w.purchase.quantity)}</section>`
      : ''
  );
  const back = app.querySelector('.purchase-card');
  if (back) {
    const a = app.querySelector('.back');
    if (a) a.after(back);
  }
  app.insertAdjacentHTML(
    'beforeend',
    `<section class="panel no-print timeline-panel"><h2>Entrega y devolución</h2><ol class="timeline"><li class="done">Trámite iniciado</li><li class="${w.delivered ? 'done' : 'current'}">Entregar folder ${base}</li><li class="${w.returned ? 'done' : w.delivered ? 'current' : ''}">Kardex lo devuelve</li><li class="${w.returned ? 'current' : ''}">Folder crema</li></ol><div class="actions"><button data-delivered="${base}" ${w.delivered ? 'disabled' : ''}>${w.delivered ? '✓ Entregado' : '📦 Ya entregué mi folder'}</button><button data-returned="${base}" ${!w.delivered || w.returned ? 'disabled' : ''}>${w.returned ? '✓ Devuelto' : '📬 Kardex ya me lo devolvió'}</button>${w.returned ? `<a class="button primary" href="#folder/${cream}">Preparar folder crema →</a>` : ''}</div><p class="muted">Lo marcas tú; no es el estado oficial de Kardex.</p></section>`
  );
}

/* ---------- Contador de certificados ---------- */
function calculator(selected) {
  clearRecord();
  const level = selected || parentLevel(state.level);
  app.innerHTML = `<a class="back" href="#folder/${level}">← Volver a mis documentos</a><div class="page-title"><div><span class="eyebrow">Certificados de calificaciones</span><h1>Sube tu récord académico</h1><p class="lead">Te decimos cuántos certificados de calificaciones necesitas y dónde comprarlos.</p></div></div><div class="callout info compact"><strong>Solo el PDF digital del récord académico de asignaturas aprobadas.</strong> No historial, fotos ni escaneos. 🔒 Se lee en tu equipo, no se envía.</div><div class="workspace"><section class="panel"><label for="record-level">Trámite que quieres iniciar</label><select id="record-level"><option value="azul">Técnico Superior · Folder azul</option><option value="naranja">Licenciatura · Folder naranja</option></select><p id="entry-condition"></p><label for="record-pdf" class="dropzone"><span class="dz-icon">📄</span><strong>Toca aquí o arrastra tu récord en PDF</strong><small>Máximo 15 MB y 15 páginas</small><input type="file" id="record-pdf" accept="application/pdf,.pdf"></label><div id="record-result" role="status" aria-live="polite"></div></section><aside><div class="panel"><h3>📍 ¿Dónde los compro?</h3><p>En la ventanilla de <strong>venta de valores</strong>, donde se compran timbres.</p><ul class="price-list"><li><span>Certificados de calificaciones</span><strong>los que te calculemos</strong></li><li><span>Certificado de conclusión de estudios</span><strong>juego de 4</strong></li></ul><small class="muted">Lleva anotada tu cantidad para no comprar de más ni de menos.</small></div></aside></div>`;
  document.getElementById('record-level').value = level;
  entryCondition();
}
function entryCondition() {
  const level = document.getElementById('record-level').value;
  document.getElementById('entry-condition').textContent =
    level === 'azul'
      ? 'Para iniciar: todo octavo aprobado y folios correspondientes.'
      : 'Para iniciar: todo décimo aprobado y folios correspondientes.';
}
function renderRecordResult() {
  const box = document.getElementById('record-result');
  if (!box || !recordAnalysis) return;
  const level = document.getElementById('record-level').value,
    e = RecordParser.eligibility(recordAnalysis, level);
  if (!e.canConfirm) {
    box.innerHTML = `<div class="callout" style="margin-top:20px"><h3>Consulta a Kardex antes de iniciar</h3>${!e.hasTarget ? `<p>En este récord no aparecen asignaturas aprobadas del nivel ${e.target}. El nivel más alto identificado es ${recordAnalysis.maxLevel}.</p>` : ''}${e.missing ? `<p>Se identificaron ${e.missing} asignaturas sin folio entre las correspondientes hasta el nivel ${e.target}.</p>` : ''}<p>La aplicación no autoriza ni rechaza un trámite oficial. Revisa la situación académica y los folios con Kardex antes de comprar formularios.</p></div>`;
    return;
  }
  const estimate = C.estimate(recordAnalysis.bands);
  box.innerHTML = `<div class="callout info" style="margin-top:20px"><h3>✅ Récord leído correctamente</h3><p>Encontramos materias de nivel ${e.target} con sus folios.</p>${planText(recordAnalysis.plans) ? `<p>📘 ${planText(recordAnalysis.plans)}</p>` : ''}<p>Falta un último paso:</p><label class="inline"><input type="checkbox" id="complete-plan"> Confirmo que Kardex revisó que tengo aprobado todo ${e.target === 8 ? 'octavo' : 'décimo'} y que puedo iniciar este trámite.</label><button type="button" class="primary" data-confirm-entry>Ver cuántos certificados compro →</button></div>`;
}

/* ---------- Eventos ---------- */
document.addEventListener('change', async e => {
  if (e.target.id === 'record-level') {
    entryCondition();
    renderRecordResult();
  }
  if (e.target.id !== 'record-pdf' || !e.target.files[0]) return;
  const file = e.target.files[0],
    epoch = ++uploadEpoch;
  recordAnalysis = null;
  const box = document.getElementById('record-result');
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 15000000) {
    box.textContent = 'Selecciona un archivo PDF de hasta 15 MB.';
    return;
  }
  box.innerHTML = '<div class="scanning"><span></span>Leyendo tu récord en este equipo…</div>';
  try {
    const result = await RecordParser.analyze(await file.arrayBuffer());
    if (epoch !== uploadEpoch) return;
    recordAnalysis = result;
    renderRecordResult();
  } catch (err) {
    if (epoch === uploadEpoch)
      box.innerHTML = `<div class="callout" style="margin-top:20px"><strong>No se pudo completar la revisión.</strong><p>${esc(err.message)}</p><p>No se emitió cantidad de compra. Lleva el récord a Kardex para revisión.</p></div>`;
  } finally {
    e.target.value = '';
  }
});
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  ensureWorkflow();
  if ('confirmEntry' in d) {
    const check = document.getElementById('complete-plan'),
      base = document.getElementById('record-level').value;
    if (!recordAnalysis || !check?.checked)
      return toast('Confirma la revisión del plan completo por Kardex.');
    if (!RecordParser.eligibility(recordAnalysis, base).canConfirm) return;
    const v = C.estimate(recordAnalysis.bands);
    state.workflow[base].screened = true;
    state.workflow[base].purchase = {
      quantity: v.quantity,
      cost: v.cost,
      total: v.total,
      lines: v.lines,
      plans: recordAnalysis.plans || []
    };
    state.level = base;
    save();
    location.hash = 'folder/' + base;
    render();
  } else if (d.delivered) {
    if (!state.workflow[d.delivered].screened) return;
    if (confirm('¿Confirmas que ya entregaste físicamente este folder a Kardex?')) {
      state.workflow[d.delivered].delivered = true;
      save();
      render();
    }
  } else if (d.returned) {
    if (!state.workflow[d.returned].delivered) return;
    if (
      confirm(
        '¿Confirmas que Kardex ya te devolvió la documentación después de revisar el folder inicial?'
      )
    ) {
      state.workflow[d.returned].returned = true;
      save();
      render();
    }
  }
});
