// === Datos originales ===
const comarcaData = {
  "Alt Camp":          { area: 538,   population: 46388,  pigs: 62134 },
  "Alt Empordà":       { area: 1358,  population: 148732, pigs: 389431 },
  "Alt Penedès":       { area: 593,   population: 114189, pigs: 4781 },
  "Alt Urgell":        { area: 1447,  population: 21128,  pigs: 40486 },
  "Alta Ribagorça":    { area: 427,   population: 4040,   pigs: 2570 },
  "Anoia":             { area: 866,   population: 128432, pigs: 136862 },
  "Bages":             { area: 1092,  population: 185352, pigs: 307319 },
  "Baix Camp":         { area: 697,   population: 204458, pigs: 64750 },
  "Baix Ebre":         { area: 1003,  population: 82399,  pigs: 71842 },
  "Baix Empordà":      { area: 702,   population: 143443, pigs: 119407 },
  "Baix Llobregat":    { area: 486,   population: 848827, pigs: 1007 },
  "Baix Penedès":      { area: 296,   population: 118350, pigs: 27868 },
  "Barcelonès":        { area: 146,   population: 2354301,pigs: 0 },
  "Berguedà":          { area: 1185,  population: 41058,  pigs: 253666 },
  "Cerdanya":          { area: 547,   population: 20115,  pigs: 906 },
  "Conca de Barberà":  { area: 650,   population: 20569,  pigs: 63803 },
  "Garraf":            { area: 185,   population: 161907, pigs: 738 },
  "Garrigues":         { area: 798,   population: 19075,  pigs: 393347 },
  "Garrotxa":          { area: 735,   population: 62449,  pigs: 104383 },
  "Gironès":           { area: 576,   population: 205573, pigs: 80283 },
  "Lluçanès":          { area: 227,   population: 5718,   pigs: null },
  "Maresme":           { area: 399,   population: 472572, pigs: 6931 },
  "Moianès":           { area: 338,   population: 14758,  pigs: 83318 },
  "Montsià":           { area: 735,   population: 71460,  pigs: 178602 },
  "Noguera":           { area: 1784,  population: 39727,  pigs: 1135009 },
  "Osona":             { area: 1019,  population: 164006, pigs: 1027492 },
  "Pallars Jussà":     { area: 1343,  population: 13383,  pigs: 151237 },
  "Pallars Sobirà":    { area: 1378,  population: 7332,   pigs: 9584 },
  "Pla d'Urgell":      { area: 305,   population: 38111,  pigs: 433767 },
  "Pla de l'Estany":   { area: 263,   population: 33564,  pigs: 202324 },
  "Priorat":           { area: 499,   population: 9420,   pigs: 7939 },
  "Ribera d'Ebre":     { area: 827,   population: 22132,  pigs: 47251 },
  "Ripollès":          { area: 957,   population: 25826,  pigs: 19343 },
  "Segarra":           { area: 563,   population: 22667,  pigs: 399045 },
  "Segrià":            { area: 1397,  population: 217853, pigs: 1347873 },
  "Selva":             { area: 995,   population: 185264, pigs: 81658 },
  "Solsonès":          { area: 1161,  population: 15323,  pigs: 231343 },
  "Tarragonès":        { area: 319,   population: 275122, pigs: 8303 },
  "Terra Alta":        { area: 743,   population: 11446,  pigs: 65664 },
  "Urgell":            { area: 580,   population: 38531,  pigs: 475287 },
  "Vall d'Aran":       { area: 634,   population: 10545,  pigs: 45172 },
  "Vallès Occidental": { area: 583,   population: 960033, pigs: 20068 },
  "Vallès Oriental":   { area: 735,   population: 426653, pigs: 90003 }
};

// Alias de nombres alternativos -> nombre canónico
const comarcaNameAliases = {
  "Val d'Aran": "Vall d'Aran",
  "Val d Aran": "Vall d'Aran",
  "Valle de Aran": "Vall d'Aran",
  "Valle d'Aran": "Vall d'Aran"
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
  population:   { label: "Habitantes", shortUnit: "hab.", decimals: 0, accessor: d => d.population },
  pigs:         { label: "Cerdos", shortUnit: "cerdos", decimals: 0, accessor: d => d.pigs },
  pigsPerKm2:   { label: "Cerdos por km²", shortUnit: "cerdos/km²", decimals: 1, accessor: d => d.pigsPerKm2 },
  pigsPerCapita:{ label: "Cerdos por habitante", shortUnit: "cerdos/hab.", decimals: 2, accessor: d => d.pigsPerCapita }
};

