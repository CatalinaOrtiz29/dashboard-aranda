// Activa un mes: carga sus datos y refresca el dashboard
function activarMes(nombre) {
  mesActivo = nombre;
  TODOS     = mesesDB[nombre] || [];
  filtered  = [...TODOS];
  page      = 1;
  resetFiltros();
  actualizarFiltroResponsables();
}

// Dibuja las pestañas de meses
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
    TODOS    = DATOS_MARZO;
    filtered = [...TODOS];
    mesActivo = '';
    actualizarFiltroResponsables();
    renderAll(filtered);
    document.getElementById('upload-status').textContent = 'Cargado: marzo 2026';
  }
  renderTabs();
}

// Llama todas las funciones de render juntas
function renderAll(data) {
  buildAlertBanner(data);
  buildKPIs(data);
  buildCharts(data);
  buildTable(data);
}

// Eventos de los filtros
['f-tipo','f-estado','f-alerta','f-resp'].forEach(id =>
  document.getElementById(id).addEventListener('change', applyFilters)
);

// Inicio: cargar datos de marzo
TODOS    = DATOS_MARZO;
filtered = [...TODOS];
actualizarFiltroResponsables();
renderAll(TODOS);
