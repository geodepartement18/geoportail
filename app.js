/* ============================================================
   SENTIERS DU CHER — application PDIPR
   ArcGIS Maps SDK for JavaScript + Calcite Design System
   Données : hosted feature layer sur ArcGIS Online
   ============================================================ */

const FEATURE_LAYER_URL =
  "https://services-eu1.arcgis.com/BskcOcOpYAUZPEMQ/ArcGIS/rest/services/pdipr_cher/FeatureServer/0";

// Étendue complète du jeu de données (Web Mercator, wkid 102100)
const FULL_EXTENT = {
  xmin: 201471.98596453,
  ymin: 5848289.15181023,
  xmax: 354230.642201551,
  ymax: 6039836.95855582,
  spatialReference: { wkid: 102100 },
};

// Couleurs par pratique (alignées avec les variables CSS --sc-*)
const PRACTICE_COLORS = {
  "pédestre": "#3b7a57",
  "pedestre": "#3b7a57",
  cyclo: "#2e6e8e",
  "cylcopéde": "#c9982f", // libellé tel qu'orthographié dans le domaine du service
  "cyclo et pédestre": "#c9982f",
  "équestre": "#8b5a2b",
  equestre: "#8b5a2b",
  cheval: "#8b5a2b",
};
const FALLBACK_PALETTE = ["#6b4c9a", "#b0413e", "#4c6b4c", "#9a6b4c"];

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Legend",
  "esri/widgets/Search",
  "esri/widgets/FeatureTable",
  "esri/widgets/Home",
  "esri/widgets/Locate",
  "esri/widgets/Expand",
  "esri/widgets/ScaleBar",
], (
  esriConfig,
  Map,
  MapView,
  FeatureLayer,
  Legend,
  Search,
  FeatureTable,
  Home,
  Locate,
  Expand,
  ScaleBar
) => {
  // ---------- Popup ----------
  const popupTemplate = {
    title: "{nom_iti}",
    content: [
      {
        type: "fields",
        fieldInfos: [
          { fieldName: "type_iti", label: "Type d'itinéraire" },
          { fieldName: "pratique", label: "Pratique" },
          { fieldName: "etat_iti", label: "État" },
          {
            fieldName: "dist",
            label: "Distance (km)",
            format: { places: 1, digitSeparator: true },
          },
          { fieldName: "duree", label: "Durée estimée" },
          {
            fieldName: "denivele",
            label: "Dénivelé (m)",
            format: { places: 0, digitSeparator: true },
          },
          {
            fieldName: "alti_min",
            label: "Altitude min. (m)",
            format: { places: 0, digitSeparator: true },
          },
          {
            fieldName: "alti_max",
            label: "Altitude max. (m)",
            format: { places: 0, digitSeparator: true },
          },
          { fieldName: "nom_com", label: "Commune principale" },
          { fieldName: "nom_interco", label: "Intercommunalité" },
          { fieldName: "gestionnaire", label: "Gestionnaire" },
          { fieldName: "obs", label: "Observations" },
        ],
      },
    ],
  };

  // ---------- Couche ----------
  const trailsLayer = new FeatureLayer({
    url: FEATURE_LAYER_URL,
    title: "Itinéraires PDIPR du Cher",
    outFields: ["*"],
    popupTemplate,
    // Rendu provisoire ; remplacé dynamiquement une fois les valeurs de
    // "pratique" connues (voir buildRenderer)
    renderer: {
      type: "simple",
      symbol: { type: "simple-line", color: "#734c00", width: 2 },
    },
  });

  const map = new Map({
    basemap: "topo-vector",
    layers: [trailsLayer],
  });

  const view = new MapView({
    container: "viewDiv",
    map,
    extent: FULL_EXTENT,
    constraints: { snapToZoom: false },
    popup: {
      dockEnabled: true,
      dockOptions: { position: "top-right", breakpoint: false },
    },
  });

  view.ui.remove("zoom");
  view.ui.add("zoom", "bottom-right");

  const scaleBar = new ScaleBar({ view, unit: "metric" });
  view.ui.add(scaleBar, "bottom-left");

  // ---------- Actions de l'en-tête ----------
  const homeWidget = new Home({ view });
  document.getElementById("action-home").addEventListener("click", () => homeWidget.go());

  const locateWidget = new Locate({ view });
  document.getElementById("action-locate").addEventListener("click", () => locateWidget.locate());

  document.getElementById("action-print").addEventListener("click", () => window.print());

  const tableDrawer = document.getElementById("tableDrawer");
  document.getElementById("action-table").addEventListener("click", () => {
    tableDrawer.classList.toggle("open");
  });
  document.getElementById("closeTable").addEventListener("click", () => {
    tableDrawer.classList.remove("open");
  });

  // ---------- Légende ----------
  new Legend({ view, container: "legendContainer" });

  // ---------- Recherche ----------
  const searchWidget = new Search({
    view,
    container: "searchContainer",
    includeDefaultSources: true,
    sources: [
      {
        layer: trailsLayer,
        searchFields: ["nom_iti", "nom_com"],
        displayField: "nom_iti",
        exactMatch: false,
        outFields: ["*"],
        name: "Itinéraires & communes du Cher",
        placeholder: "Nom d'itinéraire ou de commune…",
      },
    ],
  });

  // ---------- Table attributaire ----------
  const featureTable = new FeatureTable({
    view,
    layer: trailsLayer,
    container: "featureTableContainer",
    visibleElements: { selectionColumn: false, menuItems: { columns: true, clearSelection: true } },
    columns: [
      { name: "nom_iti", label: "Itinéraire" },
      { name: "type_iti", label: "Type" },
      { name: "pratique", label: "Pratique" },
      { name: "etat_iti", label: "État" },
      { name: "dist", label: "Distance (km)" },
      { name: "denivele", label: "Dénivelé (m)" },
      { name: "duree", label: "Durée" },
      { name: "nom_com", label: "Commune" },
      { name: "gestionnaire", label: "Gestionnaire" },
    ],
  });

  featureTable.on("selection-change", () => {
    const selection = [...featureTable.highlightIds];
    if (selection.length) {
      trailsLayer.queryFeatures({ objectIds: selection, returnGeometry: true }).then((res) => {
        if (res.features[0]?.geometry) {
          view.goTo(res.features[0].geometry.extent.expand(1.5));
        }
      });
    }
  });

  // ---------- Filtres ----------
  const filterIds = {
    pratique: "filterPratique",
    type_iti: "filterType",
    etat_iti: "filterEtat",
  };

  function escapeSql(value) {
    return String(value).replace(/'/g, "''");
  }

  function currentClauses() {
    const clauses = [];
    Object.entries(filterIds).forEach(([field, id]) => {
      const el = document.getElementById(id);
      if (el && el.value) {
        clauses.push(`${field} = '${escapeSql(el.value)}'`);
      }
    });
    return clauses.length ? clauses.join(" AND ") : "1=1";
  }

  function applyFilters() {
    const where = currentClauses();
    trailsLayer.definitionExpression = where;
    refreshResultsList(where);
  }

  document.getElementById("resetFilters").addEventListener("click", () => {
    Object.values(filterIds).forEach((id) => {
      document.getElementById(id).value = "";
    });
    applyFilters();
  });

  Object.values(filterIds).forEach((id) => {
    document.getElementById(id).addEventListener("calciteSelectChange", applyFilters);
  });

  // Remplit un <calcite-select> avec les valeurs distinctes d'un champ
  async function populateSelect(field, selectId) {
    const result = await trailsLayer.queryFeatures({
      where: "1=1",
      outFields: [field],
      returnDistinctValues: true,
      returnGeometry: false,
      orderByFields: [field],
    });
    const select = document.getElementById(selectId);
    const values = result.features
      .map((f) => f.attributes[field])
      .filter((v) => v !== null && v !== undefined && v !== "");

    values.forEach((v) => {
      const opt = document.createElement("calcite-option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    return values;
  }

  function colorForPractice(value, index) {
    const key = String(value).toLowerCase();
    return PRACTICE_COLORS[key] || PRACTICE_COLORS[value] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
  }

  async function buildRenderer() {
    const practiceValues = await populateSelect("pratique", "filterPratique");
    await populateSelect("type_iti", "filterType");
    await populateSelect("etat_iti", "filterEtat");

    trailsLayer.renderer = {
      type: "unique-value",
      field: "pratique",
      defaultLabel: "Autre",
      defaultSymbol: { type: "simple-line", color: "#8a8a8a", width: 2 },
      uniqueValueInfos: practiceValues.map((v, i) => ({
        value: v,
        label: v,
        symbol: {
          type: "simple-line",
          color: colorForPractice(v, i),
          width: 3,
          cap: "round",
          join: "round",
        },
      })),
    };
  }

  // ---------- Liste des itinéraires (résultats) ----------
  function sparklineSVG(altiMin, altiMax) {
    const min = Number(altiMin);
    const max = Number(altiMax);
    if (!isFinite(min) || !isFinite(max) || max <= 0) return "";
    const ratio = Math.max(0.15, Math.min(1, (max - min) / max || 0.3));
    const barWidth = Math.round(24 * ratio) + 6;
    return `<svg class="elevation-spark" width="30" height="8" viewBox="0 0 30 8">
      <rect x="0" y="1" width="30" height="6" rx="3" fill="#e4e0d3"></rect>
      <rect x="0" y="1" width="${barWidth}" height="6" rx="3" fill="#a97417"></rect>
    </svg>`;
  }

  async function refreshResultsList(where) {
    const list = document.getElementById("trailList");
    const notice = document.querySelector("#resultsCount div[slot='message']");
    list.innerHTML = "";

    const result = await trailsLayer.queryFeatures({
      where: where || "1=1",
      outFields: ["nom_iti", "type_iti", "pratique", "dist", "alti_min", "alti_max", "OBJECTID"],
      returnGeometry: false,
      orderByFields: ["nom_iti"],
      num: 300,
    });

    notice.textContent = `${result.features.length} itinéraire(s) correspondant(s)`;

    result.features.forEach((f) => {
      const a = f.attributes;
      const item = document.createElement("calcite-list-item");
      item.label = a.nom_iti || "Itinéraire sans nom";
      item.description = `${a.type_iti || ""}${a.dist ? " · " + Number(a.dist).toFixed(1) + " km" : ""}`;

      const meta = document.createElement("div");
      meta.slot = "content-end";
      meta.className = "trail-item-meta";
      const dot = document.createElement("span");
      dot.className = "practice-dot";
      dot.style.background = colorForPractice(a.pratique, 0);
      meta.appendChild(dot);
      meta.insertAdjacentHTML("beforeend", sparklineSVG(a.alti_min, a.alti_max));
      item.appendChild(meta);

      item.addEventListener("calciteListItemSelect", () => {
        trailsLayer
          .queryFeatures({
            objectIds: [a.OBJECTID],
            returnGeometry: true,
            outFields: ["*"],
          })
          .then((res) => {
            const feature = res.features[0];
            if (feature?.geometry) {
              view.goTo(feature.geometry.extent.expand(2));
              view.openPopup({ features: [feature], location: feature.geometry.extent.center });
            }
          });
      });

      list.appendChild(item);
    });
  }

  // ---------- Initialisation ----------
  view.when(async () => {
    await trailsLayer.when();
    await buildRenderer();
    await refreshResultsList("1=1");
  });
});
