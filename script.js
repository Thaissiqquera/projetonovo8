// script.js

function setupNavigation() {
  const sections = ['clusters','campanhas','regressao','clv'];
  sections.forEach(key => {
    document.getElementById(`btn-${key}`).addEventListener('click', () => {
      sections.forEach(k => {
        document.getElementById(k).classList.toggle('active', k===key);
        document.getElementById(`btn-${k}`).classList.toggle('active', k===key);
      });
      loadFunctions[key]();
    });
  });
}

const loadFunctions = {
  clusters: loadClusters,
  campanhas: loadCampanhas,
  regressao: loadRegressao,
  clv: loadClv
};

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadClusters();
});

// === Carrega JSONs estáticos ===
function loadClusters() {
  fetch('clusters.json')
    .then(r => r.json())
    .then(data => {
      renderClusterViz(data.clientes);
      renderClusterInfo(data.clusters);
    });
}
function loadCampanhas() {
  fetch('campanhas.json')
    .then(r=>r.json()).then(d=>{
      renderBar('campanhas-roi', d.campanhas.map(x=>x.nome), d.campanhas.map(x=>x.roi), 'ROI Estimado');
      renderBar('campanhas-gasto', d.campanhas.map(x=>x.nome), d.campanhas.map(x=>x.gasto_medio), 'Gasto Médio');
    });
}
function loadRegressao() {
  fetch('regressao.json')
    .then(r=>r.json()).then(d=>{
      renderBar('coef-campanhas', d.coeficientes.map(x=>x.variavel), d.coeficientes.map(x=>x.coeficiente), 'Campanhas');
      renderBar('coef-clientes', d.coeficientes.map(x=>x.variavel), d.coeficientes.map(x=>x.coeficiente), 'Perfil Cliente');
    });
}
function loadClv() {
  fetch('clv.json')
    .then(r=>r.json()).then(d=>{
      renderBar('clv-dist', d.distribuicao.map(x=>x.faixa), d.distribuicao.map(x=>x.count), 'Distribuição CLV');
      showClvStats(d.estatisticas);
    });
}

// helper to render Chart.js bar
function renderBar(el, labels, data, label) {
  const ctx = document.getElementById(el).getContext('2d');
  new Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label, data }] }, options:{ responsive:true } });
}

function renderClusterViz(clientes) {
  const c = document.getElementById('clusters-viz'); c.innerHTML='';
  const svg = d3.select(c).append('svg')
    .attr('width',c.clientWidth).attr('height',c.clientHeight);
  const x = d3.scaleLinear().domain(d3.extent(clientes,d=>d.pca1)).nice().range([40,c.clientWidth-20]);
  const y = d3.scaleLinear().domain(d3.extent(clientes,d=>d.pca2)).nice().range([c.clientHeight-20,20]);
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  svg.selectAll('circle').data(clientes).enter().append('circle')
      .attr('class','dot').attr('cx',d=>x(d.pca1)).attr('cy',d=>y(d.pca2)).attr('r',5).attr('fill',d=>color(d.cluster));
  svg.append('g').attr('transform',`translate(0,${c.clientHeight-20})`).call(d3.axisBottom(x));
  svg.append('g').attr('transform','translate(40,0)').call(d3.axisLeft(y));
}

function renderClusterInfo(clusters) {
  const e = document.getElementById('clusters-info'); e.innerHTML='';
  clusters.forEach(c=>{
    const d = document.createElement('div'); d.className='cluster-info';
    d.innerHTML=`<h4>Cluster ${c.id}: ${c.tipo}</h4><ul><li>Frequência média: ${c.frequencia_media.toFixed(2)}</li><li>Gasto médio: R$ ${c.gasto_total_medio.toFixed(2)}</li><li>Dias desde última compra (média): ${c.dias_ultima_compra.toFixed(2)}</li><li>Clientes: ${c.clientes_count}</li></ul>`;
    e.appendChild(d);
  });
}

function showClvStats(s) {
  const e = document.getElementById('clv-stats');
  e.innerHTML = Object.entries(s).map(([k,v]) => `<div class="clv-stat"><span>${k.replace(/_/g,' ')}</span><span>R$ ${v.toFixed(2)}</span></div>`).join('');
}
