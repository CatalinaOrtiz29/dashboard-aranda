function buildAlertBanner(data) {
  const alertas = data.filter(r => (r.Estado === 'En Proceso' || r.Estado === 'En proceso') && r.pct >= 60 && r.pct < 70);
  const banner = document.getElementById('alert-banner');

  if (!alertas.length) {
    banner.classList.remove('visible');
    return;
  }

  banner.classList.add('visible');
  document.getElementById('alert-title').textContent =
    '¡Atención! ' + alertas.length + ' caso' + (alertas.length > 1 ? 's' : '') +
    ' En Proceso próximo' + (alertas.length > 1 ? 's' : '') + ' a vencer — 60% a 69%';

  document.getElementById('alert-items').innerHTML = alertas.map(r => `
    <div class="alert-item">
      <div class="alert-pct">${r.pct.toFixed(0)}%</div>
      <div class="alert-info">
        <div class="alert-cod">#${r['Cod Caso']} · ${r['Tipo Caso'] === 'INCIDENTES' ? 'Incidente' : 'Requerimiento'}</div>
        <div class="alert-det">${r.Responsable} — ${r['Razon de Estado']}</div>
      </div>
      <div class="alert-bar-wrap">
        <div class="alert-bar-fill" style="width:${r.pct}%"></div>
      </div>
    </div>
  `).join('');
}

function buildKPIs(data) {
  const ep = data.filter(r => r.Estado === 'En Proceso' || r.Estado === 'En proceso').length;
  const su = data.filter(r => r.Estado === 'Suspendido').length;

  document.getElementById('cnt-ep').textContent = 'En proceso: ' + ep;
  document.getElementById('cnt-su').textContent = 'Suspendido: ' + su;

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi normal">
      <div class="kpi-num">${data.filter(r => r.pct < 60).length}</div>
      <div class="kpi-label">Normal — 0 a 59%</div>
      <div class="kpi-sub">Sin alerta</div>
    </div>
    <div class="kpi atencion">
      <div class="kpi-num">${data.filter(r => r.pct >= 60 && r.pct < 70).length}</div>
      <div class="kpi-label">Atención — 60 a 69%</div>
      <div class="kpi-sub">Próximos a vencer</div>
    </div>
    <div class="kpi critico">
      <div class="kpi-num"><span class="adot o"></span>${data.filter(r => r.pct >= 70 && r.pct < 100).length}</div>
      <div class="kpi-label">Crítico — 70 a 99%</div>
      <div class="kpi-sub">Notificar gerentes</div>
    </div>
    <div class="kpi vencido">
      <div class="kpi-num"><span class="adot r"></span>${data.filter(r => r.pct >= 100).length}</div>
      <div class="kpi-label">Vencidos — ≥100%</div>
      <div class="kpi-sub">Acción inmediata</div>
    </div>
  `;
}

function buildCharts(data) {
  const g = {
    'En Proceso': { normal: 0, atencion: 0, critico: 0, vencido: 0 },
    'Suspendido': { normal: 0, atencion: 0, critico: 0, vencido: 0 }
  };

  data.forEach(r => {
    const e = (r.Estado === 'En proceso') ? 'En Proceso' : r.Estado;
    if (g[e]) g[e][getAlerta(r.pct)]++;
  });

  const rr = {};
  data.filter(r => r.pct >= 70).forEach(r => {
    if (r.Responsable) rr[r.Responsable] = (rr[r.Responsable] || 0) + 1;
  });

  const top = Object.entries(rr).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (chartAlerta) chartAlerta.destroy();
  if (chartResp) chartResp.destroy();

  chartAlerta = new Chart(document.getElementById('chart-alerta'), {
    type: 'bar',
    data: {
      labels: ['En proceso', 'Suspendido'],
      datasets: [
        { label: 'Normal', data: [g['En Proceso'].normal, g['Suspendido'].normal], backgroundColor: '#22c55e', borderRadius: 4, barThickness: 26 },
        { label: 'Atención', data: [g['En Proceso'].atencion, g['Suspendido'].atencion], backgroundColor: '#f59e0b', borderRadius: 4, barThickness: 26 },
        { label: 'Crítico', data: [g['En Proceso'].critico, g['Suspendido'].critico], backgroundColor: '#f97316', borderRadius: 4, barThickness: 26 },
        { label: 'Vencido', data: [g['En Proceso'].vencido, g['Suspendido'].vencido], backgroundColor: '#ef4444', borderRadius: 4, barThickness: 26 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: { stacked: true, ticks: { stepSize: 5 } }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 9, font: { size: 10 }, padding: 8 }
        }
      }
    }
  });

  if (top.length > 0) {
    chartResp = new Chart(document.getElementById('chart-resp'), {
      type: 'bar',
      data: {
        labels: top.map(r => {
          const p = r[0].split(' ');
          return p[0] + ' ' + (p[p.length - 1] || '');
        }),
        datasets: [{
          data: top.map(r => r[1]),
          backgroundColor: '#f97316',
          borderRadius: 4,
          barThickness: 13
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}