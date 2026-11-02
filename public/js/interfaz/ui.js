'use strict';
/* Mi Folder · Interfaz: modo claro/oscuro y animaciones.
   Solo presentación: no modifica el estado ni la lógica de app.js. */
(function () {
  const root = document.documentElement,
    KEY = 'mi-folder-tema';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch (e) {}
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme =
    saved === 'dark' || saved === 'light' ? saved : systemDark ? 'dark' : 'light';

  /* ---------- Botón de tema ---------- */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle no-print';
  btn.innerHTML =
    '<span class="sun" aria-hidden="true">☀</span><span class="moon" aria-hidden="true">☾</span>';
  function label() {
    const d = root.dataset.theme === 'dark';
    btn.setAttribute('aria-label', d ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    btn.title = d ? 'Modo claro' : 'Modo oscuro';
    btn.setAttribute('aria-pressed', String(d));
  }
  btn.addEventListener('click', () => {
    root.classList.add('theme-anim');
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, root.dataset.theme);
    } catch (e) {}
    label();
    setTimeout(() => root.classList.remove('theme-anim'), 500);
  });
  label();
  const header = document.querySelector('header');
  if (header) header.appendChild(btn);

  /* ---------- Sombra del encabezado al hacer scroll ---------- */
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú: marca la sección activa ---------- */
  function markNav() {
    const route = (location.hash.slice(1) || 'inicio').split('/')[0];
    document.querySelectorAll('nav a').forEach(a => {
      const r = a.getAttribute('href').slice(1);
      a.classList.toggle('active', r === route || (r === 'inicio' && route === 'folder'));
    });
  }

  /* ---------- Animación al cambiar de pantalla y al aparecer ---------- */
  const app = document.getElementById('app');
  const io =
    !reduce && 'IntersectionObserver' in window
      ? new IntersectionObserver(
          es => {
            es.forEach(e => {
              if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
              }
            });
          },
          { threshold: 0.08 }
        )
      : null;
  let pageAt = 0;
  function reveal() {
    if (!app) return;
    const fresh = performance.now() - pageAt < 900;
    const items = app.querySelectorAll(
      '.card,.step,.panel,.requirement,.callout,.empty,.editor-row,.letter-paper,.choice,.faq details,.stats-strip>div'
    );
    items.forEach((el, i) => {
      if (el.classList.contains('reveal')) return;
      if (!fresh && !el.closest('.wizard')) {
        el.classList.add('reveal', 'in');
        return;
      }
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(i, 10) * 55 + 'ms');
      if (io) io.observe(el);
      else el.classList.add('in');
    });
  }
  function pageChange() {
    pageAt = performance.now();
    markNav();
    if (app && !reduce) {
      app.classList.remove('page-in');
      void app.offsetWidth;
      app.classList.add('page-in');
    }
    if (!location.hash.includes('/'))
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    requestAnimationFrame(reveal);
  }
  window.addEventListener('hashchange', pageChange);
  if (app)
    new MutationObserver(() => requestAnimationFrame(reveal)).observe(app, {
      childList: true,
      subtree: true
    });
  pageChange();

  /* ---------- Efecto de onda al presionar botones ---------- */
  document.addEventListener('pointerdown', e => {
    if (reduce) return;
    const b = e.target.closest('button,.button');
    if (!b || b.disabled || b.classList.contains('theme-toggle')) return;
    const r = b.getBoundingClientRect(),
      s = document.createElement('span');
    s.className = 'ripple';
    s.style.left = e.clientX - r.left + 'px';
    s.style.top = e.clientY - r.top + 'px';
    b.appendChild(s);
    setTimeout(() => s.remove(), 600);
  });

  /* ---------- Celebración al completar un folder ---------- */
  const pct = () => {
    const r = app && app.querySelector('.aside-ring [data-percent]');
    if (r) return Number(r.dataset.percent) || 0;
    const s = app && app.querySelector('.progress>span');
    return s ? parseFloat(s.style.width) || 0 : 0;
  };
  let before = 0;
  document.addEventListener(
    'change',
    e => {
      if (!e.target.matches('[data-check]')) return;
      setTimeout(() => {
        const now = pct();
        if (now >= 100 && before < 100) confetti();
        before = now;
      }, 80);
    },
    true
  );
  document.addEventListener(
    'pointerdown',
    e => {
      if (e.target.closest('.requirement')) before = pct();
    },
    true
  );
  document.addEventListener(
    'keydown',
    () => {
      before = pct();
    },
    true
  );

  function confetti() {
    if (reduce) return;
    const colors = ['#2563eb', '#ea7a2a', '#b8963e', '#14b8a6', '#f43f5e', '#facc15'];
    const box = document.createElement('div');
    box.className = 'confetti';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--x', Math.random() * 160 - 80 + 'px');
      p.style.setProperty('--r', Math.random() * 720 - 360 + 'deg');
      p.style.animationDelay = Math.random() * 0.4 + 's';
      p.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 3800);
    const n = document.getElementById('notice');
    const msg = '🎉 ¡Folder completo! Revisa todo una vez más antes de llevarlo a Kardex.';
    if (n && !n.textContent) {
      n.textContent = msg;
      setTimeout(() => {
        if (n.textContent === msg) n.textContent = '';
      }, 6000);
    }
  }
})();
