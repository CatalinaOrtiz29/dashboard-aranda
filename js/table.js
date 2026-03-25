// Dibuja las filas de la tabla
function buildTable(data) {
  const sorted = [...data].sort((a,b) =>
    sortAsc ? (a[sortCol]>b[sortCol]?1:-1) : (a[sortCol]<b[sortCol]?1:-1)
  );
  const start = (page-1) * PER_PAGE;
  const slice = sorted.slice(start, start+PER_PAGE);
  document.getElementById('table-info').textContent =
    `${start+1}–${Math.min(start+PER_PAGE,data.length)} de ${data.length} casos`;
  document.getElementById('tabla-body').innerHTML = slice.map(r => {
    const a  = getAlerta(r.pct);
    const ep = r.Estado==='En Proceso'||r.Estado==='En proceso';
    const icon = a==='vencido'?'<span class="adot r"></span>':a==='critico'?'<span class="adot o"></span>':'';
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

// Controles de paginación
function buildPagination(total) {
  const pages = Math.ceil(total/PER_PAGE);
  const pg    = document.getElementById('pagination');
  if (pages<=1) { pg.innerHTML=''; return; }
  pg.innerHTML = `
    <button onclick="goPage(${page-1})" ${page===1?'disabled':''}>‹ Ant</button>
    <span>Pág ${page} / ${pages}</span>
    <button onclick="goPage(${page+1})" ${page===pages?'disabled':''}>Sig ›</button>`;
}

function goPage(p) { page=p; buildTable(filtered); }

function sortBy(col) {
  if (sortCol===col) sortAsc=!sortAsc;
  else { sortCol=col; sortAsc=false; }
  buildTable(filtered);
}
