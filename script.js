// === Datos originales ===
const comarcaData = {
  "Alt Camp": { totalAnimals: 0 },
  "Alt Empordà": { totalAnimals: 0 },
  "Alt Penedès": { totalAnimals: 0 },
  "Alt Urgell": { totalAnimals: 0 },
  "Alta Ribagorça": { totalAnimals: 0 },
  "Anoia": { totalAnimals: 0 },
  "Bages": { totalAnimals: 0 },
  "Baix Camp": { totalAnimals: 0 },
  "Baix Ebre": { totalAnimals: 0 },
  "Baix Empordà": { totalAnimals: 0 },
  "Baix Llobregat": { totalAnimals: 0 },
  "Baix Penedès": { totalAnimals: 0 },
  "Barcelonès": { totalAnimals: 0 },
  "Berguedà": { totalAnimals: 0 },
  "Cerdanya": { totalAnimals: 0 },
  "Conca de Barberà": { totalAnimals: 0 },
  "Garraf": { totalAnimals: 0 },
  "Garrigues": { totalAnimals: 0 },
  "Garrotxa": { totalAnimals: 0 },
  "Gironès": { totalAnimals: 0 },
  "Lluçanès": { totalAnimals: 0 },
  "Maresme": { totalAnimals: 0 },
  "Moianès": { totalAnimals: 0 },
  "Montsià": { totalAnimals: 0 },
  "Noguera": { totalAnimals: 0 },
  "Osona": { totalAnimals: 0 },
  "Pallars Jussà": { totalAnimals: 0 },
  "Pallars Sobirà": { totalAnimals: 0 },
  "Pla d'Urgell": { totalAnimals: 0 },
  "Pla de l'Estany": { totalAnimals: 0 },
  "Priorat": { totalAnimals: 0 },
  "Ribera d'Ebre": { totalAnimals: 0 },
  "Ripollès": { totalAnimals: 0 },
  "Segarra": { totalAnimals: 0 },
  "Segrià": { totalAnimals: 0 },
  "Selva": { totalAnimals: 0 },
  "Solsonès": { totalAnimals: 0 },
  "Tarragonès": { totalAnimals: 0 },
  "Terra Alta": { totalAnimals: 0 },
  "Urgell": { totalAnimals: 0 },
  "Vall d'Aran": { totalAnimals: 0 },
  "Vallès Occidental": { totalAnimals: 0 },
  "Vallès Oriental": { totalAnimals: 0 }
};

// Alias de nombres alternativos -> nombre canónico
const comarcaNameAliases = {
  "Val d'Aran": "Vall d'Aran",
  "Val d Aran": "Vall d'Aran",
  "Valle de Aran": "Vall d'Aran",
  "Valle d'Aran": "Vall d'Aran",
  "La Selva": "Selva",
  "La Noguera": "Noguera",
  "La Garrotxa": "Garrotxa",
  "La Segarra": "Segarra",
  "El Priorat": "Priorat",
  "El Ripollès": "Ripollès",
  "El Baix Penedès": "Baix Penedès",
  "El Baix Empordà": "Baix Empordà",
  "El Baix Ebre": "Baix Ebre",
  "El Baix Camp": "Baix Camp",
  "El Baix Llobregat": "Baix Llobregat"
};

