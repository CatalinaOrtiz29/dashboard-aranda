function getAlerta(pct) {
  if (pct>=100) return 'vencido';
  if (pct>=70) return 'critico';
  if (pct>=60) return 'atencion';
  return 'normal';
}

function actualizarFiltroResponsables() {
  const fResp = document.getElementById('f-resp');
  fResp.innerHTML = '<option value="">Todos</option>';

  [...new Set(TODOS.map(r=>r.Responsable).filter(Boolean))].sort()
    .forEach(r => {
      const o = document.createElement('option');
      o.value = o.textContent = r;
      fResp.appendChild(o);
    });
}

function applyFilters(){
  const tipo=document.getElementById('f-tipo').value;
  const estado=document.getElementById('f-estado').value;
  const alerta=document.getElementById('f-alerta').value;
  const resp=document.getElementById('f-resp').value;

  filtered=TODOS.filter(r=>{
    if(tipo&&r['Tipo Caso']!==tipo) return false;
    const e=r.Estado.trim();
    if(estado==='En Proceso'&&e!=='En Proceso'&&e!=='En proceso') return false;
    if(estado==='Suspendido'&&e!=='Suspendido') return false;
    if(alerta&&getAlerta(r.pct)!==alerta) return false;
    if(resp&&r.Responsable!==resp) return false;
    return true;
  });

  page=1;
  renderAll(filtered);
}

function resetFiltros(){
  ['f-tipo','f-estado','f-alerta','f-resp'].forEach(id=>document.getElementById(id).value='');
  filtered=[...TODOS];
  page=1;
  renderAll(filtered);
}