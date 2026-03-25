document.getElementById('file-input').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById('upload-status').textContent = 'Leyendo...';

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const wb = XLSX.read(evt.target.result, { type:'binary', cellDates:true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { range:3, defval:'' });

      const activos = procesarFilas(rows);
      const nombreMes = detectarMes(rows, file.name);

      mesesDB[nombreMes] = activos;
      activarMes(nombreMes);
      renderTabs();

      document.getElementById('upload-status').textContent = 'Cargado: ' + nombreMes;
    } catch(err) {
      document.getElementById('upload-status').textContent = 'Error al leer';
      console.error(err);
    }
  };
  reader.readAsBinaryString(file);
  e.target.value = '';
});

function procesarFilas(rows) {
  return rows
    .filter(r => {
      const est = (r['Estado'] || '').trim();
      return est === 'En Proceso' || est === 'En proceso' || est === 'Suspendido';
    })
    .filter(r => !EXCLUIR_GRUPOS.includes((r['Grupos'] || '').trim()))
    .map(r => {
      const fecha = r['Fecha de Registro'];
      const fechaStr = (fecha instanceof Date)
        ? fecha.toISOString().slice(0,10)
        : String(fecha).slice(0,10);

      return {
        'Tipo Caso': r['Tipo Caso'] || '',
        'Cod Caso': r['Cod Caso'] || '',
        'Estado': (r['Estado'] || '').trim(),
        'Razon de Estado': r['Razon de Estado'] || '',
        'Progreso': Number(r['Progreso']) || 0,
        'Ans': Number(r['Ans']) || 0,
        'pct': Number(r['Progreso']) || 0,
        'Grupos': r['Grupos'] || '',
        'Responsable': r['Responsable'] || '',
        'Descripción': String(r['Descripción']||'').slice(0,80).replace(/\n/g,' '),
        'Fecha de Registro': fechaStr,
        'Compañia': r['Compañia'] || ''
      };
    })
    .sort((a,b) => b.pct - a.pct);
}

function detectarMes(rows, nombreArchivo) {
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];

  for (const r of rows) {
    const f = r['Fecha de Registro'];
    if (f instanceof Date) return meses[f.getMonth()] + ' ' + f.getFullYear();
  }
  return nombreArchivo.replace(/\.xlsx?/i,'').replace(/_/g,' ');
}