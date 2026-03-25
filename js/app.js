// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════
const EXCLUIR_GRUPOS = ["Gestión de Telefónia", "Desarrollo Web", "Admin. SAP", "Admin. Herramientas ITSM", "GESTOR CMDB", "Admin. CRM"];

// ═══════════════════════════════════════════════════════
// ALMACÉN DE MESES
// ═══════════════════════════════════════════════════════
const mesesDB = {};
let mesActivo = '';

// Datos iniciales de marzo 2026
const DATOS_MARZO = [/* PEGA AQUÍ EXACTAMENTE TODO tu arreglo actual completo */];

// ═══════════════════════════════════════════════════════
// ESTADO DE LA VISTA
// ═══════════════════════════════════════════════════════
let TODOS    = [];
let filtered = [];
let page     = 1;
const PER_PAGE = 25;
let sortCol = 'pct', sortAsc = false;

// ═══════════════════════════════════════════════════════
// CARGA DE EXCEL
// ═══════════════════════════════════════════════════════
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
        'Tipo Caso':        r['Tipo Caso'] || '',
        'Cod Caso':         r['Cod Caso']  || '',
        'Estado':           (r['Estado']   || '').trim(),
        'Razon de Estado':  r['Razon de Estado'] || '',
        'Progreso':         Number(r['Progreso']) || 0,
        'Ans':              Number(r['Ans'])      || 0,
        'pct':              Number(r['Progreso']) || 0,
        'Grupos':           r['Grupos']     || '',
        'Responsable':      r['Responsable']|| '',
        'Descripción':      String(r['Descripción']||'').slice(0,80).replace(/\n/g,' '),
        'Fecha de Registro':fechaStr,
        'Compañia':         r['Compañia']   || ''
      };
    })
    .sort((a,b) => b.pct - a.pct);
}

function detectarMes(rows, nombreArchivo) {
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  for (const r of rows) {
    const f = r['Fecha de Registro'];
    if (f instanceof Date) {
      return meses[f.getMonth()] + ' ' + f.getFullYear();
    }
    if (typeof f === 'string' && f.match(/\d{4}-\d{2}/)) {
      const parts = f.split('-');
      return meses[parseInt(parts[1])-1] + ' ' + parts[0];
    }
  }
  return nombreArchivo.replace(/\.xlsx?/i,'').replace(/_/g,' ');
}

// ═══════════════════════════════════════════════════════
// GESTIÓN DE MESES
// ═══════════════════════════════════════════════════════
function activarMes(nombre) {
  mesActivo = nombre;
  TODOS    = mesesDB[nombre] || [];
  filtered = [...TODOS];
  page     = 1;
  resetFiltros();
  actualizarFiltroResponsables();
}

function renderTabs() {
  const container = document.getElementById('mes-tabs');
  const nombres   = Object.keys(mesesDB);
  if (nombres.length === 0) {
    container.innerHTML = '<span class="mes-empty">Carga un Excel para agregar meses</span>';
    return;
  }
  container.innerHTML = nombres.map(n => `
    <span class="mes-tab ${n===mesActivo?'active':''}" onclick="cambiarMes('${n}')">
      ${n}
      <span class="del" onclick="eliminarMes(event,'${n}')">×</span>
    </span>
  `).join('');
}

function cambiarMes(nombre) {
  activarMes(nombre);
  renderTabs();
  document.getElementById('upload-status').textContent = 'Cargado: ' + nombre;
}

function eliminarMes(e, nombre) {
  e.stopPropagation();
  delete mesesDB[nombre];
  const nombres = Object.keys(mesesDB);
  if (nombres.length > 0) {
    activarMes(nombres[nombres.length-1]);
  } else {
    TODOS = DATOS_MARZO;
    filtered = [...TODOS];
    mesActivo = '';
    page = 1;
    actualizarFiltroResponsables();
    renderAll(filtered);
  }
  renderTabs();
}

function actualizarFiltroResponsables() {
  const fResp = document.getElementById('f-resp');
  fResp.innerHTML = '<option value="">Todos</option>';
  [...new Set(TODOS.map(r=>r.Responsable).filter(Boolean))].sort()
    .forEach(r => { const o=document.createElement('option');o.value=o.textContent=r;fResp.appendChild(o); });
}