// Normalización robusta de nombres
function normalizeName(str) {
  return str
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
    .replace(/’|`/g, "'")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Mapa de nombre normalizado -> nombre canónico (comarcaData)
const comarcaNameMap = {};
for (const name of Object.keys(comarcaData)) {
  comarcaNameMap[normalizeName(name)] = name;
}
for (const [alias, canonical] of Object.entries(comarcaNameAliases)) {
  if (!comarcaData[canonical]) continue;
  comarcaNameMap[normalizeName(alias)] = canonical;
}

const metricConfigs = {
  totalAnimals: { label: "Total Animales", shortUnit: "animales", decimals: 0, accessor: d => d.totalAnimals },
  farmCount: { label: "Explotaciones", shortUnit: "explotaciones", decimals: 0, accessor: d => d.farmCount }
};

function updateMetricRanges() {
  Object.keys(metricConfigs).forEach(key => {
    const config = metricConfigs[key];
    let min = Infinity;
    let max = 0;
    let minPositive = Infinity;
    const { accessor } = config;

    Object.values(comarcaData).forEach(data => {
      const value = accessor(data);
      if (value != null && !isNaN(value)) {
        if (value < min) min = value;
        if (value > max) max = value;
        if (value > 0 && value < minPositive) minPositive = value;
      }
    });

    config.min = min === Infinity ? 0 : min;
    config.max = max > 0 ? max : 1;
    config.minPositive = minPositive === Infinity ? config.max : minPositive;
  });
}

let activeMetricKey = "totalAnimals";
let scaleMode = "linear";
let fillOpacity = 0.8;
let pinnedLayer = null;
let hoveredLayer = null;

const isMobileDevice = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || "";
  return /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(ua) ||
    (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
})();

if (typeof document !== "undefined") {
  if (document.body) {
    if (isMobileDevice) document.body.classList.add("is-mobile");
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      if (isMobileDevice) document.body.classList.add("is-mobile");
    });
  }
}

function liftLayer(layer) {
  const el = layer?.getElement?.();
  if (!el) return;
  L.DomUtil.addClass(el, "lifted");
}

function dropLayer(layer) {
  const el = layer?.getElement?.();
  if (!el) return;
  L.DomUtil.removeClass(el, "lifted");
}

function applyLayerBaseStyle(layer, data) {
  const value = data ? getMetricValue(data) : null;
  layer.setStyle({
    color: "#555",
    weight: 0.7,
    fillOpacity,
    fillColor: getColor(value)
  });
}

function applyLayerHighlightStyle(layer, data) {
  const value = data ? getMetricValue(data) : null;
  layer.setStyle({
    color: "#000",
    weight: 2,
    fillOpacity,
    fillColor: getColor(value)
  });
}

function focusLayer(layer) {
  if (!layer || layer === pinnedLayer) return;
  if (hoveredLayer && hoveredLayer !== pinnedLayer && hoveredLayer !== layer) {
    dropLayer(hoveredLayer);
    const meta = hoveredLayer._comarcaMeta;
    applyLayerBaseStyle(hoveredLayer, meta ? meta.data : null);
  }
  hoveredLayer = layer;
  const meta = layer._comarcaMeta;
  applyLayerHighlightStyle(layer, meta ? meta.data : null);
  liftLayer(layer);
}

function blurLayer(layer) {
  if (!layer || layer === pinnedLayer) return;
  if (hoveredLayer === layer) hoveredLayer = null;
  const meta = layer._comarcaMeta;
  applyLayerBaseStyle(layer, meta ? meta.data : null);
  dropLayer(layer);
}

function pinLayer(layer) {
  if (!layer) return;
  if (pinnedLayer && pinnedLayer !== layer) {
    dropLayer(pinnedLayer);
    const previousMeta = pinnedLayer._comarcaMeta;
    applyLayerBaseStyle(pinnedLayer, previousMeta ? previousMeta.data : null);
  }
  pinnedLayer = layer;
  const meta = layer._comarcaMeta;
  applyLayerHighlightStyle(layer, meta ? meta.data : null);
  liftLayer(layer);
  if (meta) {
    updateInfoPanel(meta.name, meta.data || null);
  }
}

function clearPinnedLayer() {
  if (!pinnedLayer) return;
  const meta = pinnedLayer._comarcaMeta;
  dropLayer(pinnedLayer);
  applyLayerBaseStyle(pinnedLayer, meta ? meta.data : null);
  pinnedLayer = null;
  updateInfoPanel(null, null);
}

const namePropertyCandidates = [
  "NOMCOMAR", "Comarca", "COMARCA", "comarca", "NAME_2", "NAME", "NOM",
  "NOMCOMARCA", "nom_comar", "NOM_COMAR", "Nom_Comar", "nomcomar"
];

function getComarcaNameFromProps(props = {}) {
  for (const key of namePropertyCandidates) {
    if (props[key]) {
      const norm = normalizeName(props[key]);
      if (comarcaNameMap[norm]) return comarcaNameMap[norm];
    }
  }
  for (const value of Object.values(props)) {
    if (typeof value === "string") {
      const norm = normalizeName(value);
      if (comarcaNameMap[norm]) return comarcaNameMap[norm];
    }
  }
  return null;
}

function getMetricValue(data, metricKey = activeMetricKey) {
  if (!data) return null;
  const config = metricConfigs[metricKey];
  if (!config || typeof config.accessor !== "function") return null;
  return config.accessor(data);
}

function getScaleRatio(value, metricKey = activeMetricKey) {
  const config = metricConfigs[metricKey];
  if (!config || value == null || !isFinite(value) || value <= 0) return 0;
  const maxValue = config.max || 1;
  if (scaleMode === "log") {
    const minPositive = config.minPositive > 0 ? config.minPositive : maxValue;
    if (!(minPositive > 0) || !(maxValue > 0) || minPositive === maxValue) return 1;
    const logMin = Math.log(minPositive);
    const logMax = Math.log(maxValue);
    if (!isFinite(logMin) || !isFinite(logMax) || logMax === logMin) return 1;
    const ratio = (Math.log(value) - logMin) / (logMax - logMin);
    return Math.max(0, Math.min(1, ratio));
  }
  const ratio = value / maxValue;
  return Math.max(0, Math.min(1, ratio));
}

function getColor(value, metricKey = activeMetricKey) {
  if (value == null || !isFinite(value) || value <= 0) return "#e5f5e0";
  const t = getScaleRatio(value, metricKey);
  if (t <= 0) return "#e5f5e0";
  const start = { r: 0xe5, g: 0xf5, b: 0xe0 }; // verde claro
  const end = { r: 0x5d, g: 0x2c, b: 0x1b }; // marrón oscuro
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function formatLegendValue(value, decimals = 0) {
  if (value == null || !isFinite(value)) return "0";
  return value.toLocaleString("es-ES", { maximumFractionDigits: decimals });
}

function getSpeciesBreakdownData(farms, totalValue, metricKey = "totalAnimals") {
  if (!farms.length || !totalValue) return [];
  const speciesCounts = {};
  farms.forEach(point => {
    const species = point.species || "Desconocido";
    const value = metricKey === "farmCount" ? 1 : (point.totalAnimals || 0);
    speciesCounts[species] = (speciesCounts[species] || 0) + value;
  });

  return Object.entries(speciesCounts)
    .filter(([, count]) => count > 0)
    .map(([species, count]) => {
      const percentage = totalValue > 0 ? (count / totalValue) * 100 : 0;
      return { species, count, percentage };
    })
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

function createPieChartSVG(data, size = 100) {
  const radius = size / 2;
  const center = size / 2;
  let currentAngle = 0;
  let paths = [];

  // Handle single item case (full circle)
  if (data.length === 1) {
    const color = getSpeciesColor(data[0].species);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" />
    </svg>`;
  }

  data.forEach(item => {
    const sliceAngle = (item.percentage / 100) * 360;
    const x1 = center + radius * Math.cos(Math.PI * (currentAngle - 90) / 180);
    const y1 = center + radius * Math.sin(Math.PI * (currentAngle - 90) / 180);
    const x2 = center + radius * Math.cos(Math.PI * (currentAngle + sliceAngle - 90) / 180);
    const y2 = center + radius * Math.sin(Math.PI * (currentAngle + sliceAngle - 90) / 180);

    // Use 1 if angle > 180
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(" ");

    const color = getSpeciesColor(item.species);
    paths.push(`<path d="${pathData}" fill="${color}" stroke="white" stroke-width="1" />`);
    currentAngle += sliceAngle;
  });

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(0deg); display: block;">${paths.join("")}</svg>`;
}

