/* Mi Folder · Cartas de solicitud
   Tipos de carta, vista previa y PDF tamaño carta generado con jsPDF
   (sin encabezados ni pies del navegador). */

/* ---------- Tipos de carta ---------- */
const letterTypes = {
  cert_ts: {
    label: 'Solicitud de calificaciones y conclusión · Técnico Superior',
    subject:
      'Solicitud de certificados de calificaciones y conclusión de estudios a nivel Técnico Universitario Superior',
    request:
      'la emisión de mis certificados de calificaciones y de conclusión de estudios a nivel Técnico Universitario Superior',
    purpose: 'continuar con los trámites para la obtención de dicho título'
  },
  cert_lic: {
    label: 'Solicitud de calificaciones y conclusión · Licenciatura',
    subject:
      'Solicitud de certificados de calificaciones y conclusión de estudios a nivel Licenciatura',
    request:
      'la emisión de mis certificados de calificaciones y de conclusión de estudios a nivel Licenciatura',
    purpose: 'continuar con los trámites académicos de dicho nivel'
  },
  res_ts: {
    label: 'Solicitud de resolución individual H.C.C. · Técnico Superior',
    subject:
      'Solicitud de resolución individual del H.C.C. para la titulación directa de Técnico Universitario Superior',
    request:
      'la resolución individual del Honorable Consejo de Carrera para la titulación directa del título de Técnico Universitario Superior',
    purpose: 'continuar con la obtención de dicho título'
  },
  mod_ts: {
    label: 'Solicitud de modalidad de graduación · Folder crema TS',
    subject:
      'Solicitud de trámite y firma del certificado de modalidad de graduación de Técnico Universitario Superior',
    request:
      'el trámite y la firma de mi certificado de modalidad de graduación de Técnico Universitario Superior',
    purpose: 'lo cual adjunto los requisitos exigidos para esta etapa'
  },
  mod_lic: {
    label: 'Solicitud de modalidad de graduación · Folder crema Licenciatura',
    subject:
      'Solicitud de trámite y firma del certificado de modalidad de graduación de Licenciatura',
    request: 'el trámite y la firma de mi certificado de modalidad de graduación de Licenciatura',
    purpose: 'lo cual adjunto los requisitos exigidos para esta etapa'
  }
};