let activeMetricKey = "pigsPerKm2";
let scaleMode = "log";
let fillOpacity = 0.8;

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

// Calcular densidades y ratios
for (const [name, d] of Object.entries(comarcaData)) {
  if (d.pigs != null && d.area > 0) {
    d.pigsPerKm2 = d.pigs / d.area;
    d.pigsPerCapita = d.pigs / d.population;
  } else {
    d.pigsPerKm2 = null;
    d.pigsPerCapita = null;
  }
}

// Calcula rangos por métrica
for (const key of Object.keys(metricConfigs)) {
  let min = Infinity;
  let max = 0;
  let minPositive = Infinity;
  const accessor = metricConfigs[key].accessor;
  for (const data of Object.values(comarcaData)) {
    const value = accessor(data);
    if (value != null && !isNaN(value)) {
      if (value < min) min = value;
      if (value > max) max = value;
      if (value > 0 && value < minPositive) minPositive = value;
    }
  }
  const config = metricConfigs[key];
  config.min = min === Infinity ? 0 : min;
  config.max = max > 0 ? max : 1;
  config.minPositive = minPositive === Infinity ? config.max : minPositive;
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
  const end   = { r: 0x5d, g: 0x2c, b: 0x1b }; // marrón oscuro
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function formatLegendValue(value, decimals = 0) {
  if (value == null || !isFinite(value)) return "0";
  return value.toLocaleString("es-ES", { maximumFractionDigits: decimals });
}

// Panel
function updateInfoPanel(name, data) {
  const panel = document.getElementById("info-panel");
  const tds = panel.getElementsByTagName("td");

  if (!name || !data) {
    tds[1].textContent  = "—";
    tds[3].textContent  = "—";
    tds[5].textContent  = "—";
    tds[7].textContent  = "—";
    tds[9].textContent  = "—";
    tds[11].textContent = "—";
    return;
  }

  const fmt = (v, decimals=0) =>
    (v == null || isNaN(v)) ? "N/D" :
    v.toLocaleString("es-ES", { maximumFractionDigits: decimals });

  tds[1].textContent  = name;
  tds[3].textContent  = fmt(data.area);
  tds[5].textContent  = fmt(data.population);
  tds[7].textContent  = data.pigs == null ? "N/D" : fmt(data.pigs);
  tds[9].textContent  = data.pigsPerKm2 == null ? "N/D" : fmt(data.pigsPerKm2, 1);
  tds[11].textContent = data.pigsPerCapita == null ? "N/D" : fmt(data.pigsPerCapita, 2);
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

const geojsonUrl = "comarques_4326.geojson";

let comarcaLayer = null;

function baseFeatureStyle(feature) {
  const canonical = getComarcaNameFromProps(feature.properties) || "";
  const data = comarcaData[canonical];
  const value = data ? getMetricValue(data) : null;
  return {
    color: "#555",
    weight: 0.7,
    fillOpacity,
    fillColor: getColor(value)
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

        if (!canonical) {
          console.warn("Sin datos para comarca del GeoJSON:", rawName);
        }

        layer.on("mouseover", () => {
          layer.setStyle({ weight: 2, color: "#000" });
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
          }
          updateInfoPanel(name, data || null);
        });

        layer.on("mouseout", () => {
          const value = data ? getMetricValue(data) : null;
          layer.setStyle({
            color: "#555",
            weight: 0.7,
            fillOpacity,
            fillColor: getColor(value)
          });
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
    const canonical = getComarcaNameFromProps(layer.feature?.properties || {}) || "";
    const data = comarcaData[canonical];
    const value = data ? getMetricValue(data) : null;
    layer.setStyle({
      color: "#555",
      weight: 0.7,
      fillOpacity,
      fillColor: getColor(value)
    });
  });
}

document.querySelectorAll('input[name="metric"]').forEach(input => {
  input.addEventListener("change", event => {
    if (!event.target.checked) return;
    activeMetricKey = event.target.value;
    updateLegend();
    refreshLayerStyles();
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

updateLegend();