// Panel
function updateInfoPanel(name, data) {
  const panel = document.getElementById("info-panel");

  // Calcular total global basado en filtros actuales
  const filteredPoints = getFilteredFarmPoints();
  const globalTotalAnimals = filteredPoints.reduce((sum, p) => sum + (p.totalAnimals || 0), 0);
  const globalFarmCount = filteredPoints.length;
  const fmt = (v) => (v == null || isNaN(v)) ? "0" : v.toLocaleString("es-ES");

  // Si no hay comarca seleccionada/hover
  if (!name) {
    panel.innerHTML = `
      <h2>Total en Cataluña</h2>
      <table>
        <tr><td class="label">Animales</td><td class="value">${fmt(globalTotalAnimals)}</td></tr>
        <tr><td class="label">Explotaciones</td><td class="value">${fmt(globalFarmCount)}</td></tr>
      </table>
      <h2>Comarcas de Cataluña</h2>
      <p class="subtitle">Pasa el ratón sobre una comarca.</p>
      <table>
        <tr><td class="label">Comarca</td><td class="value">—</td></tr>
        <tr><td class="label">Explotaciones</td><td class="value">—</td></tr>
        <tr><td class="label">Total Animales</td><td class="value">—</td></tr>
      </table>
    `;
    return;
  }

  // Calcular datos dinámicos basados en los filtros actuales
  // Optimización: Usar índice pre-calculado en lugar de iterar todo el array
  const normName = normalizeName(name);
  const potentialFarms = farmsByComarca.get(normName) || [];

  const comarcaFarms = potentialFarms.filter(isFarmVisible);

  const farmCount = comarcaFarms.length;
  const totalAnimals = comarcaFarms.reduce((sum, p) => sum + (p.totalAnimals || 0), 0);

  const totalForMetric = activeMetricKey === "farmCount" ? farmCount : totalAnimals;

  // Generate Pie Chart Data
  const breakdownData = getSpeciesBreakdownData(comarcaFarms, totalForMetric, activeMetricKey);
  let speciesChartHtml = "";

  if (breakdownData.length > 0) {
    const pieSvg = createPieChartSVG(breakdownData, 80);
    const legendHtml = breakdownData.map(item => {
      const color = getSpeciesColor(item.species);
      return `
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px; font-size: 10px; line-height: 1.2;">
          <span style="display:inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; flex-shrink: 0;"></span>
          <span>${escapeHtml(item.species)} <strong>${item.percentage.toFixed(1)}%</strong></span>
        </div>
      `;
    }).join("");

    speciesChartHtml = `
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; align-items: flex-start; gap: 12px;">
        <div style="flex-shrink: 0;">${pieSvg}</div>
        <div style="flex-grow: 1;">${legendHtml}</div>
      </div>
    `;
  }

  panel.innerHTML = `
    <h2>Total en Cataluña</h2>
    <table>
      <tr><td class="label">Animales</td><td class="value">${fmt(globalTotalAnimals)}</td></tr>
      <tr><td class="label">Explotaciones</td><td class="value">${fmt(globalFarmCount)}</td></tr>
    </table>
    <h2>${escapeHtml(name)}</h2>
    <p class="subtitle">Datos filtrados en mapa</p>
    <table>
      <tr><td class="label">Explotaciones</td><td class="value">${fmt(farmCount)}</td></tr>
      <tr><td class="label">Total Animales</td><td class="value">${fmt(totalAnimals)}</td></tr>
    </table>
    ${speciesChartHtml}
    <div class="hint">Datos basados en Explotaciones RER visibles.</div>
  `;
}

// Mapa Leaflet
const map = L.map("map", {
  zoomSnap: 0.25,
  zoomDelta: 0.5
}).setView([41.7, 1.6], 8);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const farmMarkersPane = "farm-markers";
map.createPane(farmMarkersPane);
map.getPane(farmMarkersPane).style.zIndex = 650;

["info-panel", "layer-selector", "legend"].forEach(id => {
  const node = document.getElementById(id);
  if (node) {
    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);
  }
});