/* ---------- Datos y vista previa ---------- */
let letterData = {
  type: 'cert_ts',
  name: '',
  ci: '',
  ru: '',
  semester: '',
  phone: '',
  director: 'M. Sc. Ing. William Roque Roque',
  date: todayText()
};
function todayText() {
  try {
    return new Date().toLocaleDateString('es-BO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}
function letterText(data) {
  const t = letterTypes[data.type] || letterTypes.cert_ts,
    name = data.name.trim() || '[NOMBRES Y APELLIDOS]',
    ci = data.ci.trim() || '[C.I. Y EXPEDIDO]',
    ru = data.ru.trim() || '[REGISTRO UNIVERSITARIO]',
    date = data.date || '[FECHA]';
  return `El Alto, ${date}\n\nSeñor:\n${data.director.trim() || '[DIRECTOR DE CARRERA]'}\nDIRECTOR DE LA CARRERA DE INGENIERÍA DE SISTEMAS\nUNIVERSIDAD PÚBLICA DE EL ALTO\nPresente.\n\nREF.: ${t.subject.toLocaleUpperCase('es')}\n\nDe mi consideración:\n\nPor medio de la presente, yo, ${name}, con C.I. ${ci} y Registro Universitario ${ru}${data.semester.trim() ? ', actualmente inscrito/a en ' + data.semester.trim() : ''}, solicito a su autoridad ${t.request}, para ${t.purpose}.\n\nAgradezco la atención a mi solicitud.\n\nAtentamente,\n\n\n____________________________\nFirma\n${name}\nR.U.: ${ru}\nC.I.: ${ci}${data.phone.trim() ? '\nCelular: ' + data.phone.trim() : ''}`;
}
function letterHTML(data) {
  const t = letterTypes[data.type] || letterTypes.cert_ts,
    v = (x, d) => esc(x.trim() || d),
    name = v(data.name, '[NOMBRES Y APELLIDOS]'),
    ci = v(data.ci, '[C.I. Y EXPEDIDO]'),
    ru = v(data.ru, '[REGISTRO UNIVERSITARIO]'),
    purpose = ', para ' + t.purpose;
  return `<p class="l-date">El Alto, ${v(data.date, '[FECHA]')}</p><p class="l-to">Señor:<br><strong>${v(data.director, '[DIRECTOR DE CARRERA]')}</strong><br>DIRECTOR DE LA CARRERA DE INGENIERÍA DE SISTEMAS<br>UNIVERSIDAD PÚBLICA DE EL ALTO<br><u>Presente.</u></p><p class="l-ref"><strong>REF.:</strong> <u><strong>${esc(t.subject.toLocaleUpperCase('es'))}</strong></u></p><p>De mi consideración:</p><p class="l-body">Por medio de la presente, yo, <strong>${name}</strong>, con C.I. ${ci} y Registro Universitario ${ru}${data.semester.trim() ? ', estudiante de ' + esc(data.semester.trim()) : ''}, solicito a su autoridad ${esc(t.request)}${esc(purpose)}.</p><p>Sin otro particular, agradezco de antemano su atención.</p><p>Atentamente,</p><div class="l-sign"><div class="l-line"></div><strong>${name}</strong><span>C.I.: ${ci}</span><span>R.U.: ${ru}</span>${data.phone.trim() ? `<span>Cel.: ${esc(data.phone.trim())}</span>` : ''}</div>`;
}
/* ---------- PDF tamaño carta (jsPDF) ---------- */
function letterPDF(data) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const t = letterTypes[data.type] || letterTypes.cert_ts,
    v = (x, d) => x.trim() || d,
    name = v(data.name, '[NOMBRES Y APELLIDOS]'),
    ci = v(data.ci, '[C.I. Y EXPEDIDO]'),
    ru = v(data.ru, '[REGISTRO UNIVERSITARIO]');
  const left = 30,
    right = 215.9 - 25,
    width = right - left,
    center = (left + right) / 2,
    line = 6;
  let y = 30;
  const write = (text, opts = {}) => {
    doc.setFont('times', opts.bold ? 'bold' : 'normal');
    doc.text(text, opts.x ?? left, y, opts.align ? { align: opts.align } : undefined);
    y += line;
  };
  const underline = (text, x, yy) => {
    doc.setLineWidth(0.3);
    doc.line(x, yy + 1, x + doc.getTextWidth(text), yy + 1);
  };

  doc.setFontSize(12);
  write('El Alto, ' + v(data.date, '[FECHA]'), { x: right, align: 'right' });
  y += line;
  write('Señor:');
  write(v(data.director, '[DIRECTOR DE CARRERA]'), { bold: true });
  write('DIRECTOR DE LA CARRERA DE INGENIERÍA DE SISTEMAS');
  write('UNIVERSIDAD PÚBLICA DE EL ALTO');
  underline('Presente.', left, y);
  write('Presente.');
  y += line;

  doc.setFont('times', 'bold');
  const label = 'REF.: ',
    indent = left + doc.getTextWidth(label);
  doc.text(label, left, y);
  doc.splitTextToSize(t.subject.toLocaleUpperCase('es'), right - indent).forEach(part => {
    doc.text(part, indent, y);
    underline(part, indent, y);
    y += line;
  });
  y += line;

  write('De mi consideración:');
  y += 2;
  const body =
    `Por medio de la presente, yo, ${name}, con C.I. ${ci} y Registro Universitario ${ru}` +
    (data.semester.trim() ? ', estudiante de ' + data.semester.trim() : '') +
    `, solicito a su autoridad ${t.request}, para ${t.purpose}.`;
  doc.setFont('times', 'normal');
  const lines = doc.splitTextToSize(body, width);
  doc.text(lines, left, y, { align: 'justify', maxWidth: width, lineHeightFactor: 1.5 });
  y += lines.length * line + line;

  write('Sin otro particular, agradezco de antemano su atención.');
  y += line;
  write('Atentamente,');

  y += 28;
  doc.setLineWidth(0.3);
  doc.line(center - 35, y, center + 35, y);
  y += line;
  write(name, { bold: true, x: center, align: 'center' });
  write('C.I.: ' + ci, { x: center, align: 'center' });
  write('R.U.: ' + ru, { x: center, align: 'center' });
  if (data.phone.trim()) write('Cel.: ' + data.phone.trim(), { x: center, align: 'center' });

  doc.setProperties({ title: 'Solicitud' });
  return doc;
}
function letters(pick) {
  // Si se llega desde un requisito (#cartas/<tipo>), esa carta ya viene elegida.
  const fromFolder = Object.hasOwn(letterTypes, pick || '');
  if (fromFolder) {
    letterData.type = pick;
    window.scrollTo(0, 0);
  }
  app.innerHTML = `<a class="back no-print" href="${fromFolder ? '#folder/' + state.level : '#inicio'}">${fromFolder ? '← Volver a mis documentos' : '← Mis folders'}</a><div class="page-title no-print"><div><span class="eyebrow">Modelos editables</span><h1>Prepara tu solicitud</h1></div></div><div class="callout info compact no-print">Llena tus datos y verás la carta lista a la derecha. 🔒 Tus datos no se guardan: al cerrar la página se borran.</div><div class="letter-layout"><form id="letter-form" class="panel no-print"><label>Tipo de solicitud<select name="type">${Object.entries(
    letterTypes
  )
    .map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`)
    .join(
      ''
    )}</select></label><label>Nombres y apellidos<input name="name" maxlength="120" autocomplete="off"></label><label>Cédula y expedido<input name="ci" maxlength="50" autocomplete="off"></label><label>Registro universitario<input name="ru" maxlength="40" autocomplete="off"></label><label>Semestre o situación actual (opcional)<input name="semester" maxlength="100" placeholder="Ejemplo: noveno semestre"></label><label>Celular (opcional)<input name="phone" maxlength="40" autocomplete="off"></label><label>Fecha para la carta<input name="date" maxlength="80" placeholder="14 de octubre de 2026"></label><label>Director destinatario<input name="director" maxlength="150"></label><div class="actions" style="margin-top:20px"><button type="button" class="primary" data-pdf-letter>Descargar PDF</button><button type="button" data-print-letter>Imprimir</button><button type="button" data-download-letter>Descargar TXT</button><button type="button" data-clear-letter>Borrar mis datos</button></div></form><section id="letter-preview" class="letter-paper" aria-label="Vista previa de carta"></section></div>`;
  const f = document.getElementById('letter-form');
  for (const k of Object.keys(letterData)) f.elements[k].value = letterData[k];
  updateLetter();
}
function updateLetter() {
  const f = document.getElementById('letter-form');
  if (!f) return;
  for (const k of Object.keys(letterData)) letterData[k] = f.elements[k].value;
  document.getElementById('letter-preview').innerHTML = letterHTML(letterData);
}

/* ---------- Eventos ---------- */
document.addEventListener('submit', e => {
  if (e.target.id === 'letter-form') e.preventDefault();
});
document.addEventListener('input', e => {
  if (e.target.closest('#letter-form')) updateLetter();
});
document.addEventListener('click', e => {
  const d = e.target.closest('button')?.dataset || {};
  if ('pdfLetter' in d) {
    updateLetter();
    letterPDF(letterData).save('solicitud-' + letterData.type + '.pdf');
  } else if ('printLetter' in d) {
    // Se imprime el PDF y no la página: así el navegador no agrega fecha, título ni dirección.
    updateLetter();
    const doc = letterPDF(letterData);
    doc.autoPrint();
    const win = window.open(doc.output('bloburl'), '_blank');
    if (!win) doc.save('solicitud-' + letterData.type + '.pdf');
  } else if ('downloadLetter' in d) {
    updateLetter();
    const url = URL.createObjectURL(
        new Blob([letterText(letterData)], { type: 'text/plain;charset=utf-8' })
      ),
      a = document.createElement('a');
    a.href = url;
    a.download = 'solicitud-' + letterData.type + '.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } else if ('clearLetter' in d) {
    letterData = {
      type: 'cert_ts',
      name: '',
      ci: '',
      ru: '',
      semester: '',
      phone: '',
      director: 'M. Sc. Ing. William Roque Roque',
      date: todayText()
    };
    letters(location.hash.split('/')[1]);
    toast('Datos personales retirados del generador.');
  }
});