// ═══════════════════════════════════════════════════════
// FUNCIONES DE VISUALIZACIÓN
// ═══════════════════════════════════════════════════════
function getAlerta(pct) {
  if (pct>=100) return 'vencido';
  if (pct>=70)  return 'critico';
  if (pct>=60)  return 'atencion';
  return 'normal';
}

function buildAlertBanner(data) {
  const alertas = data.filter(r => (r.Estado==='En Proceso'||r.Estado==='En proceso') && r.pct>=60 && r.pct<70);
  const banner  = document.getElementById('alert-banner');
  if (!alertas.length) { banner.classList.remove('visible'); return; }
  banner.classList.add('visible');
  document.getElementById('alert-title').textContent =
    '¡Atención! '+alertas.length+' caso'+(alertas.length>1?'s':'')+
    ' En Proceso próximo'+(alertas.length>1?'s':'')+' a vencer — 60% a 69%';
  document.getElementById('alert-items').innerHTML = alertas.map(r=>`
    <div class="alert-item">
      <div class="alert-pct">${r.pct.toFixed(0)}%</div>
      <div class="alert-info">
        <div class="alert-cod">#${r['Cod Caso']} · ${r['Tipo Caso']==='INCIDENTES'?'Incidente':'Requerimiento'}</div>
        <div class="alert-det">${r.Responsable} — ${r['Razon de Estado']}</div>
      </div>
      <div class="alert-bar-wrap"><div class="alert-bar-fill" style="width:${r.pct}%"></div></div>
    </div>`).join('');
}