const geojsonUrl = "comarques_4326.geojson";
const farmsCsvUrl = "RER_llistat_explotacions_catalanes.csv";
const speciesFilterContainer = document.getElementById("species-filter");
const speciesFilterPanel = document.getElementById("species-filter-panel");
const speciesFilterToggleBtn = document.getElementById("species-filter-toggle");
const speciesFilterSelectAllBtn = document.getElementById("species-filter-select-all");
const speciesFilterDeselectAllBtn = document.getElementById("species-filter-deselect-all");
const systemFilterContainer = document.getElementById("system-filter");
const systemFilterPanel = document.getElementById("system-filter-panel");
const systemFilterToggleBtn = document.getElementById("system-filter-toggle");
const systemFilterSelectAllBtn = document.getElementById("system-filter-select-all");
const systemFilterDeselectAllBtn = document.getElementById("system-filter-deselect-all");
const sustainabilityFilterContainer = document.getElementById("sustainability-filter");
const sustainabilityFilterPanel = document.getElementById("sustainability-filter-panel");
const sustainabilityFilterToggleBtn = document.getElementById("sustainability-filter-toggle");
const sustainabilityFilterSelectAllBtn = document.getElementById("sustainability-filter-select-all");
const sustainabilityFilterDeselectAllBtn = document.getElementById("sustainability-filter-deselect-all");
const farmTypeFilterContainer = document.getElementById("farmtype-filter");
const farmTypeFilterPanel = document.getElementById("farmtype-filter-panel");
const farmTypeFilterToggleBtn = document.getElementById("farmtype-filter-toggle");
const farmTypeFilterSelectAllBtn = document.getElementById("farmtype-filter-select-all");
const farmTypeFilterDeselectAllBtn = document.getElementById("farmtype-filter-deselect-all");
const farmsLoadingEl = document.getElementById("farms-loading");

let comarcaLayer = null;
let farmsLayer = null;
let farmsVisible = false;
let farmDataPromise = null;
let allFarmPoints = [];
let farmsByComarca = new Map();
const selectedSpecies = new Set();
const selectedSystems = new Set();
const selectedCriteria = new Set();
const selectedFarmTypes = new Set();
const farmMarkerStyle = {
  radius: 3.2,
  weight: 0.6,
  opacity: 0.9,
  pane: farmMarkersPane
};

function normalizeHeaderValue(str) {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseCoordinate(raw) {
  if (raw == null) return null;
  let str = String(raw).trim();
  if (!str) return null;

  let hemisphere = 1;
  const hemi = str.match(/([NSEO])$/i);
  if (hemi) {
    const letter = hemi[1].toUpperCase();
    if (letter === "S" || letter === "O" || letter === "W") {
      hemisphere = -1;
    }
    str = str.slice(0, -1).trim();
  }

  let normalized = str
    .replace(/,/g, ".")
    .replace(/[º°]/g, " ")
    .replace(/['’]/g, " ")
    .replace(/["”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return null;

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    const value = Number(normalized) * hemisphere;
    return Number.isFinite(value) ? value : null;
  }

  const parts = normalized.split(" ").map(part => Number(part)).filter(num => !Number.isNaN(num));
  if (!parts.length) return null;

  const deg = parts[0];
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;
  const baseSign = deg < 0 ? -1 : 1;
  const absolute = Math.abs(deg) + Math.abs(minutes) / 60 + Math.abs(seconds) / 3600;
  const decimal = absolute * baseSign * hemisphere;
  return Number.isFinite(decimal) ? decimal : null;
}

function parseCsvText(text) {
  if (!text) return [];
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }
  const rows = [];
  let current = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === "\"") {
      if (inQuotes && cleanText[i + 1] === "\"") {
        value += "\"";
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && cleanText[i + 1] === "\n") {
        i++;
      }
      current.push(value);
      rows.push(current);
      current = [];
      value = "";
      continue;
    }
    if (char === "," && !inQuotes) {
      current.push(value);
      value = "";
      continue;
    }
    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value);
    rows.push(current);
  }

  return rows;
}

