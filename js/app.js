function activarMes(nombre) {
  mesActivo = nombre;
  TODOS = mesesDB[nombre] || [];
  filtered = [...TODOS];
  page = 1;
  resetFiltros();
  actualizarFiltroResponsables();
}

function renderTabs() {
  const container = document.getElementById('mes-tabs');
  const nombres = Object.keys(mesesDB);

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
}

function eliminarMes(e, nombre) {
  e.stopPropagation();
  delete mesesDB[nombre];
}

function renderAll(data){
  buildAlertBanner(data);
  buildKPIs(data);
  buildCharts(data);
  buildTable(data);
}

// EVENTOS
['f-tipo','f-estado','f-alerta','f-resp'].forEach(id=>
  document.getElementById(id).addEventListener('change',applyFilters)
);

// INICIO
TODOS = DATOS_MARZO;
filtered = [...TODOS];
actualizarFiltroResponsables();
renderAll(TODOS);