function buildKPIs(data) {
  const ep = data.filter(r=>r.Estado==='En Proceso'||r.Estado==='En proceso').length;
  const su = data.filter(r=>r.Estado==='Suspendido').length;
  document.getElementById('cnt-ep').textContent = 'En proceso: '+ep;
  document.getElementById('cnt-su').textContent = 'Suspendido: '+su;
  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi normal"><div class="kpi-num">${data.filter(r=>r.pct<60).length}</div><div class="kpi-label">Normal — 0 a 59%</div><div class="kpi-sub">Sin alerta</div></div>
    <div class="kpi atencion"><div class="kpi-num">${data.filter(r=>r.pct>=60&&r.pct<70).length}</div><div class="kpi-label">Atención — 60 a 69%</div><div class="kpi-sub">Próximos a vencer</div></div>
    <div class="kpi critico"><div class="kpi-num"><span class="adot o"></span>${data.filter(r=>r.pct>=70&&r.pct<100).length}</div><div class="kpi-label">Crítico — 70 a 99%</div><div class="kpi-sub">Notificar gerentes</div></div>
    <div class="kpi vencido"><div class="kpi-num"><span class="adot r"></span>${data.filter(r=>r.pct>=100).length}</div><div class="kpi-label">Vencidos — ≥100%</div><div class="kpi-sub">Acción inmediata</div></div>`;
}

let chartAlerta, chartResp;
function buildCharts(data) {
  const g={'En Proceso':{normal:0,atencion:0,critico:0,vencido:0},'Suspendido':{normal:0,atencion:0,critico:0,vencido:0}};
  data.forEach(r=>{ const e=(r.Estado==='En proceso')?'En Proceso':r.Estado; if(g[e]) g[e][getAlerta(r.pct)]++; });
  const rr={};
  data.filter(r=>r.pct>=70).forEach(r=>{ if(r.Responsable) rr[r.Responsable]=(rr[r.Responsable]||0)+1; });
  const top=Object.entries(rr).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(chartAlerta) chartAlerta.destroy();
  if(chartResp)   chartResp.destroy();
  chartAlerta=new Chart(document.getElementById('chart-alerta'),{
    type:'bar',
    data:{labels:['En proceso','Suspendido'],datasets:[
      {label:'Normal',  data:[g['En Proceso'].normal,  g['Suspendido'].normal],  backgroundColor:'#22c55e',borderRadius:4,barThickness:26},
      {label:'Atención',data:[g['En Proceso'].atencion,g['Suspendido'].atencion],backgroundColor:'#f59e0b',borderRadius:4,barThickness:26},
      {label:'Crítico', data:[g['En Proceso'].critico, g['Suspendido'].critico], backgroundColor:'#f97316',borderRadius:4,barThickness:26},
      {label:'Vencido', data:[g['En Proceso'].vencido, g['Suspendido'].vencido], backgroundColor:'#ef4444',borderRadius:4,barThickness:26},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      scales:{x:{stacked:true},y:{stacked:true,ticks:{stepSize:5}}},
      plugins:{legend:{position:'bottom',labels:{boxWidth:9,font:{size:10},padding:8}}}
    }
  });
  if(top.length>0) chartResp=new Chart(document.getElementById('chart-resp'),{
    type:'bar',
    data:{labels:top.map(r=>{const p=r[0].split(' ');return p[0]+' '+(p[p.length-1]||'');}),
          datasets:[{data:top.map(r=>r[1]),backgroundColor:'#f97316',borderRadius:4,barThickness:13}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{x:{ticks:{font:{size:10}}},y:{ticks:{font:{size:10}}}}
    }
  });
}

function buildTable(data) {
  const sorted=[...data].sort((a,b)=>sortAsc?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));
  const start=(page-1)*PER_PAGE, slice=sorted.slice(start,start+PER_PAGE);
  document.getElementById('table-info').textContent=`${start+1}–${Math.min(start+PER_PAGE,data.length)} de ${data.length} casos`;
  document.getElementById('tabla-body').innerHTML=slice.map(r=>{
    const a=getAlerta(r.pct), ep=r.Estado==='En Proceso'||r.Estado==='En proceso';
    const icon=a==='vencido'?'<span class="adot r"></span>':a==='critico'?'<span class="adot o"></span>':'';
    return `<tr class="${a!=='normal'?'row-'+a:''}">
      <td style="font-weight:600;">${r['Cod Caso']}</td>
      <td><span class="badge ${r['Tipo Caso']==='INCIDENTES'?'badge-inc':'badge-req'}">${r['Tipo Caso']==='INCIDENTES'?'Inc.':'Req.'}</span></td>
      <td><span class="badge ${ep?'badge-ep':'badge-su'}">${ep?'En proceso':'Suspendido'}</span></td>
      <td class="td-trunc" title="${r['Razon de Estado']}">${r['Razon de Estado']}</td>
      <td class="td-trunc" title="${r.Responsable}">${r.Responsable}</td>
      <td class="td-trunc" title="${r.Compañia}" style="color:#64748b;">${r.Compañia}</td>
      <td style="color:#94a3b8;white-space:nowrap;">${r['Fecha de Registro']}</td>
      <td><div class="prog-wrap">
        <div class="prog-bar"><div class="prog-fill prog-${a}" style="width:${Math.min(r.pct,100)}%"></div></div>
        <span class="prog-pct pct-${a}">${icon}${r.pct.toFixed(0)}%</span>
      </div></td>
    </tr>`;
  }).join('');
  buildPagination(data.length);
}

function buildPagination(total) {
  const pages=Math.ceil(total/PER_PAGE), pg=document.getElementById('pagination');
  if(pages<=1){pg.innerHTML='';return;}
  pg.innerHTML=`<button onclick="goPage(${page-1})" ${page===1?'disabled':''}>‹ Ant</button>
    <span>Pág ${page} / ${pages}</span>
    <button onclick="goPage(${page+1})" ${page===pages?'disabled':''}>Sig ›</button>`;
}

function goPage(p){page=p;buildTable(filtered);}
function sortBy(col){if(sortCol===col)sortAsc=!sortAsc;else{sortCol=col;sortAsc=false;}buildTable(filtered);}

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
  page=1; renderAll(filtered);
}

function resetFiltros(){
  ['f-tipo','f-estado','f-alerta','f-resp'].forEach(id=>document.getElementById(id).value='');
  filtered=[...TODOS]; page=1; renderAll(filtered);
}

function renderAll(data){
  buildAlertBanner(data);
  buildKPIs(data);
  buildCharts(data);
  buildTable(data);
}

// ═══════════════════════════════════════════════════════
// INICIO
// ═══════════════════════════════════════════════════════
['f-tipo','f-estado','f-alerta','f-resp'].forEach(id=>
  document.getElementById(id).addEventListener('change',applyFilters));

TODOS = DATOS_MARZO;
filtered = [...TODOS];
actualizarFiltroResponsables();
renderAll(TODOS);