function escapeHtml(str) {
  return str
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isFarmVisible(point) {
  const species = point.species || "(Desconocido)";
  if (!selectedSpecies.has(species)) return false;

  const system = point.productionSystem || "(Desconocido)";
  if (!selectedSystems.has(system)) return false;

  const criterion = point.sustainabilityCriterion || "(Desconocido)";
  if (!selectedCriteria.has(criterion)) return false;

  const fType = point.farmType || "(Desconocido)";
  if (!selectedFarmTypes.has(fType)) return false;

  return true;
}

function getFilteredFarmPoints() {
  if (!allFarmPoints.length) return [];
  return allFarmPoints.filter(isFarmVisible);
}

function recalculateComarcaMetrics() {
  for (const key of Object.keys(comarcaData)) {
    comarcaData[key].totalAnimals = 0;
    comarcaData[key].farmCount = 0;
  }

  for (const [comarcaName, farms] of farmsByComarca.entries()) {
    const canonical = comarcaNameMap[comarcaName];
    if (canonical && comarcaData[canonical]) {
      let sum = 0;
      let count = 0;
      for (const farm of farms) {
        if (isFarmVisible(farm)) {
          sum += (farm.totalAnimals || 0);
          count++;
        }
      }
      comarcaData[canonical].totalAnimals = sum;
      comarcaData[canonical].farmCount = count;
    }
  }

  updateMetricRanges();
}

function applyFarmFilters() {
  buildFarmMarkers(getFilteredFarmPoints());
  recalculateComarcaMetrics();
  updateLegend();
  refreshLayerStyles();

  if (pinnedLayer && pinnedLayer._comarcaMeta) {
    updateInfoPanel(pinnedLayer._comarcaMeta.name, pinnedLayer._comarcaMeta.data);
  } else if (hoveredLayer && hoveredLayer._comarcaMeta) {
    updateInfoPanel(hoveredLayer._comarcaMeta.name, hoveredLayer._comarcaMeta.data);
  } else {
    updateInfoPanel(null, null);
  }
}

function populateFilterOptions(points, {
  container,
  selectAllBtn,
  deselectAllBtn,
  selectedSet,
  accessor,
  idPrefix,
  emptyMessage
}) {
  if (!container) return;
  const valueSet = new Set();
  points.forEach(point => {
    const raw = accessor(point);
    const value = raw || "(Desconocido)";
    valueSet.add(value);
  });

  // Default: Select all
  selectedSet.clear();
  valueSet.forEach(v => selectedSet.add(v));

  const sortedValues = Array.from(valueSet).sort((a, b) =>
    a.localeCompare(b, "ca", { sensitivity: "accent" })
  );
  container.innerHTML = "";
  if (!sortedValues.length) {
    const empty = document.createElement("div");
    empty.className = "species-filter-empty";
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    if (selectAllBtn) selectAllBtn.disabled = true;
    if (deselectAllBtn) deselectAllBtn.disabled = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  sortedValues.forEach((name, index) => {
    const optionId = `${idPrefix}-${index}`;
    const label = document.createElement("label");
    label.className = "species-filter-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = optionId;
    checkbox.value = name;
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedSet.add(name);
      } else {
        selectedSet.delete(name);
      }
      applyFarmFilters();
    });

    const text = document.createElement("span");
    text.textContent = name;

    label.appendChild(checkbox);
    label.appendChild(text);
    fragment.appendChild(label);
  });

  container.appendChild(fragment);
  if (selectAllBtn) selectAllBtn.disabled = false;
  if (deselectAllBtn) deselectAllBtn.disabled = false;
}

function populateSpeciesFilter(points) {
  populateFilterOptions(points, {
    container: speciesFilterContainer,
    selectAllBtn: speciesFilterSelectAllBtn,
    deselectAllBtn: speciesFilterDeselectAllBtn,
    selectedSet: selectedSpecies,
    accessor: point => point.species,
    idPrefix: "species-filter",
    emptyMessage: "El CSV no contiene valores de especie."
  });
}

function populateSystemFilter(points) {
  populateFilterOptions(points, {
    container: systemFilterContainer,
    selectAllBtn: systemFilterSelectAllBtn,
    deselectAllBtn: systemFilterDeselectAllBtn,
    selectedSet: selectedSystems,
    accessor: point => point.productionSystem,
    idPrefix: "system-filter",
    emptyMessage: "El CSV no contiene valores de sistema productiu."
  });
}

function populateSustainabilityFilter(points) {
  populateFilterOptions(points, {
    container: sustainabilityFilterContainer,
    selectAllBtn: sustainabilityFilterSelectAllBtn,
    deselectAllBtn: sustainabilityFilterDeselectAllBtn,
    selectedSet: selectedCriteria,
    accessor: point => point.sustainabilityCriterion,
    idPrefix: "sustainability-filter",
    emptyMessage: "El CSV no contiene valores de criteri de sostenibilitat."
  });
}

function populateFarmTypeFilter(points) {
  populateFilterOptions(points, {
    container: farmTypeFilterContainer,
    selectAllBtn: farmTypeFilterSelectAllBtn,
    deselectAllBtn: farmTypeFilterDeselectAllBtn,
    selectedSet: selectedFarmTypes,
    accessor: point => point.farmType,
    idPrefix: "farmtype-filter",
    emptyMessage: "El CSV no contiene valores de tipus d'explotació."
  });
}

function setupFilterToggle(button, panel) {
  if (!button || !panel) return;
  button.addEventListener("click", () => {
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    const nextState = !isExpanded;
    button.setAttribute("aria-expanded", String(nextState));
    panel.hidden = !nextState;
  });
}

function setupFilterButtons(selectAllBtn, deselectAllBtn, container, selectedSet) {
  if (selectAllBtn) {
    selectAllBtn.addEventListener("click", () => {
      if (!container) return;
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(input => {
        input.checked = true;
        selectedSet.add(input.value);
      });
      applyFarmFilters();
    });
  }
  if (deselectAllBtn) {
    deselectAllBtn.addEventListener("click", () => {
      if (!container) return;
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(input => {
        input.checked = false;
      });
      selectedSet.clear();
      applyFarmFilters();
    });
  }
}

