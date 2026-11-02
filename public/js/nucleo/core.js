'use strict';
/* Mi Folder · Lógica central (FolderCore)
   Niveles, datos iniciales, validación del estado guardado, progreso
   y regla de certificados: filas × 3 + 5, redondeado a la decena superior. */
(function (root) {
  const levels = {
    azul: { name: 'Técnico Superior', color: 'blue', folder: 'Folder azul · Etapa inicial' },
    naranja: { name: 'Licenciatura', color: 'orange', folder: 'Folder naranja · Etapa inicial' },
    crema_ts: {
      name: 'Modalidad de graduación TS',
      color: 'cream',
      folder: 'Folder crema · Técnico Superior'
    },
    crema_lic: {
      name: 'Modalidad de graduación Licenciatura',
      color: 'cream',
      folder: 'Folder crema · Licenciatura'
    }
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  function seed() {
    const data = root.KardexCatalog || { catalog: {}, process: {} },
      s = {
        version: 2,
        mode: 'real',
        level: 'azul',
        catalog: {},
        demo: {},
        progress: {},
        excluded: {},
        process: {},
        workflow: {
          azul: { screened: false, delivered: false, returned: false, purchase: null },
          naranja: { screened: false, delivered: false, returned: false, purchase: null }
        }
      };
    for (const k of Object.keys(levels)) {
      s.catalog[k] = clone(data.catalog[k] || []);
      s.demo[k] = [];
      s.process[k] = data.process[k] || '';
    }
    return s;
  }
  const fields = [
    'id',
    'title',
    'description',
    'where',
    'how',
    'cost',
    'time',
    'check',
    'source',
    'date'
  ];
  function validate(input) {
    if (
      !input ||
      ![1, 2].includes(input.version) ||
      !['demo', 'real'].includes(input.mode) ||
      !Object.hasOwn(levels, input.level)
    )
      throw Error('Formato de respaldo no compatible.');
    const old = input.version === 1,
      s = seed();
    s.mode = old ? 'real' : input.mode;
    s.level = input.level;
    for (const kind of ['catalog', 'demo']) {
      if (!input[kind]) throw Error('Falta el catálogo.');
      for (const l of Object.keys(levels)) {
        const list = input[kind][l];
        if (old && list === undefined) continue;
        if (!Array.isArray(list) || list.length > 100)
          throw Error('Máximo 100 requisitos por folder.');
        const ids = new Set();
        const parsed = list.map(r => {
          if (!r || typeof r !== 'object') throw Error('Requisito inválido.');
          const o = {};
          for (const f of fields) {
            if (typeof r[f] !== 'string' || r[f].length > 2000) throw Error('Campo inválido: ' + f);
            o[f] = r[f];
          }
          if (!/^[a-zA-Z0-9_-]{1,100}$/.test(r.id) || ids.has(r.id) || !r.title.trim())
            throw Error('Identificador inválido, repetido o título vacío.');
          ids.add(r.id);
          o.verified = r.verified === true;
          o.condition = typeof r.condition === 'string' ? r.condition : '';
          if (o.condition.length > 2000) throw Error('Condición demasiado extensa.');
          return o;
        });
        s[kind][l] =
          old && kind === 'catalog'
            ? [...s[kind][l], ...parsed.filter(r => !s[kind][l].some(x => x.id === r.id))]
            : parsed;
        if (s[kind][l].length > 100) throw Error('El catálogo combinado supera 100 requisitos.');
      }
    }
    if (!input.progress || typeof input.progress !== 'object' || Array.isArray(input.progress))
      throw Error('Avance inválido.');
    for (const mode of ['real', 'demo'])
      for (const l of Object.keys(levels))
        for (const r of s[mode === 'real' ? 'catalog' : 'demo'][l]) {
          const k = mode + ':' + l + ':' + r.id;
          if (input.progress[k] === true) s.progress[k] = true;
          if (r.condition && input.excluded?.[k] === true) s.excluded[k] = true;
        }
    for (const l of Object.keys(levels)) {
      const p = input.process?.[l];
      if (p !== undefined && (typeof p !== 'string' || p.length > 6000))
        throw Error('Proceso inválido.');
      if (p !== undefined && (!old || p)) s.process[l] = p;
    }
    for (const base of ['azul', 'naranja']) {
      const w = input.workflow?.[base];
      if (w) {
        const screened = w.screened === true,
          delivered = screened && w.delivered === true,
          returned = delivered && w.returned === true;
        let purchase = null;
        if (
          w.purchase &&
          Number.isInteger(w.purchase.quantity) &&
          w.purchase.quantity > 0 &&
          w.purchase.quantity <= 3010 &&
          w.purchase.quantity % 10 === 0 &&
          w.purchase.cost === w.purchase.quantity * 3 &&
          w.purchase.total === w.purchase.cost + 10
        ) {
          purchase = {
            quantity: w.purchase.quantity,
            cost: w.purchase.cost,
            total: w.purchase.total
          };
          const n = w.purchase.lines;
          if (
            Number.isSafeInteger(n) &&
            n >= 1 &&
            n <= 1000 &&
            estimate(n).quantity === purchase.quantity
          )
            purchase.lines = n;
          const plans = w.purchase.plans;
          if (
            Array.isArray(plans) &&
            plans.length <= 6 &&
            plans.every(x => Number.isInteger(x) && x >= 1 && x <= 20)
          )
            purchase.plans = [...new Set(plans)].sort((a, b) => a - b);
        }
        s.workflow[base] = { screened, delivered, returned, purchase };
      }
    }
    return s;
  }
  function items(s, l = s.level) {
    return s[s.mode === 'demo' ? 'demo' : 'catalog'][l];
  }
  function key(s, id, l = s.level) {
    return s.mode + ':' + l + ':' + id;
  }
  function applicable(s, l = s.level) {
    return items(s, l).filter(r => !(r.condition && s.excluded[key(s, r.id, l)]));
  }
  function stats(s, l = s.level) {
    const all = applicable(s, l),
      done = all.filter(r => s.progress[key(s, r.id, l)]).length;
    return {
      total: all.length,
      done,
      excluded: items(s, l).length - all.length,
      percent: all.length ? Math.round((done / all.length) * 100) : 0
    };
  }
  function estimate(lines) {
    if (!Number.isSafeInteger(lines) || lines < 1 || lines > 1000)
      throw Error('Ingresa entre 1 y 1000 líneas enteras.');
    const base = lines * 3 + 5,
      quantity = Math.ceil(base / 10) * 10,
      cost = quantity * 3;
    return { lines, base, quantity, cost, conclusion: 10, total: cost + 10 };
  }
  const api = { levels, seed, validate, items, key, applicable, stats, estimate };
  root.FolderCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
