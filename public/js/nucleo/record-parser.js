'use strict';
/* Mi Folder · Lector del récord académico (PDF)
   Cuenta las franjas negras de cada página con PDF.js para estimar los certificados
   e identifica el plan (o planes) de estudios que figura en el récord.
   Todo se procesa en el navegador; el archivo no se envía a ningún servidor. */
(function (root) {
  const normalize = s =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  // Números de plan del récord. En la columna "PLAN DE ESTUDIOS" cada materia dice
  // "P.E. N°4"; también se acepta "PLAN DE ESTUDIOS N° 4" o "PLAN: 4".
  // Se exige "N°" o ":" para no confundir el encabezado con el número de fila.
  function plansFrom(text) {
    const found = new Set(),
      t = normalize(text),
      patterns = [
        /\bP\.\s*E\.\s*N\s*[O°º'´]?\.?\s*(\d{1,2})(?!\d)/g,
        /PLAN(?:\s+DE\s+ESTUDIOS?)?\s*(?:N\s*[O°º'´]\.?|:)\s*(\d{1,2})(?!\d)/g
      ];
    for (const re of patterns)
      for (const m of t.matchAll(re)) {
        const n = Number(m[1]);
        if (n >= 1 && n <= 20) found.add(n);
      }
    return [...found].sort((a, b) => a - b);
  }
  function readPage(items, operators, width, OPS) {
    const text = normalize(items.map(t => t.str).join(' '));
    if (
      !text.includes('RECORD ACADEMICO DE ASIGNATURAS APROBADOS') ||
      text.includes('HISTORIAL ACADEMICO')
    )
      throw Error(
        'El archivo debe ser un récord académico de asignaturas aprobadas, no un historial.'
      );
    const anchor = name => items.find(t => normalize(t.str).trim() === name);
    const level = anchor('NIVEL'),
      folio = anchor('FOLIO');
    if (!level || !folio)
      throw Error(
        'No se identificaron las columnas de nivel y folio. Solicita revisión en Kardex.'
      );
    const levelX = level.transform[4] + level.width / 2,
      folioX = folio.transform[4] + folio.width / 2,
      planCol = anchor('PLAN'),
      planX = planCol ? planCol.transform[4] + planCol.width / 2 : null;
    const plans = new Set(plansFrom(text));
    const rows = [];
    for (const token of items) {
      if (!/^[A-Z]{2,5}-\d{3}$/.test(token.str.trim()) || token.transform[4] > width * 0.2)
        continue;
      const y = token.transform[5],
        same = items.filter(t => Math.abs(t.transform[5] - y) < 1.4 && t.str.trim());
      const index = same.find(
        t => /^\d+$/.test(t.str.trim()) && t.transform[4] < token.transform[4] - 4
      );
      const numberAt = (x, tol) =>
        same
          .find(t => /^\d+$/.test(t.str.trim()) && Math.abs(t.transform[4] + t.width / 2 - x) < tol)
          ?.str.trim() || '';
      const n = Number(numberAt(levelX, 7)),
        f = numberAt(folioX, 7);
      if (!index || !n || n > 12 || !same.some(t => normalize(t.str).trim() === 'APROBADO'))
        throw Error('Una fila no tiene el formato esperado. No se emitió una cantidad de compra.');
      const plan = planX === null ? 0 : Number(numberAt(planX, 7));
      if (plan >= 1 && plan <= 20) plans.add(plan);
      rows.push({ index: Number(index.str), code: token.str.trim(), level: n, folio: f, y });
    }
    if (!rows.length)
      throw Error(
        'No se encontraron filas legibles. Se requiere el PDF digital original; no una foto o escaneo.'
      );
    const ys = rows.map(r => r.y),
      lo = Math.min(...ys) - 7,
      hi = Math.max(...ys) + 7,
      candidates = [];
    for (let i = 0; i < operators.fnArray.length; i++) {
      if (operators.fnArray[i] !== OPS.constructPath) continue;
      const a = operators.argsArray[i],
        box = a?.[2];
      if (!box || box.length !== 4) continue;
      const [x1, y1, x2, y2] = box,
        w = x2 - x1,
        h = y2 - y1;
      if (
        w > width * 0.8 &&
        h > 0.35 &&
        h < 1.3 &&
        y1 > lo &&
        y2 < hi &&
        [OPS.fill, OPS.eoFill, OPS.fillStroke, OPS.eoFillStroke].includes(a[0])
      )
        candidates.push((y1 + y2) / 2);
    }
    candidates.sort((a, b) => a - b);
    const bands = [];
    for (const y of candidates) {
      if (!bands.length || y - bands[bands.length - 1] > 2) bands.push(y);
    }
    let total = null;
    const totalLabel = items.find(t => normalize(t.str).includes('TOTAL DE ASIGNATURAS APROBADAS'));
    if (totalLabel) {
      const nums = items.filter(
        t =>
          /^\d+$/.test(t.str.trim()) &&
          Math.abs(t.transform[5] - totalLabel.transform[5]) < 1.5 &&
          t.transform[4] > totalLabel.transform[4] + totalLabel.width
      );
      if (nums.length === 1) total = Number(nums[0].str);
    }
    return { rows, bands: bands.length, total, plans: [...plans] };
  }
  function summarize(pages) {
    const rows = pages.flatMap(p => p.rows),
      total = pages.map(p => p.total).find(v => v !== null),
      bands = pages.reduce((s, p) => s + p.bands, 0);
    if (total === undefined || total !== rows.length)
      throw Error(
        'El número de filas no coincide con el total del récord. Revisa que el PDF esté completo.'
      );
    const ids = rows.map(r => r.index);
    if (
      new Set(ids).size !== ids.length ||
      Math.min(...ids) !== 1 ||
      Math.max(...ids) !== rows.length
    )
      throw Error('Hay filas repetidas o faltantes. Se requiere el PDF completo.');
    if (bands < 1)
      throw Error('No se identificaron los separadores con suficiente certeza. Consulta a Kardex.');
    const plans = [...new Set(pages.flatMap(p => p.plans || []))].sort((a, b) => a - b);
    return { rows, bands, maxLevel: Math.max(...rows.map(r => r.level)), total, plans };
  }
  function eligibility(result, level) {
    const target = level === 'azul' ? 8 : 10,
      relevant = result.rows.filter(r => r.level <= target),
      missing = relevant.filter(r => !r.folio).length,
      hasTarget = relevant.some(r => r.level === target);
    return { target, missing, hasTarget, canConfirm: hasTarget && missing === 0 };
  }
  async function analyze(data, lib = root.pdfjsLib) {
    if (!lib)
      throw Error('No se cargó el lector PDF local. Extrae todo el ZIP e intenta de nuevo.');
    const task = lib.getDocument({
      data: new Uint8Array(data),
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true
    });
    let pdf;
    try {
      pdf = await task.promise;
      if (pdf.numPages > 15) throw Error('Máximo 15 páginas.');
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i),
          text = await page.getTextContent(),
          operators = await page.getOperatorList();
        pages.push(readPage(text.items, operators, page.view[2] - page.view[0], lib.OPS));
      }
      return summarize(pages);
    } finally {
      if (pdf) await pdf.destroy();
      else await task.destroy();
    }
  }
  const api = { plansFrom, readPage, summarize, eligibility, analyze };
  root.RecordParser = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