function buildFarmPopupHtml(point) {
  const lines = [];
  if (point.name) {
    lines.push(`<strong>${escapeHtml(point.name)}</strong>`);
  }
  const metaParts = [];
  if (point.municipi) metaParts.push(escapeHtml(point.municipi));
  if (point.comarca) metaParts.push(escapeHtml(point.comarca));
  if (point.code) metaParts.push(`REGA: ${escapeHtml(point.code)}`);
  if (metaParts.length) {
    lines.push(metaParts.join("<br>"));
  }

  const rowsHtml = (point.rowEntries || []).map(entry => {
    const label = entry?.label ? escapeHtml(entry.label) : "—";
    const value = entry?.value ? escapeHtml(entry.value) : "—";
    return `<tr><td>${label}</td><td>${value}</td></tr>`;
  }).join("");

  return `
    <div class="farm-popup">
      ${lines.length ? `<div class="farm-popup-summary">${lines.join("<br>")}</div>` : ""}
      <div class="farm-popup-table-wrapper">
        <table class="farm-popup-table">${rowsHtml}</table>
      </div>
    </div>
  `;
}

const speciesColorMap = {
  "PORCÍ": "#e377c2",      // Pink
  "BOVÍ": "#8c564b",       // Brown
  "OVÍ": "#2ca02c",        // Green
  "CABRUM": "#bcbd22",     // Olive
  "ÈQUID": "#9467bd",      // Purple
  "CONILL": "#17becf",     // Cyan
  "GALLINES": "#ff7f0e",   // Orange
  "GALLS DINDI": "#d62728",// Red
  "ÀNECS": "#1f77b4",      // Blue
  "OQUES": "#aec7e8",      // Light Blue
  "PERDIUS": "#c5b0d5",    // Light Purple
  "FAISANS": "#ffbb78",    // Light Orange
  "COLOMS": "#c49c94",     // Light Brown
  "CARGOLS": "#9edae5",    // Light Cyan
  "ALTRES AUS": "#f7b6d2", // Light Pink
  "RATITES": "#dbdb8d",    // Pale Olive
  "ANGUILA": "#393b79",    // Dark Blue
  "MUSCLO": "#5254a3",     // Medium Blue
  "OSTRA": "#6b6ecf",      // Light-Medium Blue
  "TRUITA": "#9c9ede",     // Lavender
  "CUC": "#637939",        // Dark Green
  "GRILL": "#8ca252",      // Medium Green
  "MOSCA": "#b5cf6b",      // Light Green
  "APÍCOLA": "#e7ba52",    // Gold
  "AVIRAM": "#ff7f0e",     // Fallback Orange
  "ALTRES": "#7f7f7f"      // Gray
};

function getSpeciesColor(species) {
  if (!species) return "#7a0000"; // Default dark red
  const upper = species.toUpperCase();
  // Check for exact match or partial match if needed
  for (const [key, color] of Object.entries(speciesColorMap)) {
    if (upper.includes(key)) return color;
  }
  return "#7a0000"; // Fallback
}

function buildFarmMarkers(points) {
  if (!farmsLayer) {
    farmsLayer = L.layerGroup();
  } else {
    farmsLayer.clearLayers();
  }

  if (!Array.isArray(points) || !points.length) {
    updateFarmsLayerVisibility();
    return;
  }

  points.forEach(point => {
    const color = getSpeciesColor(point.species);
    const style = {
      ...farmMarkerStyle,
      color: "#333", // Darker border for contrast
      fillColor: color,
      fillOpacity: 0.8
    };

    const marker = L.circleMarker([point.lat, point.lng], style);
    marker.bindPopup(buildFarmPopupHtml(point), {
      maxWidth: 360,
      maxHeight: 320,
      className: "farm-popup-leaflet"
    });
    marker.addTo(farmsLayer);
  });

  updateFarmsLayerVisibility();
}

function setFarmLoadingState(isLoading, message = "Cargando explotaciones…") {
  if (!farmsLoadingEl) return;
  farmsLoadingEl.style.display = isLoading ? "block" : "none";
  if (isLoading && message) {
    farmsLoadingEl.textContent = message;
  }
}

function updateFarmsLayerVisibility() {
  if (!farmsLayer) return;
  const isOnMap = map.hasLayer(farmsLayer);
  if (farmsVisible && !isOnMap) {
    farmsLayer.addTo(map);
  } else if (!farmsVisible && isOnMap) {
    map.removeLayer(farmsLayer);
  }
}

