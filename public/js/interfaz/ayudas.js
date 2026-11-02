'use strict';
/* Mi Folder · Ayudas para que la página sea fácil de usar
   1. Guía de primer uso: 3 pasos cortos la primera vez que alguien entra.
   2. "Lo que me falta": lista corta de los documentos pendientes del folder,
      para mostrarla en el celular o imprimirla. */

/* ---------- 1. Guía de primer uso ---------- */
const GUIA_VISTA = 'mi-folder-guia-vista',
  pasosGuia = [
    {
      icono: '📂',
      titulo: 'Elige tu folder',
      texto:
        'Azul si sacas Técnico Superior, naranja si sacas Licenciatura. El folder crema viene después.'
    },
    {
      icono: '✅',
      titulo: 'Marca lo que ya tienes',
      texto:
        'Cada documento dice dónde se consigue. Toca "Ver más" para ver cómo sacarlo y un ejemplo.'
    },
    {
      icono: '📋',
      titulo: 'Revisa lo que te falta',
      texto: usuario
        ? 'Tu avance se guarda en tu cuenta. Si la computadora es prestada, cierra sesión al terminar.'
        : 'Crea tu cuenta gratis para ver tu avance desde cualquier computadora o celular.'
    }
  ];
let pasoGuia = 0;
const guia = document.createElement('dialog');
guia.className = 'guia-inicio';
guia.setAttribute('aria-label', 'Cómo usar Mi Folder');
document.body.append(guia);

function pintarGuia() {
  const p = pasosGuia[pasoGuia],
    ultimo = pasoGuia === pasosGuia.length - 1;
  guia.innerHTML = `<div class="guia-icono">${p.icono}</div><span class="eyebrow">Paso ${pasoGuia + 1} de ${pasosGuia.length}</span><h2>${p.titulo}</h2><p>${p.texto}</p><div class="guia-puntos">${pasosGuia.map((_, i) => `<span class="${i === pasoGuia ? 'activo' : ''}"></span>`).join('')}</div><div class="actions"><button data-guia-cerrar>Saltar</button><button class="primary" data-guia-siguiente>${ultimo ? '¡Empezar!' : 'Siguiente →'}</button></div>`;
}
function abrirGuia() {
  pasoGuia = 0;
  pintarGuia();
  guia.showModal();
}
function cerrarGuia() {
  guia.close();
  try {
    localStorage.setItem(GUIA_VISTA, '1');
  } catch (e) {}
}
guia.addEventListener('click', e => {
  if (e.target.closest('[data-guia-cerrar]')) cerrarGuia();
  else if (e.target.closest('[data-guia-siguiente]')) {
    if (pasoGuia === pasosGuia.length - 1) cerrarGuia();
    else {
      pasoGuia++;
      pintarGuia();
    }
  }
});
guia.addEventListener('cancel', cerrarGuia);
document.addEventListener('click', e => {
  if (e.target.closest('[data-guia]')) abrirGuia();
});

// Botón "¿Cómo se usa?" en el inicio, y la guía se abre sola la primera vez.
const inicioSinGuia = home;
home = function () {
  inicioSinGuia();
  app
    .querySelector('.hero-actions')
    ?.insertAdjacentHTML('beforeend', '<button class="big" data-guia>¿Cómo se usa?</button>');
};
let guiaYaVista = true;
try {
  guiaYaVista = localStorage.getItem(GUIA_VISTA) === '1';
} catch (e) {}
if (!guiaYaVista && !esKardex && (location.hash || '#inicio') === '#inicio') abrirGuia();

/* ---------- 2. Lo que me falta ---------- */
function loQueFalta() {
  const l = C.levels[state.level],
    todos = C.applicable(state),
    faltan = todos.filter(r => !state.progress[C.key(state, r.id)]);
  const lista = faltan.length
    ? `<ol class="faltan-lista">${faltan.map(r => `<li><strong>${esc(r.title)}</strong><span>📍 ${esc(r.where)}</span></li>`).join('')}</ol>`
    : '<div class="empty"><h3>🎉 ¡No te falta nada!</h3><p>Revisa el orden de tus documentos y lleva tu folder a Kardex.</p></div>';
  app.innerHTML = `<a class="back no-print" href="#folder/${state.level}">← Volver a mi folder</a><span class="eyebrow">${l.folder}</span><h1>Lo que me falta</h1><p class="lead">${faltan.length ? `Te faltan <strong>${faltan.length} de ${todos.length}</strong> documentos.` : `Tienes los ${todos.length} documentos.`}${usuario ? ` · ${esc(usuario.name)}` : ''}</p>${lista}<div class="actions no-print"><button class="primary" data-imprimir-faltan>🖨️ Imprimir</button><a class="button" href="#folder/${state.level}">Volver a mi folder</a></div>`;
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-imprimir-faltan]')) window.print();
});
const renderSinFaltan = render;
render = function () {
  if (location.hash === '#faltan') {
    app.style.removeProperty('--accent');
    loQueFalta();
  } else renderSinFaltan();
};
// Botón en el panel "Tu avance" del folder.
const folderSinFaltan = folder;
folder = function () {
  folderSinFaltan();
  app
    .querySelector('.next-step')
    ?.insertAdjacentHTML(
      'afterend',
      '<a class="button small primary faltan-boton" href="#faltan">📋 Ver lo que me falta</a>'
    );
};
if (location.hash === '#faltan') render();
