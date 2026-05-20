// EdgeMind Dashboard Core Script - Real-Time Control Room Logic

// Global state for live metric streams
const dashboardState = {
  clock: new Date('2026-05-20T08:25:00+05:30'),
  
  // Namespace sparkline datasets (8 data points)
  sparklines: {
    'kube-system': {
      cpu: [12, 14, 11, 15, 13, 12, 14, 13],
      mem: [34, 34, 35, 34, 35, 34, 34, 35],
      disk: [21, 21, 21, 21, 21, 21, 21, 21],
      net: [5, 6, 5, 7, 6, 5, 8, 7]
    },
    'abb-edgenius': {
      cpu: [22, 24, 25, 23, 26, 24, 28, 29],
      mem: [45, 46, 45, 47, 46, 45, 47, 48],
      disk: [30, 30, 31, 31, 31, 31, 32, 32],
      net: [18, 22, 25, 20, 28, 32, 35, 38]
    },
    'abb-genix': {
      cpu: [25, 28, 30, 35, 48, 62, 79, 87],
      mem: [50, 52, 55, 58, 65, 72, 78, 82],
      disk: [40, 41, 42, 45, 50, 60, 71, 78],
      net: [12, 15, 14, 18, 22, 28, 30, 24]
    },
    'monitoring': {
      cpu: [15, 18, 16, 17, 19, 18, 20, 19],
      mem: [68, 69, 69, 70, 70, 71, 72, 72],
      disk: [48, 48, 48, 48, 48, 48, 49, 49],
      net: [8, 9, 8, 10, 9, 11, 10, 11]
    },
    'sensor-sim': {
      cpu: [15, 16, 15, 18, 22, 26, 32, 38],
      mem: [20, 21, 20, 22, 24, 30, 35, 42],
      disk: [12, 12, 12, 12, 12, 12, 12, 12],
      net: [40, 45, 50, 65, 95, 140, 220, 320]
    }
  },

  // Panel 4 Charts datasets (20 data points)
  charts: {
    cpu: {
      scorer: [12, 14, 11, 13, 15, 12, 14, 16, 15, 14, 16, 20, 24, 38, 55, 68, 79, 82, 85, 87.3],
      extractor: [40, 42, 41, 43, 44, 45, 43, 45, 46, 44, 45, 45, 44, 46, 45, 45, 44, 45, 45, 45],
      base1: [10, 12, 11, 14, 12, 10, 11, 13, 12, 11, 10, 12, 14, 13, 11, 12, 10, 11, 12, 13],
      base2: [18, 16, 17, 15, 19, 16, 15, 17, 18, 16, 15, 16, 18, 17, 16, 15, 17, 16, 15, 16]
    },
    mem: {
      model: [50, 52, 54, 57, 59, 61, 64, 66, 68, 70, 73, 75, 77, 79, 81, 83, 85, 87, 88, 89.2],
      scorer: [40, 41, 40, 42, 41, 43, 42, 45, 48, 52, 57, 63, 68, 72, 75, 78, 80, 81, 81.5, 82.1]
    },
    pvc: [
      { name: 'opc-ua', val: 15.2, isAlert: false },
      { name: 'alert-mgr', val: 18.2, isAlert: false },
      { name: 'feat-ext', val: 33.4, isAlert: false },
      { name: 'model-srv', val: 45.1, isAlert: false },
      { name: 'prom', val: 54.2, isAlert: false },
      { name: 'historian', val: 78.1, isAlert: true }
    ],
    net: {
      egress: [0.1, 0.15, 0.12, 0.18, 0.2, 0.15, 0.18, 0.22, 0.2, 0.15, 0.18, 0.3, 0.6, 1.2, 2.1, 2.8, 3.1, 3.2, 3.2, 3.2],
      ingress: [0.1, 0.12, 0.11, 0.15, 0.18, 0.14, 0.16, 0.2, 0.18, 0.15, 0.16, 0.25, 0.5, 0.9, 1.6, 2.2, 2.5, 2.7, 2.8, 2.9]
    }
  },

  // Panel 7 Agent Sparkline datasets (10 data points)
  agents: {
    cpu: [10, 12, 11, 14, 13, 22, 45, 68, 79, 87],
    memory: [40, 42, 45, 48, 52, 57, 63, 71, 80, 89],
    storage: [15, 18, 22, 28, 35, 44, 52, 61, 70, 78],
    network: [5, 4, 6, 5, 8, 12, 45, 120, 240, 320],
    orchestrator: [30, 25, 48, 62, 35, 78, 92, 54, 88, 70]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  renderSparklines();
  initPipelineGraph();
  renderMetricCharts();
  renderAgentSparklines();
  setupInteractivity();
  initCopilotChat();
  
  // Start the live updates engine
  startLiveUpdates();
});