function loadFarmLocations() {
  if (farmsLayer) {
    updateFarmsLayerVisibility();
    return;
  }

  if (!farmDataPromise) {
    setFarmLoadingState(true, "Cargando explotaciones…");
    farmDataPromise = fetch(farmsCsvUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        const rows = parseCsvText(text);
        if (!rows.length) {
          throw new Error("CSV vacío");
        }
        const headers = rows.shift().map(header => header || "");
        const latIndex = headers.findIndex(h => normalizeHeaderValue(h) === "LATITUD EXPLOTACIO");
        const lonIndex = headers.findIndex(h => normalizeHeaderValue(h) === "LONGITUD EXPLOTACIO");
        if (latIndex === -1 || lonIndex === -1) {
          throw new Error("No se han encontrado las columnas de latitud/longitud");
        }
        const nameIndex = headers.findIndex(h => normalizeHeaderValue(h) === "NOM EXPLOTACIO");
        const municipiIndex = headers.findIndex(h => normalizeHeaderValue(h) === "MUNICIPI EXPLOTACIO");
        const comarcaIndex = headers.findIndex(h => normalizeHeaderValue(h) === "COMARCA EXPLOTACIO");
        const regaIndex = headers.findIndex(h => normalizeHeaderValue(h) === "CODI REGA");
        const especieIndex = headers.findIndex(h => normalizeHeaderValue(h) === "ESPECIE");
        const systemIndex = headers.findIndex(h => normalizeHeaderValue(h) === "SISTEMA PRODUCTIU");
        const sustainabilityIndex = headers.findIndex(h => normalizeHeaderValue(h) === "CRITERI DE SOSTENIBILITAT");
        const farmTypeIndex = headers.findIndex(h => normalizeHeaderValue(h) === "TIPUS EXPLOTACIO");
        const totalAnimalsIndex = headers.findIndex(h => normalizeHeaderValue(h) === "CAP Nº TOTAL ANIMALS");

        // Identify all capacity columns excluding "CAPACITAT PRODUCTIVA" (which is text)
        const capacityIndices = headers.map((h, i) => ({ name: normalizeHeaderValue(h), index: i }))
          .filter(({ name }) => name.startsWith("CAPACITAT") && name !== "CAPACITAT PRODUCTIVA")
          .map(({ index }) => index);

        const unique = new Map();
        for (const row of rows) {
          const lat = parseCoordinate(row[latIndex]);
          const lng = parseCoordinate(row[lonIndex]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
          const name = nameIndex !== -1 ? row[nameIndex]?.trim() : "";
          const municipi = municipiIndex !== -1 ? row[municipiIndex]?.trim() : "";
          const comarca = comarcaIndex !== -1 ? row[comarcaIndex]?.trim() : "";
          const code = regaIndex !== -1 ? row[regaIndex]?.trim() : "";
          const species = especieIndex !== -1 ? row[especieIndex]?.trim() : "";
          const productionSystem = systemIndex !== -1 ? row[systemIndex]?.trim() : "";
          const sustainabilityCriterion = sustainabilityIndex !== -1 ? row[sustainabilityIndex]?.trim() : "";
          const farmType = farmTypeIndex !== -1 ? row[farmTypeIndex]?.trim() : "";
          const rowEntries = headers.map((header, idx) => {
            const label = (header && header.trim()) ? header.trim() : `Columna ${idx + 1}`;
            const rawValue = row[idx];
            const value = typeof rawValue === "string" ? rawValue.trim() : (rawValue ?? "");
            return { label, value: value || "" };
          });
          const key = `${code || ""}::${lat.toFixed(6)}::${lng.toFixed(6)}`;
          if (unique.has(key)) continue;

          let normalizedComarca = normalizeName(comarca);
          const canonical = comarcaNameMap[normalizedComarca];
          if (canonical) {
            normalizedComarca = normalizeName(canonical);
          }

          unique.set(key, {
            lat,
            lng,
            name,
            municipi,
            comarca,
            normalizedComarca, // Guardamos la versión normalizada
            code,
            species,
            productionSystem,
            sustainabilityCriterion,
            farmType,
            totalAnimals: capacityIndices.reduce((sum, idx) => {
              const val = parseCoordinate(row[idx]);
              return sum + (val || 0);
            }, 0) + (parseCoordinate(row[totalAnimalsIndex]) || 0),
            rowEntries
          });
        }

        const points = Array.from(unique.values());

        // Construir índice por comarca
        farmsByComarca.clear();
        for (const p of points) {
          const c = p.normalizedComarca;
          if (!farmsByComarca.has(c)) {
            farmsByComarca.set(c, []);
          }
          farmsByComarca.get(c).push(p);
        }

        return points;
      })
      .catch(err => {
        console.error("No se han podido cargar las explotaciones del CSV:", err);
        farmDataPromise = null;
        throw err;
      });
  }

  farmDataPromise
    .then(points => {
      allFarmPoints = points;
      populateSpeciesFilter(points);
      populateSystemFilter(points);
      populateSustainabilityFilter(points);
      populateFarmTypeFilter(points);
      recalculateComarcaMetrics();
      applyFarmFilters();
    })
    .catch(() => {
      if (farmsToggleInput) {
        farmsToggleInput.checked = false;
        farmsVisible = false;
      }
      alert("No se han podido cargar las explotaciones del CSV.");
    })
    .finally(() => {
      setFarmLoadingState(false);
    });
}

function baseFeatureStyle(feature) {
  const canonical = getComarcaNameFromProps(feature.properties) || "";
  const data = comarcaData[canonical];
  const value = data ? getMetricValue(data) : null;
  return {
    color: "#555",
    weight: 0.7,
    fillOpacity,
    fillColor: getColor(value),
    className: "comarca-polygon"
  };
}

fetch(geojsonUrl)
  .then(r => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  })
  .then(geojson => {
    const layer = L.geoJSON(geojson, {
      style: baseFeatureStyle,
      onEachFeature: (feature, layer) => {
        const rawName =
          feature.properties.NOMCOMAR || feature.properties.Comarca ||
          feature.properties.COMARCA || feature.properties.comarca ||
          feature.properties.nom_comar || feature.properties.NAME_2 ||
          feature.properties.NAME || feature.properties.NOM || "Desconocida";

        const canonical = getComarcaNameFromProps(feature.properties);
        const name = canonical || rawName;
        const data = canonical ? comarcaData[canonical] : null;
        layer._comarcaMeta = { name, data };

        if (!canonical) {
          console.warn("Sin datos para comarca del GeoJSON:", rawName);
        }

        layer.on("mouseover", () => {
          focusLayer(layer);
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
          updateInfoPanel(name, data || null);
        });

        layer.on("mouseout", () => {
          blurLayer(layer);
          if (pinnedLayer && pinnedLayer._comarcaMeta) {
            const meta = pinnedLayer._comarcaMeta;
            updateInfoPanel(meta.name, meta.data || null);
          } else if (!hoveredLayer) {
            updateInfoPanel(null, null);
          }
        });

        layer.on("click", event => {
          L.DomEvent.stopPropagation(event);
          pinLayer(layer);
        });
      }
    }).addTo(map);

    comarcaLayer = layer;

    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  })
  .catch(err => {
    console.error("Error al cargar el GeoJSON de comarcas:", err);
    alert("No se ha podido cargar el mapa de comarcas. Revisa la URL.");
  });

map.on("click", () => {
  clearPinnedLayer();
});

const legendTitleEl = document.querySelector(".legend-title");
const legendLabels = document.querySelectorAll(".legend-labels span");

function updateLegend() {
  const config = metricConfigs[activeMetricKey];
  if (!config) return;
  if (legendTitleEl) {
    legendTitleEl.textContent = `${config.label} (${scaleMode === "log" ? "escala log" : "escala lineal"})`;
  }
  if (legendLabels.length >= 2) {
    const minVal = scaleMode === "log"
      ? (isFinite(config.minPositive) ? config.minPositive : config.min)
      : (isFinite(config.min) ? config.min : 0);
    const maxVal = isFinite(config.max) ? config.max : 0;
    legendLabels[0].textContent = `Mín (${formatLegendValue(minVal, config.decimals)} ${config.shortUnit})`;
    legendLabels[1].textContent = `Máx (${formatLegendValue(maxVal, config.decimals)} ${config.shortUnit})`;
  }
}

function refreshLayerStyles() {
  if (!comarcaLayer) return;
  comarcaLayer.eachLayer(layer => {
    const meta = layer._comarcaMeta;
    if (!meta) return;
    if (layer === pinnedLayer || layer === hoveredLayer) {
      applyLayerHighlightStyle(layer, meta.data || null);
      liftLayer(layer);
    } else {
      applyLayerBaseStyle(layer, meta.data || null);
      dropLayer(layer);
    }
  });
}

document.querySelectorAll('input[name="metric"]').forEach(input => {
  input.addEventListener("change", event => {
    if (!event.target.checked) return;
    activeMetricKey = event.target.value;
    updateLegend();
    refreshLayerStyles();

    if (pinnedLayer && pinnedLayer._comarcaMeta) {
      updateInfoPanel(pinnedLayer._comarcaMeta.name, pinnedLayer._comarcaMeta.data);
    } else if (hoveredLayer && hoveredLayer._comarcaMeta) {
      updateInfoPanel(hoveredLayer._comarcaMeta.name, hoveredLayer._comarcaMeta.data);
    } else {
      updateInfoPanel(null, null);
    }
  });
});

document.querySelectorAll('input[name="scale"]').forEach(input => {
  input.addEventListener("change", event => {
    if (!event.target.checked) return;
    scaleMode = event.target.value;
    updateLegend();
    refreshLayerStyles();
  });
});

const opacitySlider = document.getElementById("opacity-slider");
const opacityValueEl = document.getElementById("opacity-value");

function setFillOpacityFromSlider(value) {
  const numeric = Math.max(0, Math.min(100, Number(value)));
  fillOpacity = numeric / 100;
  if (opacityValueEl) {
    opacityValueEl.textContent = `${Math.round(numeric)}%`;
  }
  refreshLayerStyles();
}

if (opacitySlider) {
  setFillOpacityFromSlider(opacitySlider.value || 80);
  opacitySlider.addEventListener("input", event => {
    setFillOpacityFromSlider(event.target.value);
  });
  opacitySlider.addEventListener("change", event => {
    setFillOpacityFromSlider(event.target.value);
  });
}

const farmsToggleInput = document.getElementById("farms-toggle");
if (farmsToggleInput) {
  farmsVisible = !!farmsToggleInput.checked;
  farmsToggleInput.addEventListener("change", () => {
    farmsVisible = !!farmsToggleInput.checked;
    if (farmsVisible) {
      loadFarmLocations();
    }
    updateFarmsLayerVisibility();
  });
}

// Preload farm data so comarca colors and metrics are ready, but keep markers hidden by default.
loadFarmLocations();

setupFilterToggle(speciesFilterToggleBtn, speciesFilterPanel);
setupFilterToggle(systemFilterToggleBtn, systemFilterPanel);
setupFilterToggle(sustainabilityFilterToggleBtn, sustainabilityFilterPanel);
setupFilterToggle(farmTypeFilterToggleBtn, farmTypeFilterPanel);

setupFilterButtons(speciesFilterSelectAllBtn, speciesFilterDeselectAllBtn, speciesFilterContainer, selectedSpecies);
setupFilterButtons(systemFilterSelectAllBtn, systemFilterDeselectAllBtn, systemFilterContainer, selectedSystems);
setupFilterButtons(
  sustainabilityFilterSelectAllBtn,
  sustainabilityFilterDeselectAllBtn,
  sustainabilityFilterContainer,
  selectedCriteria
);
setupFilterButtons(farmTypeFilterSelectAllBtn, farmTypeFilterDeselectAllBtn, farmTypeFilterContainer, selectedFarmTypes);

updateMetricRanges();
updateLegend();