// 1. REAL-TIME CLOCK
function initClock() {
  const clockEl = document.getElementById('navbar-clock');
  if (!clockEl) return;

  function updateClock() {
    dashboardState.clock.setSeconds(dashboardState.clock.getSeconds() + 1);
    
    const year = dashboardState.clock.getFullYear();
    const month = String(dashboardState.clock.getMonth() + 1).padStart(2, '0');
    const day = String(dashboardState.clock.getDate()).padStart(2, '0');
    
    const hours = String(dashboardState.clock.getHours()).padStart(2, '0');
    const minutes = String(dashboardState.clock.getMinutes()).padStart(2, '0');
    const seconds = String(dashboardState.clock.getSeconds()).padStart(2, '0');
    
    clockEl.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// 2. NAMESPACE SPARKLINES (PANEL 1)
function renderSparklines() {
  Object.keys(dashboardState.sparklines).forEach(ns => {
    const metrics = dashboardState.sparklines[ns];
    Object.keys(metrics).forEach(metric => {
      const svgId = `spark-${ns}-${metric}`;
      const svg = document.getElementById(svgId);
      if (!svg) return;

      const points = metrics[metric];
      drawSparkline(svg, points, ns === 'abb-genix' || (ns === 'sensor-sim' && metric === 'net'));
    });
  });
}

function drawSparkline(svg, points, isAlert) {
  const width = 80;
  const height = 14;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const max = 100; // Use percentage scale
  const min = 0;

  const xGap = width / (points.length - 1);
  let pathD = '';

  points.forEach((val, i) => {
    const x = i * xGap;
    const y = height - ((val - min) / (max - min)) * (height - 2) - 1;
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '1');
  
  if (isAlert) {
    path.setAttribute('stroke', '#C0001A');
  } else {
    path.setAttribute('stroke', '#00875A');
  }

  svg.innerHTML = '';
  svg.appendChild(path);
}

// 3. PIPELINE DEPENDENCY GRAPH (PANEL 3)
function initPipelineGraph() {
  // SVG pipeline is drawn statically in index.html, with animations defined in index.css.
  // Click-based node highlights map to table selection.
}

// 4. REAL-TIME METRIC CHARTS (PANEL 4)
function renderMetricCharts() {
  const cpuSvg = document.getElementById('chart-cpu-svg');
  if (cpuSvg) drawCPUChart(cpuSvg);

  const memSvg = document.getElementById('chart-mem-svg');
  if (memSvg) drawMemChart(memSvg);

  const pvcSvg = document.getElementById('chart-pvc-svg');
  if (pvcSvg) drawPVCChart(pvcSvg);

  const netSvg = document.getElementById('chart-net-svg');
  if (netSvg) drawNetChart(netSvg);
}

function drawCPUChart(svg) {
  const width = 390;
  const height = 75;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const padding = { top: 6, right: 10, bottom: 12, left: 24 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const data = dashboardState.charts.cpu;
  let svgContent = '';

  // Grid lines
  [25, 50, 75, 100].forEach(v => {
    const y = padding.top + graphHeight - (v / 100) * graphHeight;
    svgContent += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" stroke="#F5F5F7" stroke-width="1" />`;
    svgContent += `<text x="${padding.left - 4}" y="${y + 3}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">${v}%</text>`;
  });

  // X Axis labels
  svgContent += `<text x="${padding.left}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="start">-5m</text>`;
  svgContent += `<text x="${padding.left + graphWidth / 2}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="middle">-2.5m</text>`;
  svgContent += `<text x="${width - padding.right}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">NOW</text>`;

  const getPathD = (points) => {
    const xGap = graphWidth / (points.length - 1);
    let path = '';
    points.forEach((val, idx) => {
      const x = padding.left + idx * xGap;
      const y = padding.top + graphHeight - (val / 100) * graphHeight;
      path += (idx === 0) ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return path;
  };

  // Baselines
  svgContent += `<path d="${getPathD(data.base1)}" fill="none" stroke="#D8D8D8" stroke-width="0.8" />`;
  svgContent += `<path d="${getPathD(data.base2)}" fill="none" stroke="#D8D8D8" stroke-width="0.8" />`;

  // Feature Extractor (Purple)
  svgContent += `<path d="${getPathD(data.extractor)}" fill="none" stroke="#5B21B6" stroke-width="1.2" />`;

  // Anomaly Scorer (Bold Red)
  svgContent += `<path d="${getPathD(data.scorer)}" fill="none" stroke="#C0001A" stroke-width="1.8" />`;
  
  // Last point marker
  const lastVal = data.scorer[data.scorer.length - 1];
  const lastX = padding.left + graphWidth;
  const lastY = padding.top + graphHeight - (lastVal / 100) * graphHeight;
  svgContent += `<circle cx="${lastX}" cy="${lastY}" r="3" fill="#C0001A" />`;

  // Update navbar visual metric card value text
  const valContainer = svg.closest('.mini-chart-card').querySelector('.mini-chart-value');
  if (valContainer) valContainer.textContent = lastVal.toFixed(1) + '%';

  svg.innerHTML = svgContent;
}

function drawMemChart(svg) {
  const width = 390;
  const height = 75;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const padding = { top: 6, right: 10, bottom: 12, left: 24 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const data = dashboardState.charts.mem;
  let svgContent = '';

  // Grid lines
  [25, 50, 75, 100].forEach(v => {
    const y = padding.top + graphHeight - (v / 100) * graphHeight;
    svgContent += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" stroke="#F5F5F7" stroke-width="1" />`;
    svgContent += `<text x="${padding.left - 4}" y="${y + 3}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">${v}%</text>`;
  });

  // OOMKill Risk Threshold at 90%
  const oomY = padding.top + graphHeight - (90 / 100) * graphHeight;
  svgContent += `<line x1="${padding.left}" y1="${oomY}" x2="${width - padding.right}" y2="${oomY}" class="threshold-line" stroke="#C0001A" stroke-dasharray="2,2" stroke-width="1" />`;
  svgContent += `<text x="${width - padding.right - 4}" y="${oomY - 3}" class="threshold-label" fill="#C0001A" font-family="DM Mono" font-size="7.5px" text-anchor="end">OOMKill Risk (90%)</text>`;

  // X Axis labels
  svgContent += `<text x="${padding.left}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="start">-5m</text>`;
  svgContent += `<text x="${width - padding.right}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">NOW</text>`;

  const getPathD = (points) => {
    const xGap = graphWidth / (points.length - 1);
    let path = '';
    points.forEach((val, idx) => {
      const x = padding.left + idx * xGap;
      const y = padding.top + graphHeight - (val / 100) * graphHeight;
      path += (idx === 0) ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return path;
  };

  const getAreaD = (points) => {
    const path = getPathD(points);
    const lastX = padding.left + graphWidth;
    return `${path} L ${lastX} ${padding.top + graphHeight} L ${padding.left} ${padding.top + graphHeight} Z`;
  };

  // Draw Model-server (Purple Area)
  svgContent += `<path d="${getAreaD(data.model)}" fill="rgba(91, 33, 182, 0.08)" stroke="none" />`;
  svgContent += `<path d="${getPathD(data.model)}" fill="none" stroke="#5B21B6" stroke-width="1.2" />`;

  // Draw Anomaly-scorer (Red Area)
  svgContent += `<path d="${getAreaD(data.scorer)}" fill="rgba(192, 0, 26, 0.06)" stroke="none" />`;
  svgContent += `<path d="${getPathD(data.scorer)}" fill="none" stroke="#C0001A" stroke-width="1.2" />`;

  // Update navbar visual metric card value text
  const lastVal = data.model[data.model.length - 1];
  const valContainer = svg.closest('.mini-chart-card').querySelector('.mini-chart-value');
  if (valContainer) valContainer.textContent = lastVal.toFixed(1) + '%';

  svg.innerHTML = svgContent;
}

function drawPVCChart(svg) {
  const width = 390;
  const height = 75;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const padding = { top: 6, right: 10, bottom: 12, left: 24 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const data = dashboardState.charts.pvc;
  let svgContent = '';

  // Grid lines
  [25, 50, 75, 100].forEach(v => {
    const y = padding.top + graphHeight - (v / 100) * graphHeight;
    svgContent += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" stroke="#F5F5F7" stroke-width="1" />`;
    svgContent += `<text x="${padding.left - 4}" y="${y + 3}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">${v}%</text>`;
  });

  // Critical threshold at 90%
  const critY = padding.top + graphHeight - (90 / 100) * graphHeight;
  svgContent += `<line x1="${padding.left}" y1="${critY}" x2="${width - padding.right}" y2="${critY}" class="threshold-line" stroke="#C0001A" stroke-dasharray="2,2" stroke-width="1" />`;
  svgContent += `<text x="${width - padding.right - 4}" y="${critY - 3}" class="threshold-label" fill="#C0001A" font-family="DM Mono" font-size="7.5px" text-anchor="end">Critical (90%)</text>`;

  const numBars = data.length;
  const barGap = 12;
  const barWidth = (graphWidth - (numBars - 1) * barGap) / numBars;

  data.forEach((item, idx) => {
    const x = padding.left + idx * (barWidth + barGap);
    const barH = (item.val / 100) * graphHeight;
    const y = padding.top + graphHeight - barH;

    const fill = item.isAlert ? '#C0001A' : '#7A7A7A';

    svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${fill}" />`;
    svgContent += `<text x="${x + barWidth / 2}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#3A3A3A" text-anchor="middle">${item.name}</text>`;
    svgContent += `<text x="${x + barWidth / 2}" y="${y - 3}" font-family="DM Mono" font-size="7.5px" fill="${fill}" font-weight="bold" text-anchor="middle">${item.val.toFixed(1)}%</text>`;

    if (item.isAlert) {
      svgContent += `
        <g transform="translate(${x + barWidth - 4}, ${y - 12})">
          <path d="M 0 4 L 3 1 L 6 4 M 3 1 L 3 7" fill="none" stroke="#C0001A" stroke-width="1" />
        </g>
      `;
    }
  });

  // Update card header text
  const lastVal = data.find(i => i.isAlert).val;
  const valContainer = svg.closest('.mini-chart-card').querySelector('.mini-chart-value');
  if (valContainer) valContainer.textContent = lastVal.toFixed(1) + '%';

  svg.innerHTML = svgContent;
}

function drawNetChart(svg) {
  const width = 390;
  const height = 75;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const padding = { top: 6, right: 10, bottom: 12, left: 30 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const data = dashboardState.charts.net;
  let svgContent = '';
  const maxVal = 4.0;

  // Grid lines
  [1.0, 2.0, 3.0, 4.0].forEach(v => {
    const y = padding.top + graphHeight - (v / maxVal) * graphHeight;
    svgContent += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="chart-grid-line" stroke="#F5F5F7" stroke-width="1" />`;
    svgContent += `<text x="${padding.left - 4}" y="${y + 3}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">${v}MB</text>`;
  });

  // X Axis labels
  svgContent += `<text x="${padding.left}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="start">-5m</text>`;
  svgContent += `<text x="${width - padding.right}" y="${height - 2}" font-family="DM Mono" font-size="7.5px" fill="#7A7A7A" text-anchor="end">NOW</text>`;

  const getPathD = (points) => {
    const xGap = graphWidth / (points.length - 1);
    let path = '';
    points.forEach((val, idx) => {
      const x = padding.left + idx * xGap;
      const y = padding.top + graphHeight - (val / maxVal) * graphHeight;
      path += (idx === 0) ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return path;
  };

  // Ingress (Amber)
  svgContent += `<path d="${getPathD(data.ingress)}" fill="none" stroke="#D97706" stroke-width="1.2" />`;
  // Egress (Bold Red)
  svgContent += `<path d="${getPathD(data.egress)}" fill="none" stroke="#C0001A" stroke-width="1.8" />`;

  const lastEgress = data.egress[data.egress.length - 1];
  const lastIngress = data.ingress[data.ingress.length - 1];
  const lastX = padding.left + graphWidth;
  const egressY = padding.top + graphHeight - (lastEgress / maxVal) * graphHeight;
  const ingressY = padding.top + graphHeight - (lastIngress / maxVal) * graphHeight;

  svgContent += `<circle cx="${lastX}" cy="${egressY}" r="3" fill="#C0001A" />`;
  svgContent += `<circle cx="${lastX}" cy="${ingressY}" r="3" fill="#D97706" />`;

  // Update card header text
  const valContainer = svg.closest('.mini-chart-card').querySelector('.mini-chart-value');
  if (valContainer) valContainer.textContent = lastEgress.toFixed(1) + ' MB/s';

  svg.innerHTML = svgContent;
}

// 5. AGENT STATUS BAR SPARKLINES (PANEL 7)
function renderAgentSparklines() {
  Object.keys(dashboardState.agents).forEach(agent => {
    const svgId = `agent-spark-${agent}`;
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const points = dashboardState.agents[agent];
    drawAgentSparkline(svg, points, agent === 'network' || agent === 'storage');
  });
}

function drawAgentSparkline(svg, points, isAlert) {
  const width = 50;
  const height = 18;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const max = Math.max(...points) || 100;
  const min = Math.min(...points) || 0;

  const xGap = width / (points.length - 1);
  let pathD = '';

  points.forEach((val, i) => {
    const x = i * xGap;
    const y = height - ((val - min) / (max - min || 1)) * (height - 2) - 1;
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '1.2');
  
  if (isAlert) {
    path.setAttribute('stroke', '#C0001A');
  } else {
    if (svg.id.includes('orchestrator')) {
      path.setAttribute('stroke', '#5B21B6');
    } else {
      path.setAttribute('stroke', '#00875A');
    }
  }

  svg.innerHTML = '';
  svg.appendChild(path);
}

// 6. INTERACTIVE AND SELECTION EFFECTS
function setupInteractivity() {
  const tableRows = document.querySelectorAll('.pod-table tbody tr');
  const graphNodes = document.querySelectorAll('.graph-node-group');
  
  tableRows.forEach(row => {
    row.addEventListener('click', () => {
      tableRows.forEach(r => r.classList.remove('row-selected'));
      row.classList.add('row-selected');
      
      const podName = row.querySelector('.pod-name').textContent.trim();
      highlightGraphNode(podName);
    });
  });

  graphNodes.forEach(node => {
    node.addEventListener('click', () => {
      const textNode = node.querySelector('.graph-node-title');
      if (!textNode) return;
      const nodeName = textNode.textContent.trim().toLowerCase();
      
      let matchedRow = null;
      tableRows.forEach(row => {
        const podName = row.querySelector('.pod-name').textContent.trim().toLowerCase();
        if (podName.includes(nodeName) || nodeName.includes(podName) || podName.substring(0, 6) === nodeName.substring(0, 6)) {
          matchedRow = row;
        }
      });

      if (matchedRow) {
        tableRows.forEach(r => r.classList.remove('row-selected'));
        matchedRow.classList.add('row-selected');
        matchedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Highlight this node and dim others
        const cleanPodName = matchedRow.querySelector('.pod-name').textContent.trim();
        highlightGraphNode(cleanPodName);
      }
    });
  });

  const gear = document.querySelector('.navbar-settings');
  if (gear) {
    gear.addEventListener('click', () => {
      alert('EdgeMind Cluster Configuration:\nCluster: edge-node-01\nVersion: k3s v1.28\nStatus: Active Anomaly (Motor-2 Cascade)\nOrchestrator: active');
    });
  }
}

function highlightGraphNode(podName) {
  const nodes = document.querySelectorAll('.graph-node-group');
  const cleanPodName = podName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  nodes.forEach(n => {
    n.style.opacity = '0.4';
    const textNode = n.querySelector('.graph-node-title');
    if (!textNode) return;
    
    const text = textNode.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (cleanPodName.includes(text) || text.includes(cleanPodName) || cleanPodName.substring(0, 6) === text.substring(0, 6)) {
      n.style.opacity = '1.0';
    }
  });
}

// 7. REAL-TIME SIMULATION ENGINE (Fluctuates charts & pod numbers)
function startLiveUpdates() {
  setInterval(() => {
    // A. Fluctuates Namespace Sparklines
    Object.keys(dashboardState.sparklines).forEach(ns => {
      const metrics = dashboardState.sparklines[ns];
      Object.keys(metrics).forEach(metric => {
        const points = metrics[metric];
        let lastVal = points[points.length - 1];
        
        // Add random fluctuation
        let delta = (Math.random() - 0.5) * 4;
        let newVal = lastVal + delta;
        
        // Boundaries based on status
        if (ns === 'abb-genix') {
          if (metric === 'cpu') newVal = Math.max(82, Math.min(94, newVal));
          else if (metric === 'mem') newVal = Math.max(78, Math.min(86, newVal));
          else if (metric === 'disk') newVal = Math.max(74, Math.min(82, newVal));
          else newVal = Math.max(15, Math.min(30, newVal));
        } else if (ns === 'sensor-sim' && metric === 'net') {
          newVal = Math.max(300, Math.min(340, newVal));
        } else {
          newVal = Math.max(2, Math.min(75, newVal));
        }
        
        points.shift();
        points.push(newVal);
      });
    });
    renderSparklines();

    // B. Fluctuates Metric Charts (Panel 4)
    // CPU
    const cpu = dashboardState.charts.cpu;
    cpu.scorer.shift();
    cpu.scorer.push(cpu.scorer[cpu.scorer.length - 1] + (Math.random() - 0.5) * 1.5);
    cpu.scorer[cpu.scorer.length - 1] = Math.max(85, Math.min(91, cpu.scorer[cpu.scorer.length - 1]));
    
    cpu.extractor.shift();
    cpu.extractor.push(cpu.extractor[cpu.extractor.length - 1] + (Math.random() - 0.5) * 1.0);
    cpu.extractor[cpu.extractor.length - 1] = Math.max(43, Math.min(47, cpu.extractor[cpu.extractor.length - 1]));
    
    cpu.base1.shift();
    cpu.base1.push(cpu.base1[cpu.base1.length - 1] + (Math.random() - 0.5) * 0.8);
    cpu.base1[cpu.base1.length - 1] = Math.max(8, Math.min(15, cpu.base1[cpu.base1.length - 1]));
    
    cpu.base2.shift();
    cpu.base2.push(cpu.base2[cpu.base2.length - 1] + (Math.random() - 0.5) * 0.8);
    cpu.base2[cpu.base2.length - 1] = Math.max(13, Math.min(20, cpu.base2[cpu.base2.length - 1]));

    // MEM
    const mem = dashboardState.charts.mem;
    mem.model.shift();
    mem.model.push(mem.model[mem.model.length - 1] + (Math.random() - 0.5) * 0.6);
    mem.model[mem.model.length - 1] = Math.max(88, Math.min(89.8, mem.model[mem.model.length - 1]));
    
    mem.scorer.shift();
    mem.scorer.push(mem.scorer[mem.scorer.length - 1] + (Math.random() - 0.5) * 0.6);
    mem.scorer[mem.scorer.length - 1] = Math.max(81, Math.min(83.5, mem.scorer[mem.scorer.length - 1]));

    // PVC (Slow grow of the historian)
    const pvc = dashboardState.charts.pvc;
    const historian = pvc.find(i => i.isAlert);
    historian.val += 0.01; // Grows slowly
    if (historian.val > 88) historian.val = 78.1;
    pvc.forEach(item => {
      if (!item.isAlert) {
        item.val += (Math.random() - 0.5) * 0.1;
        item.val = Math.max(5, Math.min(60, item.val));
      }
    });

    // NET
    const net = dashboardState.charts.net;
    net.egress.shift();
    net.egress.push(net.egress[net.egress.length - 1] + (Math.random() - 0.5) * 0.15);
    net.egress[net.egress.length - 1] = Math.max(3.0, Math.min(3.4, net.egress[net.egress.length - 1]));
    
    net.ingress.shift();
    net.ingress.push(net.ingress[net.ingress.length - 1] + (Math.random() - 0.5) * 0.12);
    net.ingress[net.ingress.length - 1] = Math.max(2.7, Math.min(3.1, net.ingress[net.ingress.length - 1]));

    renderMetricCharts();

    // C. Fluctuates Agent Sparklines (Panel 7)
    Object.keys(dashboardState.agents).forEach(agent => {
      const points = dashboardState.agents[agent];
      let lastVal = points[points.length - 1];
      let delta = (Math.random() - 0.5) * (agent === 'network' ? 12 : 3);
      let newVal = lastVal + delta;
      
      if (agent === 'network') newVal = Math.max(290, Math.min(340, newVal));
      else if (agent === 'storage') newVal = Math.max(75, Math.min(82, newVal));
      else if (agent === 'cpu') newVal = Math.max(82, Math.min(92, newVal));
      else if (agent === 'memory') newVal = Math.max(85, Math.min(92, newVal));
      else newVal = Math.max(50, Math.min(95, newVal));
      
      points.shift();
      points.push(newVal);
    });
    renderAgentSparklines();

    // D. Fluctuates Pod Table Row Values
    updateTableDOMValues();

  }, 2000);
}

function updateTableDOMValues() {
  const rows = document.querySelectorAll('.pod-table tbody tr');
  rows.forEach(row => {
    const nameNode = row.querySelector('.pod-name');
    if (!nameNode) return;
    
    const podName = nameNode.textContent.trim();
    
    // Row indices: 2=CPU, 3=MEM, 4=DISK, 5=NET
    if (podName === 'anomaly-scorer') {
      fluctuateTableCell(row.cells[2], 86.0, 88.9);
      fluctuateTableCell(row.cells[3], 81.5, 83.2);
      fluctuateNetCell(row.cells[5], 1.6, 2.0);
    } else if (podName === 'data-historian') {
      fluctuateTableCell(row.cells[2], 50.0, 54.5);
      fluctuateTableCell(row.cells[3], 63.5, 66.0);
      fluctuateTableCell(row.cells[4], 78.0, 78.5); // PVC slowly growing
      fluctuateNetCell(row.cells[5], 2.2, 2.6);
    } else if (podName === 'motor-sim-2') {
      fluctuateTableCell(row.cells[2], 37.0, 39.5);
      fluctuateTableCell(row.cells[3], 41.0, 43.5);
      fluctuateNetCell(row.cells[5], 3.0, 3.4);
    } else if (podName === 'opc-ua-connector') {
      fluctuateTableCell(row.cells[2], 70.5, 73.5);
      fluctuateTableCell(row.cells[3], 57.0, 59.5);
      fluctuateNetCell(row.cells[5], 2.7, 3.1);
    } else if (podName === 'model-server') {
      fluctuateTableCell(row.cells[2], 33.5, 36.5);
      fluctuateTableCell(row.cells[3], 88.5, 89.9);
      fluctuateNetCell(row.cells[5], 0.2, 0.4);
    } else {
      // General small fluctuations for all other pods
      const cpuCell = row.cells[2];
      const memCell = row.cells[3];
      const netCell = row.cells[5];
      
      if (cpuCell) fluctuateTableCell(cpuCell, 1.0, 30.0);
      if (memCell) fluctuateTableCell(memCell, 5.0, 75.0);
      if (netCell) fluctuateNetCell(netCell, 0.05, 3.8);
    }
  });
}

function fluctuateTableCell(cell, minLimit, maxLimit) {
  const valEl = cell.querySelector('.resource-val');
  const fillEl = cell.querySelector('.resource-fill');
  if (!valEl || !fillEl) return;
  
  let currentVal = parseFloat(valEl.textContent);
  if (isNaN(currentVal)) return;
  
  let newVal = currentVal + (Math.random() - 0.5) * 0.6;
  newVal = Math.max(minLimit, Math.min(maxLimit, newVal));
  
  valEl.textContent = newVal.toFixed(1) + '%';
  fillEl.style.width = Math.round(newVal) + '%';
}

function fluctuateNetCell(cell, minLimit, maxLimit) {
  let currentVal = parseFloat(cell.textContent);
  if (isNaN(currentVal)) return;
  
  let newVal = currentVal + (Math.random() - 0.5) * 0.1;
  newVal = Math.max(minLimit, Math.min(maxLimit, newVal));
  
  cell.textContent = newVal.toFixed(1) + ' MB/s';
}

// 8. COPILOT CHATBOT DRAWER
function initCopilotChat() {
  const trigger = document.getElementById('copilot-trigger');
  const windowBox = document.getElementById('copilot-window');
  const closeBtn = document.getElementById('chat-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const messagesBox = document.getElementById('chat-messages-box');
  const chips = document.querySelectorAll('.chat-chip');

  if (!trigger || !windowBox || !closeBtn || !chatForm) return;

  // Toggle open/close
  trigger.addEventListener('click', () => {
    windowBox.classList.toggle('hidden');
    if (!windowBox.classList.contains('hidden')) {
      chatInput.focus();
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }
  });

  closeBtn.addEventListener('click', () => {
    windowBox.classList.add('hidden');
  });

  // Handle chips clicks
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.getAttribute('data-query');
      handleUserQuery(query);
    });
  });

  // Handle form submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;
    chatInput.value = '';
    handleUserQuery(query);
  });

  function handleUserQuery(query) {
    // Add user message
    appendMessage('Operator', query, 'outgoing');
    
    // Add typing indicator
    const typingId = appendMessage('Orchestrator Agent', 'Analyzing telemetry...', 'incoming typing');
    
    // Auto scroll
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Simulate response delay
    setTimeout(() => {
      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      let reply = '';
      const clean = query.toLowerCase();

      if (clean.includes('root') || clean.includes('cause')) {
        reply = 'The root cause is a high-vibration signature emitted by <code>motor-sim-2</code> in the <code>sensor-sim</code> namespace. This vibration data flood is saturating the OPC-UA connector (<code>opc-ua-connector</code>) and writing to the <code>data-historian</code> PVC at an elevated rate of 2.4 MB/s, eventually throttling <code>anomaly-scorer</code> due to CPU resource exhaustion.';
      } else if (clean.includes('action') || clean.includes('recommend') || clean.includes('do')) {
        reply = 'I recommend the following immediate actions:<br/>1. Verify <strong>motor-sim-2</strong> mechanical bearing condition (abnormal vibration signature across 0–20 kHz FFT range).<br/>2. Expand <strong>data-historian</strong> PVC allocation immediately (less than 5.5 hours remaining).<br/>3. Throttle the <strong>cloud-sync</strong> pod to free up CPU headroom for anomaly-scorer inference scoring.';
      } else if (clean.includes('cpu') || clean.includes('scorer') || clean.includes('throttle')) {
        reply = 'The <code>anomaly-scorer</code> pod in the <code>abb-genix</code> namespace is currently running at <strong>87.2% CPU utilization</strong> and experiencing throttling. This delay increases inference latency by up to 45 seconds, which may delay downstream motor fault alerts.';
      } else if (clean.includes('diagnose') || clean.includes('diagnostic') || clean.includes('run')) {
        reply = 'Executing cluster-wide diagnostic scan...<br/><strong>Specialist Agent findings:</strong><br/>• CPU Agent: Warning (anomaly-scorer throttling at 87.2% CPU)<br/>• Memory Agent: Normal (all heaps stable)<br/>• Storage Agent: Alert (data-historian PVC capacity at 78.1%)<br/>• Network Agent: Warning (high ingress on OPC-UA connector)<br/><br/>Diagnostic complete: 1 active anomaly cascade confirmed.';
      } else {
        reply = 'I am listening to your query. As the EdgeMind Orchestrator, I currently see:<br/>• 1 Active Anomaly Cascade (Motor-2)<br/>• 1 Critical PVC warning (data-historian at 78.1%)<br/>• 1 CPU Throttling Alert (anomaly-scorer at 87.2% CPU)<br/><br/>Please ask me to "Show root cause", "List recommended actions", or "Check CPU status" for detailed telemetry.';
      }

      appendMessage('Orchestrator Agent', reply, 'incoming');
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 1000);
  }

  function appendMessage(sender, text, typeClass) {
    const msgId = 'msg-' + Date.now();
    const wrapper = document.createElement('div');
    wrapper.id = msgId;
    wrapper.className = 'message ' + typeClass;
    
    const senderNode = document.createElement('strong');
    senderNode.textContent = sender;
    
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = text;

    wrapper.appendChild(senderNode);
    wrapper.appendChild(bubble);
    messagesBox.appendChild(wrapper);
    return msgId;
  }
}
