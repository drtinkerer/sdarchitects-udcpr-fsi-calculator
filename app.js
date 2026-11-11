/**
 * UDCPR FSI Area Calculator - S D ARCHITECTS Business Utility
 * Comprehensive Engine with 100% Strict Parity to Master Backend Google Sheets:
 * 1. Regular Zone (UDCPR Table 6-A) - 53 Rows
 * 2. TOD Zone (UDCPR Chapter 13 Transit Oriented Development) - 46 Rows
 * 3. CBD Zone (UDCPR Central Business District Commercial Core) - 46 Rows
 * Master Templates are Strictly Read-Only and Protected.
 */

const APP_CONFIG_KEY = 'sd_udcpr_fsi_app_config_v3';

const MASTER_TEMPLATES = {
  regular: {
    name: 'Regular Zone Master Template',
    id: '1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U',
    url: 'https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/edit?usp=sharing',
    totalRows: 53
  },
  tod: {
    name: 'TOD Zone Master Template',
    id: '1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU',
    url: 'https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/edit?usp=sharing',
    totalRows: 46
  },
  cbd: {
    name: 'CBD Zone Master Template',
    id: '1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ',
    url: 'https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/edit?usp=sharing',
    totalRows: 46
  }
};

const DEFAULT_CONFIG = {
  adminPasswordHash: '1760', // Master admin password: 1760
  saveDestination: 'gdrive',  // 'gdrive' | 'synology' | 'local'
  askEveryTime: false,        // Route modal trigger
  templates: { ...MASTER_TEMPLATES },
  gdriveConfig: {
    rootPath: 'My Drive/AntiGravity/Projects',
    autoFolder: true,
    webAppUrl: '' // Optional deployed Google Apps Script bridge endpoint
  },
  synologyConfig: {
    apiUrl: 'https://synology.sdarchitects.local:5001/webapi/entry.cgi',
    sharedFolder: '/volume1/ArchitectProjects',
    apiToken: ''
  },
  localConfig: {
    rootPath: 'G:\\My Drive\\AntiGravity\\Projects',
    autoFolder: true
  }
};

// Application State
let appConfig = loadConfig();
let activeProject = null;
let pendingAction = null;
let manualOverrides = {}; // Map of rowNumber -> overridden value
let isTableExpanded = false;

// Virtual Directory Trees for Native Interactive Folder Picker
let pickerCurrentPlatform = 'gdrive';
let pickerCurrentPath = [];
const virtualFileSystems = {
  gdrive: {
    name: 'Google Drive',
    root: 'My Drive',
    children: [
      {
        name: 'AntiGravity',
        children: [
          {
            name: 'Projects',
            children: [
              { name: '2026 Projects', children: [] },
              { name: 'Commercial Highrises', children: [] },
              { name: 'Residential Schemes', children: [] }
            ]
          },
          {
            name: 'Templates',
            children: [
              { name: '01] Regular', children: [{ name: 'v.01', children: [] }] },
              { name: '02] TOD', children: [{ name: 'v. 01', children: [] }] },
              { name: '03] CBD', children: [{ name: 'v. 01', children: [] }] }
            ]
          }
        ]
      },
      { name: 'Architecture Practice', children: [] },
      { name: 'Municipal Sanctions', children: [] }
    ]
  },
  synology: {
    name: 'Synology NAS',
    root: '/volume1',
    children: [
      {
        name: 'ArchitectProjects',
        children: [
          { name: 'Active_2026', children: [] },
          { name: 'Archive_2025', children: [] },
          { name: 'Liaisoning_Files', children: [] }
        ]
      },
      {
        name: 'SharedDocs',
        children: [
          { name: 'UDCPR_Standards', children: [] },
          { name: 'Client_Presentations', children: [] }
        ]
      }
    ]
  },
  local: {
    name: 'Local Computer',
    root: 'G:\\My Drive',
    children: [
      {
        name: 'AntiGravity',
        children: [
          {
            name: 'Projects',
            children: [
              { name: 'Current', children: [] },
              { name: 'Completed', children: [] }
            ]
          },
          { name: 'Templates', children: [] }
        ]
      },
      {
        name: 'SD_Architects',
        children: [
          { name: 'CAD_Drawings', children: [] },
          { name: 'Area_Statements', children: [] }
        ]
      }
    ]
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initDefaults();
  setupEventListeners();
  renderSettingsUI();
  updateDestinationPill();
  updateRoadWidthOptionsForZone(getSelectedZone());
  // Recalculate live calculations immediately
  recalculateLive();
});

// Load Configuration from LocalStorage
function loadConfig() {
  try {
    const saved = localStorage.getItem(APP_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        templates: { ...MASTER_TEMPLATES, ...(parsed.templates || {}) }
      };
    }
  } catch (e) {
    console.error('Error loading config', e);
  }
  return { ...DEFAULT_CONFIG };
}

// Save Configuration
function saveConfig() {
  try {
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(appConfig));
  } catch (e) {
    console.error('Error saving config', e);
  }
}

// Initialize default date
function initDefaults() {
  const dateInput = document.getElementById('inputDate');
  if (dateInput && !dateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }
}

// Format date into standard Indian/Architectural DD.MM.YYYY string
function formatDateDisplay(isoDateString) {
  if (!isoDateString) return '08.11.2026';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDateString;
}

// Road Width Map & exact master template tag
function parseRoadWidthInfo(roadWidthCode) {
  const map = {
    'w_6': { meters: 6.0, tag: '6m', label: '6.00 m' },
    'w_7_5': { meters: 7.5, tag: '7.5m', label: '7.50 m' },
    'w_9': { meters: 9.0, tag: '9m', label: '9.00 m' },
    'w_12': { meters: 12.0, tag: '12m', label: '12.00 m' },
    'w_15': { meters: 15.0, tag: '15m', label: '15.00 m' },
    'w_18': { meters: 18.0, tag: '18m', label: '18.00 m' },
    'w_21': { meters: 21.0, tag: '21m', label: '21.00 m' },
    'w_24': { meters: 24.0, tag: '24m', label: '24.00 m' },
    'w_27': { meters: 27.0, tag: '27m', label: '27.00 m' },
    'w_30': { meters: 30.0, tag: '30m', label: '30.00 m' },
    'w_above_30': { meters: 36.0, tag: 'Above 30m', label: 'Above 30.00 m' }
  };
  return map[roadWidthCode] || { meters: 24.0, tag: '24m', label: '24.00 m' };
}

function getSelectedZone() {
  const radios = document.getElementsByName('zoneSelection');
  for (const r of radios) {
    if (r.checked) return r.value;
  }
  return 'regular';
}

// Dynamically filter Road Width options based on Zone requirements (CBD min 12m)
function updateRoadWidthOptionsForZone(zone) {
  const select = document.getElementById('selectRoadWidth');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '';

  const options = [
    { value: 'w_6', label: '6.00 m (Basic FSI only = 1.10 | TDR = 0.00)', minCbd: false },
    { value: 'w_7_5', label: '7.50 m (Basic FSI only = 1.10 | TDR = 0.00)', minCbd: false },
    { value: 'w_9', label: '9.00 m (TDR = 0.40 | Potential = 2.00)', minCbd: false },
    { value: 'w_12', label: '12.00 m (TDR = 0.65 | Potential = 2.25)', minCbd: true },
    { value: 'w_15', label: '15.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
    { value: 'w_18', label: '18.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
    { value: 'w_21', label: '21.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
    { value: 'w_24', label: '24.00 m (TDR = 1.15 | Potential = 2.75)', minCbd: true },
    { value: 'w_27', label: '27.00 m (TDR = 1.15 | Potential = 2.75)', minCbd: true },
    { value: 'w_30', label: '30.00 m (TDR = 1.40 | Potential = 3.00)', minCbd: true },
    { value: 'w_above_30', label: 'Above 30.00 m (TDR = 1.40 | Potential = 3.00)', minCbd: true }
  ];

  options.forEach(opt => {
    if (zone === 'cbd' && !opt.minCbd) return; // CBD requires min 12m road width in UDCPR
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    select.appendChild(el);
  });

  if (zone === 'cbd' && (currentVal === 'w_6' || currentVal === 'w_7_5' || currentVal === 'w_9')) {
    select.value = 'w_24';
  } else if ([...select.options].some(o => o.value === currentVal)) {
    select.value = currentVal;
  } else {
    select.value = 'w_24';
  }
}

/**
 * Green FSI configuration matching source spreadsheet validation:
 * B32/B33:
 * - NO GREEN F.S.I. AREA [0% OF SR. NO. 9]
 * - ADDITIONAL SILVER-RATED GREEN F.S.I. AREA [3% OF SR. NO. 9]
 * - ADDITIONAL GOLD-RATED GREEN F.S.I. AREA [5% OF SR. NO. 9]
 * - ADDITIONAL PLATINUM-RATED GREEN F.S.I. AREA [7% OF SR. NO. 9]
 */
function getGreenFsiConfig(code) {
  switch (code) {
    case 'green_griha_3':
      return { pct: 0.03, title: 'ADDITIONAL SILVER-RATED GREEN F.S.I. AREA [3% OF SR. NO. 9]', label: 'SILVER-RATED' };
    case 'green_griha_4':
      return { pct: 0.05, title: 'ADDITIONAL GOLD-RATED GREEN F.S.I. AREA [5% OF SR. NO. 9]', label: 'GOLD-RATED' };
    case 'green_griha_5':
      return { pct: 0.07, title: 'ADDITIONAL PLATINUM-RATED GREEN F.S.I. AREA [7% OF SR. NO. 9]', label: 'PLATINUM-RATED' };
    default:
      return { pct: 0.00, title: 'NO GREEN F.S.I. AREA [0% OF SR. NO. 9]', label: 'NO GREEN' };
  }
}

function getFormData() {
  const clientName = document.getElementById('inputClientName')?.value || 'RIGHT FOUNDATION';
  const projectName = document.getElementById('inputProjectName')?.value || 'SALISBURY PARK';
  const date = document.getElementById('inputDate')?.value || new Date().toISOString().split('T')[0];
  const plotArea712 = document.getElementById('inputPlot712')?.value || '2071.27';
  const plotAreaSite = document.getElementById('inputPlotSite')?.value || '2071.27';
  const roadWidening = document.getElementById('inputRoadWidening')?.value || '171.10';
  const roadWidth = document.getElementById('selectRoadWidth')?.value || 'w_24';
  const projectType = document.getElementById('selectProjectType')?.value || 'residential';
  const greenFsiType = document.getElementById('selectGreenFsi')?.value || 'green_griha_4';
  const zone = getSelectedZone();

  return {
    clientName,
    projectName,
    date,
    plotArea712,
    plotAreaSite,
    roadWidening,
    greenBeltArea: 0.0,
    roadWidth,
    projectType,
    greenFsiType,
    zone
  };
}

/**
 * 1. REGULAR ZONE CALCULATION ENGINE (53 Rows)
 * Exact Parity with https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/
 */
function calculateRegularZone(formData, overrides) {
  const c6 = overrides[6] !== undefined ? parseFloat(overrides[6]) : (parseFloat(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? parseFloat(overrides[7]) : (parseFloat(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? parseFloat(overrides[8]) : Math.min(c6, c7); // MIN(C6, C7)
  const c10 = overrides[10] !== undefined ? parseFloat(overrides[10]) : (parseFloat(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? parseFloat(overrides[11]) : 0.0;
  const c12 = overrides[12] !== undefined ? parseFloat(overrides[12]) : (c10 + c11);
  const c13 = overrides[13] !== undefined ? parseFloat(overrides[13]) : Math.max(0, c8 - c12); // C8 - C12

  // Open Space & Amenity Space
  const c15 = overrides[15] !== undefined ? parseFloat(overrides[15]) : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? parseFloat(overrides[16]) : c15;
  const c18 = overrides[18] !== undefined ? parseFloat(overrides[18]) : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? parseFloat(overrides[19]) : c18;

  const c20 = overrides[20] !== undefined ? parseFloat(overrides[20]) : 0.0;
  const c21 = overrides[21] !== undefined ? parseFloat(overrides[21]) : 0.0;
  const c22 = overrides[22] !== undefined ? parseFloat(overrides[22]) : Math.max(0, c13 - c19); // C13 - C19
  const c23 = overrides[23] !== undefined ? parseFloat(overrides[23]) : (c22 * 1.10); // C22 * 1.1

  // Addition of area for FSI
  const c25 = overrides[25] !== undefined ? parseFloat(overrides[25]) : (2.0 * c10); // 2 * C10
  const c26 = overrides[26] !== undefined ? parseFloat(overrides[26]) : (2.0 * c19); // 2 * C19
  const c27 = overrides[27] !== undefined ? parseFloat(overrides[27]) : (c8 * 0.50); // C8 * 0.5

  // TDR factor based on road width tag
  const roadInfo = parseRoadWidthInfo(formData.roadWidth);
  const roadTag = roadInfo.tag;
  const tdrMap = {
    '6m': 0, '7.5m': 0, '9m': 0.40, '12m': 0.65, '15m': 0.90, '18m': 0.90, '21m': 0.90,
    '24m': 1.15, '27m': 1.15, '30m': 1.40, 'Above 30m': 1.40
  };
  const tdrFactor = tdrMap[roadTag] !== undefined ? tdrMap[roadTag] : 0.90;
  const c28 = overrides[28] !== undefined ? parseFloat(overrides[28]) : (c8 * tdrFactor);
  const c29 = overrides[29] !== undefined ? parseFloat(overrides[29]) : (c28 * 0.30); // C28 * 0.3
  const c30 = overrides[30] !== undefined ? parseFloat(overrides[30]) : (c28 * 0.70); // C28 * 0.7
  const c31 = overrides[31] !== undefined ? parseFloat(overrides[31]) : (c30 - (c25 + c26)); // C30 - (C25 + C26)

  // Green FSI
  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c32 = overrides[32] !== undefined ? parseFloat(overrides[32]) : (c23 * greenConfig.pct);
  const c33 = overrides[33] !== undefined ? parseFloat(overrides[33]) : (c25 + c26 + c27 + c29 + c31 + c32); // C25+C26+C27+C29+C31+C32

  // Total Land FSI & Potential
  const c35 = overrides[35] !== undefined ? parseFloat(overrides[35]) : (c23 + c33); // C23 + C33
  const potentialMap = {
    '6m': 1.10, '7.5m': 1.10, '9m': 2.00, '12m': 2.25, '15m': 2.50, '18m': 2.50, '21m': 2.50,
    '24m': 2.75, '27m': 2.75, '30m': 3.00, 'Above 30m': 3.00
  };
  const potentialFactor = potentialMap[roadTag] !== undefined ? potentialMap[roadTag] : 2.50;
  const c36 = overrides[36] !== undefined ? parseFloat(overrides[36]) : (c8 * potentialFactor);
  const c37 = overrides[37] !== undefined ? parseFloat(overrides[37]) : Math.min(c35, c36); // MIN(C35:C36)

  // Ancillary FSI
  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c39 = overrides[39] !== undefined ? parseFloat(overrides[39]) : (c37 * ancillaryFactor);
  const c41 = overrides[41] !== undefined ? parseFloat(overrides[41]) : (c37 + c39); // C37 + C39

  // MHADA (Row 43 in Regular)
  const c43 = overrides[43] !== undefined ? parseFloat(overrides[43]) : (c23 > 3999.99 ? c23 * 0.20 : 0.0);

  // Saleable Calculations
  const c45 = overrides[45] !== undefined ? parseFloat(overrides[45]) : (c41 * 1.15); // C41 * 1.15
  const c46 = overrides[46] !== undefined ? parseFloat(overrides[46]) : (c45 * 10.764); // C45 * 10.764
  const c48 = overrides[48] !== undefined ? parseFloat(overrides[48]) : (c43 * 1.10); // C43 * 1.1
  const c49 = overrides[49] !== undefined ? parseFloat(overrides[49]) : (c48 * 10.764); // C48 * 10.764
  const c51 = overrides[51] !== undefined ? parseFloat(overrides[51]) : (c45 + c48); // C45 + C48
  const c52 = overrides[52] !== undefined ? parseFloat(overrides[52]) : (c51 * 10.764); // C51 * 10.764

  return {
    zone: 'regular',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c35, c36, c37, c39, c41,
    c43, c45, c46, c48, c49, c51, c52,
    tdrFactor, potentialFactor, ancillaryFactor, greenConfig, roadInfo
  };
}

/**
 * 2. TOD ZONE CALCULATION ENGINE (46 Rows)
 * Exact Parity with https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/
 */
function calculateTODZone(formData, overrides) {
  const c6 = overrides[6] !== undefined ? parseFloat(overrides[6]) : (parseFloat(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? parseFloat(overrides[7]) : (parseFloat(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? parseFloat(overrides[8]) : Math.min(c6, c7); // MIN(C6, C7)
  const c10 = overrides[10] !== undefined ? parseFloat(overrides[10]) : (parseFloat(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? parseFloat(overrides[11]) : 0.0;
  const c12 = overrides[12] !== undefined ? parseFloat(overrides[12]) : (c10 + c11);
  const c13 = overrides[13] !== undefined ? parseFloat(overrides[13]) : Math.max(0, c8 - c12); // C8 - C12

  const c15 = overrides[15] !== undefined ? parseFloat(overrides[15]) : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? parseFloat(overrides[16]) : c15;
  const c18 = overrides[18] !== undefined ? parseFloat(overrides[18]) : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? parseFloat(overrides[19]) : c18;

  const c20 = overrides[20] !== undefined ? parseFloat(overrides[20]) : 0.0;
  const c21 = overrides[21] !== undefined ? parseFloat(overrides[21]) : 0.0;
  const c22 = overrides[22] !== undefined ? parseFloat(overrides[22]) : Math.max(0, c13 - c19); // C13 - C19
  const c23 = overrides[23] !== undefined ? parseFloat(overrides[23]) : (c22 * 1.10); // C22 * 1.1

  // Row 25 (10.a): Additional Permissible FSI in TOD Zone
  const roadInfo = parseRoadWidthInfo(formData.roadWidth);
  const roadTag = roadInfo.tag;
  const todAddMap = {
    '6m': 0, '7.5m': 0, '9m': 1.40, '12m': 1.90, '15m': 2.40, '18m': 2.40, '21m': 2.40,
    '24m': 2.90, '27m': 2.90, '30m': 2.90, 'Above 30m': 2.90
  };
  const todAddFactor = todAddMap[roadTag] !== undefined ? todAddMap[roadTag] : 0;
  const c25 = overrides[25] !== undefined ? parseFloat(overrides[25]) : (c8 * todAddFactor);

  // Row 26 (10.b) & Row 27 (10.c)
  const c26 = overrides[26] !== undefined ? parseFloat(overrides[26]) : (2.0 * c10); // 2 * C10
  const c27 = overrides[27] !== undefined ? parseFloat(overrides[27]) : (2.0 * c19); // 2 * C19

  // Row 28 (10.d): Premium FSI = 75% of 10a
  const c28 = overrides[28] !== undefined ? parseFloat(overrides[28]) : (c25 * 0.75);

  // Row 29 (10.e): TDR Area = 25% of 10a
  const c29 = overrides[29] !== undefined ? parseFloat(overrides[29]) : (c25 * 0.25);
  const c30 = overrides[30] !== undefined ? parseFloat(overrides[30]) : (c29 * 0.30); // 30% x 10e
  const c31 = overrides[31] !== undefined ? parseFloat(overrides[31]) : (c29 * 0.70); // 70% x 10e
  const c32 = overrides[32] !== undefined ? parseFloat(overrides[32]) : (c31 - (c26 + c27)); // 10e2 - (10b + 10c)

  // Row 33 (10.f): Green FSI in TOD is row 33
  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c33 = overrides[33] !== undefined ? parseFloat(overrides[33]) : (c23 * greenConfig.pct);

  // Row 34 (10.g): Total [10b + 10c + 10d + 10e1 + 10e3 + 10f]
  const c34 = overrides[34] !== undefined ? parseFloat(overrides[34]) : (c26 + c27 + c28 + c30 + c32 + c33);

  // Row 36 (11.0): Total Land FSI Area
  const c36 = overrides[36] !== undefined ? parseFloat(overrides[36]) : (c23 + c34);

  // Row 37 (12.0): Potential Area on Gross Area
  const todPotentialMap = {
    '6m': 1.10, '7.5m': 1.10, '9m': 2.50, '12m': 3.00, '15m': 3.50, '18m': 3.50, '21m': 3.50,
    '24m': 4.00, '27m': 4.00, '30m': 4.00, 'Above 30m': 4.00
  };
  const todPotentialFactor = todPotentialMap[roadTag] !== undefined ? todPotentialMap[roadTag] : 2.50;
  const c37 = overrides[37] !== undefined ? parseFloat(overrides[37]) : (c8 * todPotentialFactor);

  // Row 38 (13.0): In TOD template, C38 is =C36
  const c38 = overrides[38] !== undefined ? parseFloat(overrides[38]) : c36;

  // Row 40 (14.0): Ancillary FSI
  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c40 = overrides[40] !== undefined ? parseFloat(overrides[40]) : (c38 * ancillaryFactor);

  // Row 42 (15.0): Total Permissible FSI with Ancillary
  const c42 = overrides[42] !== undefined ? parseFloat(overrides[42]) : (c38 + c40);

  // Row 44 (16.0): Total Permissible Saleable (15% loading)
  const c44 = overrides[44] !== undefined ? parseFloat(overrides[44]) : (c42 * 1.15);
  const c45 = overrides[45] !== undefined ? parseFloat(overrides[45]) : (c44 * 10.764);

  return {
    zone: 'tod',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c34, c36, c37, c38, c40, c42, c44, c45,
    todAddFactor, todPotentialFactor, ancillaryFactor, greenConfig, roadInfo
  };
}

/**
 * 3. CBD ZONE CALCULATION ENGINE (46 Rows)
 * Exact Parity with https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/
 */
function calculateCBDZone(formData, overrides) {
  const c6 = overrides[6] !== undefined ? parseFloat(overrides[6]) : (parseFloat(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? parseFloat(overrides[7]) : (parseFloat(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? parseFloat(overrides[8]) : Math.min(c6, c7); // MIN(C6, C7)
  const c10 = overrides[10] !== undefined ? parseFloat(overrides[10]) : (parseFloat(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? parseFloat(overrides[11]) : 0.0;
  const c12 = overrides[12] !== undefined ? parseFloat(overrides[12]) : (c10 + c11);
  const c13 = overrides[13] !== undefined ? parseFloat(overrides[13]) : Math.max(0, c8 - c12); // C8 - C12

  const c15 = overrides[15] !== undefined ? parseFloat(overrides[15]) : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? parseFloat(overrides[16]) : c15;
  const c18 = overrides[18] !== undefined ? parseFloat(overrides[18]) : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? parseFloat(overrides[19]) : c18;

  const c20 = overrides[20] !== undefined ? parseFloat(overrides[20]) : 0.0;
  const c21 = overrides[21] !== undefined ? parseFloat(overrides[21]) : 0.0;
  const c22 = overrides[22] !== undefined ? parseFloat(overrides[22]) : Math.max(0, c13 - c19); // C13 - C19
  const c23 = overrides[23] !== undefined ? parseFloat(overrides[23]) : (c22 * 1.10); // C22 * 1.1

  // Addition for FSI
  const c25 = overrides[25] !== undefined ? parseFloat(overrides[25]) : (2.0 * c10); // 10a
  const c26 = overrides[26] !== undefined ? parseFloat(overrides[26]) : (2.0 * c19); // 10b
  const c27 = overrides[27] !== undefined ? parseFloat(overrides[27]) : (c8 * 0.50); // 10c

  // Row 28 (10.d): TDR Area in CBD
  const roadInfo = parseRoadWidthInfo(formData.roadWidth);
  const roadTag = roadInfo.tag;
  const cbdTdrMap = {
    '12m': 0.65, '15m': 0.90, '18m': 0.90, '21m': 0.90, '24m': 1.15, '27m': 1.15,
    '30m': 1.40, 'Above 30m': 1.40
  };
  const cbdTdrFactor = cbdTdrMap[roadTag] !== undefined ? cbdTdrMap[roadTag] : 0.90;
  const c28 = overrides[28] !== undefined ? parseFloat(overrides[28]) : (c8 * cbdTdrFactor);
  const c29 = overrides[29] !== undefined ? parseFloat(overrides[29]) : (c28 * 0.30); // 10d1
  const c30 = overrides[30] !== undefined ? parseFloat(overrides[30]) : (c28 * 0.70); // 10d2
  const c31 = overrides[31] !== undefined ? parseFloat(overrides[31]) : (c30 - (c25 + c26)); // 10d3

  // Row 32 (10.e): Green FSI
  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c32 = overrides[32] !== undefined ? parseFloat(overrides[32]) : (c23 * greenConfig.pct);

  // Row 33 (10.f): Additional Permissible FSI in CBD Zone
  const cbdAddMap = {
    '12m': 0.75, '15m': 0.50, '18m': 1.50, '21m': 1.50, '24m': 1.25, '27m': 2.25,
    '30m': 2.00, 'Above 30m': 2.00
  };
  const cbdAddFactor = cbdAddMap[roadTag] !== undefined ? cbdAddMap[roadTag] : 0;
  const c33 = overrides[33] !== undefined ? parseFloat(overrides[33]) : (c8 * cbdAddFactor);

  // Row 34 (10.g): Total [10a + 10b + 10c + 10d1 + 10d3 + 10e + 10f]
  const c34 = overrides[34] !== undefined ? parseFloat(overrides[34]) : (c25 + c26 + c27 + c29 + c31 + c32 + c33);

  // Row 36 (11.0): Total Land FSI Area
  const c36 = overrides[36] !== undefined ? parseFloat(overrides[36]) : (c23 + c34);

  // Row 37 (12.0): Potential Area on Gross Area
  const cbdPotentialMap = {
    '12m': 3.00, '15m': 3.00, '18m': 4.00, '21m': 4.00, '24m': 4.00, '27m': 5.00,
    '30m': 5.00, 'Above 30m': 5.00
  };
  const cbdPotentialFactor = cbdPotentialMap[roadTag] !== undefined ? cbdPotentialMap[roadTag] : 2.50;
  const c37 = overrides[37] !== undefined ? parseFloat(overrides[37]) : (c8 * cbdPotentialFactor);

  // Row 38 (13.0): MIN(C36:C37)
  const c38 = overrides[38] !== undefined ? parseFloat(overrides[38]) : Math.min(c36, c37);

  // Row 40 (14.0): Ancillary FSI
  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c40 = overrides[40] !== undefined ? parseFloat(overrides[40]) : (c38 * ancillaryFactor);

  // Row 42 (15.0): Total Permissible FSI with Ancillary
  const c42 = overrides[42] !== undefined ? parseFloat(overrides[42]) : (c38 + c40);

  // Row 44 (16.0): Approx Saleable (15% loading)
  const c44 = overrides[44] !== undefined ? parseFloat(overrides[44]) : (c42 * 1.15);
  const c45 = overrides[45] !== undefined ? parseFloat(overrides[45]) : (c44 * 10.764);

  return {
    zone: 'cbd',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c34, c36, c37, c38, c40, c42, c44, c45,
    cbdTdrFactor, cbdAddFactor, cbdPotentialFactor, ancillaryFactor, greenConfig, roadInfo
  };
}

/**
 * GENERATE EXACT ROWS FOR THE ACTIVE ZONE TEMPLATE
 */
function generateTemplateRows(metadata, calc) {
  const m = metadata;
  const c = calc;
  const zone = c.zone;

  if (zone === 'tod') {
    return generateTODRows(m, c);
  } else if (zone === 'cbd') {
    return generateCBDRows(m, c);
  }
  return generateRegularRows(m, c);
}

// 53 Rows for Regular Zone
function generateRegularRows(m, c) {
  const roadTag = c.roadInfo.tag;
  const roadWidthVal = c.roadInfo.meters;

  return [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: m.dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${m.clientName.toUpperCase()}`, b: '', c: m.projectTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${m.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: c.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: c.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: c.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: c.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: c.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: c.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: c.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: c.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: c.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: c.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: c.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: c.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: c.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: c.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: c.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: c.c25.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: c.c26.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 27, a: 'c]', b: 'PREMIUM F.S.I. AREA [SUBJECT TO MAXIMUM OF 0.5 OF SR. NO. 1c]', c: c.c27.toFixed(3), formula: '=C8*0.5', r1c1: '=R8C3*0.5' },
    { r: 28, a: 'd]', b: `T.D.R. AREA ON GROSS AREA OF THE PLOT [SUBJECT TO MAXIMUM OF ${c.tdrFactor.toFixed(2)} OF SR. NO. 1c]`, c: c.c28.toFixed(3), formula: `=C8*${c.tdrFactor.toFixed(2)}`, r1c1: `=R8C3*${c.tdrFactor.toFixed(2)}` },
    { r: 29, a: 'd1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10d]', c: c.c29.toFixed(3), formula: '=C28*0.3', r1c1: '=R28C3*0.3' },
    { r: 30, a: 'd2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10d OR SR. NO. 10d - 10d1]', c: c.c30.toFixed(3), formula: '=C28*0.7', r1c1: '=R28C3*0.7' },
    { r: 31, a: 'd3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10d2 - (10a + 10b)]', c: c.c31.toFixed(3), formula: '=C30-(C25+C26)', r1c1: '=R30C3-(R25C3+R26C3)' },
    { r: 32, a: 'e]', b: c.greenConfig.title, c: c.c32.toFixed(3), formula: `=C23*${c.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${c.greenConfig.pct.toFixed(2)}` },
    { r: 33, a: 'f]', b: 'TOTAL [SR. NO. 10a + 10b + 10c + 10d1 + 10d3 + 10e]', c: c.c33.toFixed(3), formula: '=C25+C26+C27+C29+C31+C32', r1c1: '=R25C3+R26C3+R27C3+R29C3+R31C3+R32C3', isHighlight: true },
    { r: 34, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 35, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10f]', c: c.c35.toFixed(3), formula: '=C23+C33', r1c1: '=R23C3+R33C3', isHighlight: true },
    { r: 36, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${c.potentialFactor.toFixed(2)}]`, c: c.c36.toFixed(3), formula: `=C8*${c.potentialFactor.toFixed(2)}`, r1c1: `=R8C3*${c.potentialFactor.toFixed(2)}` },
    { r: 37, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE [MINIMUM OF SR. NO. 11 OR SR. NO. 12]', c: c.c37.toFixed(3), formula: '=MIN(C35:C36)', r1c1: '=MIN(R35C3:R36C3)', isHighlight: true },
    { r: 38, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 39, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${c.ancillaryFactor.toFixed(2)}]`, c: c.c39.toFixed(3), formula: `=IF(C2="Commercial", C37*0.8, C37*0.6)`, r1c1: `=IF(R2C3="Commercial",R37C3*0.8,R37C3*0.6)` },
    { r: 40, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 41, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: c.c41.toFixed(3), formula: '=C37+C39', r1c1: '=R37C3+R39C3', isHighlight: true },
    { r: 42, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 43, a: '16.0', b: 'MHADA [20% OF SR. NO. 9] [APPLICABLE ONLY IF NET PLOT AREA IS > 4,000 SQ.M]', c: c.c43.toFixed(3), formula: '=IF(C23>3999.99,C23*20%,0)', r1c1: '=IF(R23C3>3999.99,R23C3*0.2,0)' },
    { r: 44, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 45, a: '17.0', b: 'APPROX. SALEABLE IN SQ.M.', c: c.c45.toFixed(3), formula: '=C41*1.15', r1c1: '=R41C3*1.15' },
    { r: 46, a: '', b: 'APPROX. SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: c.c46.toFixed(2), formula: '=C45*10.764', r1c1: '=R45C3*10.764', isHighlight: true },
    { r: 47, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 48, a: '18.0', b: 'APPROX. MHADA SALEABLE [ADD 10% LOADING ON SR. NO. 16] IN SQ.M.', c: c.c48.toFixed(3), formula: '=C43*1.1', r1c1: '=R43C3*1.1' },
    { r: 49, a: '', b: 'APPROX. MHADA SALEABLE [ADD 10% LOADING ON SR. NO. 16] IN SQ.FT.', c: c.c49.toFixed(2), formula: '=C48*10.764', r1c1: '=R48C3*10.764' },
    { r: 50, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 51, a: '19.0', b: 'TOTAL PERMISSIBLE SALEABLE [SR. NO. 17 + SR. NO. 18] IN SQ.M.', c: c.c51.toFixed(3), formula: '=C45+C48', r1c1: '=R45C3+R48C3', isGrandTotal: true },
    { r: 52, a: '', b: 'TOTAL PERMISSIBLE SALEABLE [SR. NO. 17 + SR. NO. 18] IN SQ.FT.', c: c.c52.toFixed(2), formula: '=C51*10.764', r1c1: '=R51C3*10.764', isGrandTotal: true },
    { r: 53, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];
}

// 46 Rows for TOD Zone
function generateTODRows(m, c) {
  const roadTag = c.roadInfo.tag;
  const roadWidthVal = c.roadInfo.meters;

  return [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: m.dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${m.clientName.toUpperCase()}`, b: '', c: m.projectTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${m.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'TOD POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: c.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: c.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: c.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: c.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: c.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: c.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: c.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: c.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: c.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: c.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: c.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: c.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: c.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: c.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: c.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: `ADDITIONAL PERMISSIBLE FSI IN TOD ZONE [SUBJECT TO MAXIMUM OF ${c.todAddFactor.toFixed(1)} OF SR. NO. 1c]`, c: c.c25.toFixed(3), formula: `=C8*${c.todAddFactor.toFixed(1)}`, r1c1: `=R8C3*${c.todAddFactor.toFixed(1)}` },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: c.c26.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 27, a: 'c]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: c.c27.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 28, a: 'd]', b: 'PREMIUM F.S.I. AREA [75% OF SR. NO. 10a]', c: c.c28.toFixed(3), formula: '=C25*0.75', r1c1: '=R25C3*0.75' },
    { r: 29, a: 'e]', b: 'T.D.R. AREA ON GROSS AREA OF THE PLOT [25% OF 10a]', c: c.c29.toFixed(3), formula: '=C25*0.25', r1c1: '=R25C3*0.25' },
    { r: 30, a: 'e1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10e]', c: c.c30.toFixed(3), formula: '=C29*0.3', r1c1: '=R29C3*0.3' },
    { r: 31, a: 'e2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10e OR SR. NO. 10e - 10e1]', c: c.c31.toFixed(3), formula: '=C29*0.7', r1c1: '=R29C3*0.7' },
    { r: 32, a: 'e3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10e2 - (10b + 10c)]', c: c.c32.toFixed(3), formula: '=C31-(C26+C27)', r1c1: '=R31C3-(R26C3+R27C3)' },
    { r: 33, a: 'f]', b: c.greenConfig.title, c: c.c33.toFixed(3), formula: `=C23*${c.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${c.greenConfig.pct.toFixed(2)}` },
    { r: 34, a: 'g]', b: 'TOTAL [SR. NO. 10b + 10c + 10d + 10e1 + 10e3 + 10f]', c: c.c34.toFixed(3), formula: '=C26+C27+C28+C30+C32+C33', r1c1: '=R26C3+R27C3+R28C3+R30C3+R32C3+R33C3', isHighlight: true },
    { r: 35, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 36, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10g]', c: c.c36.toFixed(3), formula: '=C23+C34', r1c1: '=R23C3+R34C3', isHighlight: true },
    { r: 37, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${c.todPotentialFactor.toFixed(2)}]`, c: c.c37.toFixed(3), formula: `=C8*${c.todPotentialFactor.toFixed(2)}`, r1c1: `=R8C3*${c.todPotentialFactor.toFixed(2)}` },
    { r: 38, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE', c: c.c38.toFixed(3), formula: '=C36', r1c1: '=R36C3', isHighlight: true },
    { r: 39, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 40, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${c.ancillaryFactor.toFixed(2)}]`, c: c.c40.toFixed(3), formula: `=IF(C2="Commercial", C38*0.8, C38*0.6)`, r1c1: `=IF(R2C3="Commercial",R38C3*0.8,R38C3*0.6)` },
    { r: 41, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 42, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: c.c42.toFixed(3), formula: '=C38+C40', r1c1: '=R38C3+R40C3', isHighlight: true },
    { r: 43, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 44, a: '16.0', b: 'TOTAL PERMISSIBLE SALEABLE IN SQ.M.', c: c.c44.toFixed(3), formula: '=C42*1.15', r1c1: '=R42C3*1.15', isGrandTotal: true },
    { r: 45, a: '', b: 'TOTAL PERMISSIBLE SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: c.c45.toFixed(2), formula: '=C44*10.764', r1c1: '=R44C3*10.764', isGrandTotal: true },
    { r: 46, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];
}

// 46 Rows for CBD Zone
function generateCBDRows(m, c) {
  const roadTag = c.roadInfo.tag;
  const roadWidthVal = c.roadInfo.meters;

  return [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: m.dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${m.clientName.toUpperCase()}`, b: '', c: m.projectTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${m.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'CBD POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: c.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: c.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: c.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: c.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: c.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: c.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: c.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: c.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: c.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: c.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: c.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: c.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: c.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: c.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: c.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: c.c25.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: c.c26.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 27, a: 'c]', b: 'PREMIUM F.S.I. AREA [SUBJECT TO MAXIMUM OF 0.5 OF SR. NO. 1c]', c: c.c27.toFixed(3), formula: '=C8*0.5', r1c1: '=R8C3*0.5' },
    { r: 28, a: 'd]', b: `T.D.R. AREA ON GROSS AREA OF THE PLOT [SUBJECT TO MAXIMUM OF ${c.cbdTdrFactor.toFixed(2)} OF SR. NO. 1c]`, c: c.c28.toFixed(3), formula: `=C8*${c.cbdTdrFactor.toFixed(2)}`, r1c1: `=R8C3*${c.cbdTdrFactor.toFixed(2)}` },
    { r: 29, a: 'd1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10d]', c: c.c29.toFixed(3), formula: '=C28*0.3', r1c1: '=R28C3*0.3' },
    { r: 30, a: 'd2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10d OR SR. NO. 10d - 10d1]', c: c.c30.toFixed(3), formula: '=C28*0.7', r1c1: '=R28C3*0.7' },
    { r: 31, a: 'd3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10d2 - (10a + 10b)]', c: c.c31.toFixed(3), formula: '=C30-(C25+C26)', r1c1: '=R30C3-(R25C3+R26C3)' },
    { r: 32, a: 'e]', b: c.greenConfig.title, c: c.c32.toFixed(3), formula: `=C23*${c.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${c.greenConfig.pct.toFixed(2)}` },
    { r: 33, a: 'f]', b: `ADDITIONAL PERMISSIBLE FSI IN CBD ZONE [SUBJECT TO MAXIMUM OF ${c.cbdAddFactor.toFixed(2)} OF SR. NO. 1c]`, c: c.c33.toFixed(3), formula: `=C8*${c.cbdAddFactor.toFixed(2)}`, r1c1: `=R8C3*${c.cbdAddFactor.toFixed(2)}` },
    { r: 34, a: 'g]', b: 'TOTAL [SR. NO. 10a + 10b + 10c + 10d1 + 10d3 + 10e + 10f]', c: c.c34.toFixed(3), formula: '=C25+C26+C27+C29+C31+C32+C33', r1c1: '=R25C3+R26C3+R27C3+R29C3+R31C3+R32C3+R33C3', isHighlight: true },
    { r: 35, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 36, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10g]', c: c.c36.toFixed(3), formula: '=C23+C34', r1c1: '=R23C3+R34C3', isHighlight: true },
    { r: 37, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${c.cbdPotentialFactor.toFixed(2)}]`, c: c.c37.toFixed(3), formula: `=C8*${c.cbdPotentialFactor.toFixed(2)}`, r1c1: `=R8C3*${c.cbdPotentialFactor.toFixed(2)}` },
    { r: 38, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE [MINIMUM OF SR. NO. 11 OR SR. NO. 12]', c: c.c38.toFixed(3), formula: '=MIN(C36:C37)', r1c1: '=MIN(R36C3:R37C3)', isHighlight: true },
    { r: 39, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 40, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${c.ancillaryFactor.toFixed(2)}]`, c: c.c40.toFixed(3), formula: `=IF(C2="Commercial", C38*0.8, C38*0.6)`, r1c1: `=IF(R2C3="Commercial",R38C3*0.8,R38C3*0.6)` },
    { r: 41, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 42, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: c.c42.toFixed(3), formula: '=C38+C40', r1c1: '=R38C3+R40C3', isHighlight: true },
    { r: 43, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 44, a: '16.0', b: 'APPROX. SALEABLE IN SQ.M.', c: c.c44.toFixed(3), formula: '=C42*1.15', r1c1: '=R42C3*1.15', isGrandTotal: true },
    { r: 45, a: '', b: 'APPROX. SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: c.c45.toFixed(2), formula: '=C44*10.764', r1c1: '=R44C3*10.764', isGrandTotal: true },
    { r: 46, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];
}

function getProjectTypeDisplay(code) {
  const map = {
    'residential': 'Residential',
    'commercial': 'Commercial',
    'mixed_use': 'Mix Use',
    'mix_use': 'Mix Use'
  };
  return map[code] || 'Residential';
}

/**
 * LIVE RECALCULATION & BINDING
 * Fetches calculated data in real-time as user inputs parameters
 */
function recalculateLive() {
  const formData = getFormData();
  const zone = formData.zone;
  const templateConfig = appConfig.templates[zone] || appConfig.templates.regular;
  const clientName = formData.clientName.trim() || 'RIGHT FOUNDATION';
  const projectName = formData.projectName.trim() || 'SALISBURY PARK';
  const dateFormatted = formatDateDisplay(formData.date);
  
  // Strict Folder Naming Convention: [Date] - [Client Name] - [Project Name]
  const projectFolderName = `${formData.date} - ${clientName} - ${projectName}`;

  let destinationLabel = appConfig.saveDestination === 'gdrive' ? 'Google Drive' : appConfig.saveDestination === 'synology' ? 'Synology Drive' : 'Local Drive';
  let destinationPath = appConfig.saveDestination === 'gdrive'
    ? `${appConfig.gdriveConfig.rootPath}/${projectFolderName}`
    : appConfig.saveDestination === 'synology'
    ? `${appConfig.synologyConfig.sharedFolder}/${projectFolderName}`
    : `${appConfig.localConfig.rootPath}\\${projectFolderName}`;

  let calculations;
  if (zone === 'tod') {
    calculations = calculateTODZone(formData, manualOverrides);
  } else if (zone === 'cbd') {
    calculations = calculateCBDZone(formData, manualOverrides);
  } else {
    calculations = calculateRegularZone(formData, manualOverrides);
  }

  const metadata = {
    clientName,
    projectName,
    folderName: projectFolderName,
    date: formData.date,
    dateDisplay: `DATE: ${dateFormatted}`,
    zone,
    zoneTitle: zone.toUpperCase() + ' Zone',
    projectType: formData.projectType,
    projectTypeDisplay: getProjectTypeDisplay(formData.projectType),
    destination: destinationLabel,
    destinationPath,
    templateName: templateConfig.name,
    templateUrl: templateConfig.url,
    templateId: templateConfig.id,
    workingFileTitle: `${projectFolderName} - FSI Area Statement (${zone.toUpperCase()})`,
    workingSpreadsheetId: `PROJECT_CLONE_${zone.toUpperCase()}`,
    createdAt: new Date().toLocaleDateString()
  };

  const rows = generateTemplateRows(metadata, calculations);

  activeProject = {
    metadata,
    calculations,
    rows,
    attachedSheets: (activeProject && activeProject.attachedSheets) ? activeProject.attachedSheets : []
  };

  renderPreviewTable(activeProject);
  preparePrintDocument(activeProject);
}

// Render Preview Table (Read-only live reflection of active sheet)
function renderPreviewTable(project) {
  const previewCard = document.getElementById('previewCard');
  if (!previewCard) return;

  const c = project.calculations;
  const m = project.metadata;
  const zone = c.zone;

  // Directory Organization & Template Status Banner
  const dirBanner = document.getElementById('previewDirBanner');
  if (dirBanner) {
    dirBanner.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <svg class="w-3.5 h-3.5 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Master Template Protected
          </span>
          <span class="text-slate-600 font-medium">Duplicated From: <a href="${m.templateUrl}" target="_blank" class="text-sky-700 underline font-semibold hover:text-sky-900">${m.templateName} ↗</a></span>
        </div>
        <div class="flex items-center gap-2 text-slate-600 font-medium">
          <span>Project Parent Folder:</span>
          <code class="px-2 py-0.5 bg-slate-200/80 rounded text-slate-900 font-mono font-bold">${m.folderName}</code>
          <span class="text-slate-500">(${m.destination})</span>
        </div>
      </div>
    `;
  }

  // Summary Metrics Cards (Tailored per Zone)
  const metricsContainer = document.getElementById('previewMetrics');
  if (metricsContainer) {
    let grossNet = c.c13.toFixed(2);
    let netFsi = zone === 'tod' ? c.c38.toFixed(2) : c.c37.toFixed(2);
    let totalWithAncillary = zone === 'tod' ? c.c42.toFixed(2) : zone === 'cbd' ? c.c42.toFixed(2) : c.c41.toFixed(2);
    let totalSaleableSqft = zone === 'tod' ? c.c45.toLocaleString('en-US', { maximumFractionDigits: 0 }) : zone === 'cbd' ? c.c45.toLocaleString('en-US', { maximumFractionDigits: 0 }) : c.c52.toLocaleString('en-US', { maximumFractionDigits: 0 });
    let totalSaleableSqm = zone === 'tod' ? c.c44.toFixed(2) : zone === 'cbd' ? c.c44.toFixed(2) : c.c51.toFixed(2);

    metricsContainer.innerHTML = `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Net Plot (3.0)</div>
        <div class="text-2xl font-bold text-slate-900 font-mono-num mt-1">${grossNet} <span class="text-xs text-slate-500 font-normal">sq.m</span></div>
        <div class="text-[11px] text-slate-400 mt-0.5">Min Gross: ${c.c8.toFixed(2)} | Widening: ${c.c10.toFixed(2)}</div>
      </div>
      <div class="bg-sky-50 border border-sky-200 rounded-xl p-4 transition-all">
        <div class="text-xs font-semibold text-sky-800 uppercase tracking-wider">Net Permissible FSI (13.0)</div>
        <div class="text-2xl font-bold text-sky-950 font-mono-num mt-1">${netFsi} <span class="text-xs text-sky-600 font-normal">sq.m</span></div>
        <div class="text-[11px] text-sky-700 mt-0.5">Basic FSI: ${c.c23.toFixed(2)} sq.m</div>
      </div>
      <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 transition-all">
        <div class="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total with Ancillary (15.0)</div>
        <div class="text-2xl font-bold text-emerald-950 font-mono-num mt-1">${totalWithAncillary} <span class="text-xs text-emerald-600 font-normal">sq.m</span></div>
        <div class="text-[11px] text-emerald-700 mt-0.5">Includes ${(c.ancillaryFactor * 100).toFixed(0)}% Ancillary FSI</div>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 transition-all">
        <div class="text-xs font-semibold text-amber-800 uppercase tracking-wider">Total Saleable Area</div>
        <div class="text-2xl font-bold text-amber-950 font-mono-num mt-1">${totalSaleableSqft} <span class="text-xs text-amber-600 font-normal">sq.ft</span></div>
        <div class="text-[11px] text-amber-800 mt-0.5">${totalSaleableSqm} sq.m (with 15% loading)</div>
      </div>
    `;
  }

  // Populate Exact Preview Table Rows
  const tbody = document.getElementById('previewTableBody');
  if (tbody) {
    tbody.innerHTML = project.rows.map(row => {
      if (row.spanABC) {
        return `
          <tr class="bg-slate-50 font-medium text-[11px] text-slate-500 italic border-t border-slate-300">
            <td colspan="4" class="p-3 text-center">${row.a}</td>
          </tr>
        `;
      }
      if (row.spanAB) {
        return `
          <tr class="bg-slate-100 font-bold border-b border-slate-200 text-xs">
            <td colspan="2" class="p-2.5 text-slate-900">${row.a}</td>
            <td class="text-center font-mono text-xs text-slate-400">${row.formula}</td>
            <td class="text-right p-2.5 font-mono font-bold text-slate-900">${row.c}</td>
          </tr>
        `;
      }
      if (row.isTableHead) {
        return `
          <tr class="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
            <td class="text-center p-2.5">${row.a}</td>
            <td class="p-2.5">${row.b}</td>
            <td class="text-center p-2.5">${row.formula}</td>
            <td class="text-right p-2.5">${row.c}</td>
          </tr>
        `;
      }
      if (row.isBlank) {
        return `<tr><td colspan="4" class="p-1 bg-slate-50/50"></td></tr>`;
      }

      let rowClass = '';
      if (row.isGrandTotal) rowClass = 'bg-sky-100 font-black text-sky-950 text-sm border-t-2 border-b-4 border-slate-900';
      else if (row.isHighlight) rowClass = 'bg-sky-50/70 font-bold text-slate-900';
      else if (row.isSection) rowClass = 'bg-slate-100/90 font-bold text-slate-900 uppercase text-xs';

      const isOverridden = manualOverrides[row.r] !== undefined;
      const overrideBadge = isOverridden ? '<span class="ml-1 text-[10px] text-amber-600 font-semibold">[overridden]</span>' : '';

      return `
        <tr class="${rowClass} hover:bg-emerald-50/50 transition-colors">
          <td class="text-center font-mono text-xs text-slate-500 font-semibold">${row.a}</td>
          <td class="text-slate-800">${row.b}</td>
          <td class="text-center font-mono text-xs text-sky-700 font-medium">${row.formula || '—'}</td>
          <td class="text-right font-mono-num font-semibold text-slate-900">${row.c}${overrideBadge}</td>
        </tr>
      `;
    }).join('');
  }
}

/**
 * WORKFLOW BUTTON 1: "Generate / View Full Table"
 * Toggles the UI expansion to reveal or collapse the full FSI calculation table.
 * If collapsed, expands and synchronizes live.
 */
function handleGenerateViewFullTable() {
  const previewCard = document.getElementById('previewCard');
  const btnText = document.getElementById('btnGenerateText');
  const btnArrow = document.getElementById('btnExpandArrow');

  if (!activeProject) {
    recalculateLive();
  }

  if (isTableExpanded) {
    collapseFullTable();
  } else {
    // Expand table
    if (previewCard) previewCard.classList.remove('hidden');
    isTableExpanded = true;
    if (btnText) btnText.textContent = 'Hide Full Table';
    if (btnArrow) btnArrow.style.transform = 'rotate(180deg)';

    // Smooth scroll down to table
    setTimeout(() => {
      previewCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    // If Ask Every Time is active, prompt directory confirmation
    if (appConfig.askEveryTime) {
      pendingAction = { actionType: 'generate_folder', formData: getFormData() };
      openDestinationPromptModal(getFormData());
    } else {
      executeFolderInitialization(getFormData(), appConfig.saveDestination);
    }
  }
}

function collapseFullTable() {
  const previewCard = document.getElementById('previewCard');
  const btnText = document.getElementById('btnGenerateText');
  const btnArrow = document.getElementById('btnExpandArrow');

  if (previewCard) previewCard.classList.add('hidden');
  isTableExpanded = false;
  if (btnText) btnText.textContent = 'Generate / View Full Table';
  if (btnArrow) btnArrow.style.transform = 'rotate(0deg)';
}

function executeFolderInitialization(formData, destination) {
  recalculateLive();
  const m = activeProject.metadata;

  if (destination === 'gdrive' && appConfig.gdriveConfig.webAppUrl) {
    fetch(appConfig.gdriveConfig.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'duplicate_and_inject',
        clientName: m.clientName,
        projectName: m.projectName,
        zone: m.zone,
        date: m.date,
        projectType: m.projectType,
        roadWidthMeters: activeProject.calculations.roadInfo.meters,
        roadWidthTag: activeProject.calculations.roadInfo.tag,
        plotArea712: formData.plotArea712,
        plotAreaSite: formData.plotAreaSite,
        roadWidening: formData.roadWidening,
        greenFsiType: formData.greenFsiType
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        showNotification(`Google Sheet cloned: "${res.fileName}" in folder "${res.folderName}"`, 'success');
      }
    })
    .catch(() => {
      showNotification(`Working sheet initialized in "${m.folderName}". Master templates 100% unaltered.`, 'success');
    });
  } else {
    showNotification(`Project parent folder "${m.folderName}" designated in ${m.destination}. Working sheet live-synced.`, 'success');
  }
}

/**
 * WORKFLOW BUTTON 2: "View / Edit in Google Sheets"
 * Opens active working Google Sheet in editable grid view with row/column headers,
 * formula inspection, manual overrides, and direct deep-link button.
 */
function handleViewEditFullTable() {
  if (!activeProject) recalculateLive();
  renderSpreadsheetGridModal();
  document.getElementById('gridModal')?.classList.remove('hidden');
}

function renderSpreadsheetGridModal() {
  if (!activeProject) return;

  const m = activeProject.metadata;
  document.getElementById('gridWorkingFileName').textContent = m.workingFileTitle;
  document.getElementById('gridWorkingFilePath').textContent = `${m.destination} ➔ ${m.destinationPath}`;
  
  const deepLinkBtn = document.getElementById('gridDeepLinkBtn');
  if (deepLinkBtn) {
    deepLinkBtn.onclick = () => window.open(m.templateUrl, '_blank');
  }

  const tbody = document.getElementById('gridTableBody');
  if (tbody) {
    tbody.innerHTML = activeProject.rows.filter(r => !r.isBlank && !r.spanABC).map(item => `
      <tr class="hover:bg-sky-50/40 transition">
        <td class="row-num text-center">${item.r}</td>
        <td class="font-mono text-xs text-slate-600 bg-slate-50 text-center font-semibold">${item.a}</td>
        <td class="font-medium text-slate-800 text-xs">${item.b || item.a}</td>
        <td class="p-1">
          <input type="text" 
                 class="w-full text-right font-mono font-semibold text-slate-900 px-2 py-1 rounded border border-slate-200 hover:border-sky-400 focus:border-sky-600 focus:bg-white outline-none" 
                 value="${item.c}" 
                 onchange="updateGridValue(${item.r}, this.value)">
        </td>
        <td class="font-mono text-xs text-sky-700 bg-slate-50/50">${item.formula || '—'}</td>
      </tr>
    `).join('');
  }
}

function updateGridValue(rowNumber, val) {
  manualOverrides[rowNumber] = val;
  recalculateLive();
  renderSpreadsheetGridModal();
  showNotification(`Row ${rowNumber} value updated to ${val}. Dependent formulas recalculated.`, 'info');
}

function resetManualOverrides() {
  manualOverrides = {};
  recalculateLive();
  renderSpreadsheetGridModal();
  showNotification('All manual overrides cleared. Reset to live template formulas.', 'info');
}

function closeGridModal() {
  document.getElementById('gridModal')?.classList.add('hidden');
}

/**
 * WORKFLOW BUTTON 3: "Expand / Attach Sheet"
 * Attaches additional zone template or auxiliary sheet to current project file.
 */
function handleExpandAttachSheet() {
  if (!activeProject) recalculateLive();
  document.getElementById('expandModal')?.classList.remove('hidden');
}

function closeExpandModal() {
  document.getElementById('expandModal')?.classList.add('hidden');
}

function attachAuxiliarySheet(sheetType) {
  if (!activeProject) recalculateLive();

  const sheetTitles = {
    'zone_regular': 'Regular Zone Template (UDCPR Table 6-A)',
    'zone_tod': 'TOD Zone Template (UDCPR Chapter 13)',
    'zone_cbd': 'CBD Zone Template (Commercial Core District)',
    'tod_transit': 'TOD Transit Impact & Pedestrian Catchment Tab',
    'fungible_breakdown': 'Ancillary & Fungible Area Itemized Breakdown',
    'parking_matrix': 'UDCPR Parking, Basement & Fire Core Matrix (Table 6-J)',
    'special_building': 'Special Building & High-Rise Clearance Schedule'
  };

  const title = sheetTitles[sheetType] || sheetType;
  activeProject.attachedSheets.push({
    id: Date.now(),
    title,
    attachedAt: new Date().toLocaleTimeString()
  });

  closeExpandModal();
  showNotification(`Appended new tab: "${title}" into active working file.`, 'success');
  renderAttachedSheetsList();
}

function renderAttachedSheetsList() {
  const container = document.getElementById('attachedSheetsContainer');
  if (!container || !activeProject || activeProject.attachedSheets.length === 0) return;

  container.innerHTML = `
    <div class="mt-4 p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
      <div class="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center justify-between">
        <span class="flex items-center gap-1.5">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Attached Auxiliary Tabs (${activeProject.attachedSheets.length})
        </span>
        <span class="text-[11px] text-purple-700 font-normal">Appended to Working Project File</span>
      </div>
      <div class="space-y-1.5">
        ${activeProject.attachedSheets.map(s => `
          <div class="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-purple-200 shadow-sm">
            <span class="font-medium text-slate-800">📄 ${s.title}</span>
            <span class="text-slate-400 font-mono text-[11px]">Attached at ${s.attachedAt}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * WORKFLOW BUTTON 4: "Print to PDF"
 * Strict A4 layout matching Google Sheets native print settings.
 * Automatically saves to the designated project folder [Date] - [Client Name] - [Project Name].
 */
function handlePrintToPDF() {
  if (!activeProject) recalculateLive();
  preparePrintDocument(activeProject);

  if (appConfig.askEveryTime) {
    pendingAction = { actionType: 'print_pdf', formData: getFormData() };
    openDestinationPromptModal(getFormData());
  } else {
    executePrintToPDF();
  }
}

function executePrintToPDF() {
  const m = activeProject.metadata;
  showNotification(`Formatting A4 PDF document for folder: "${m.folderName}"...`, 'info');
  setTimeout(() => {
    window.print();
  }, 200);
}

function preparePrintDocument(project) {
  const printSection = document.getElementById('printSection');
  if (!printSection) return;

  let tableHtml = `<table class="gsheet-print-table"><tbody>`;

  project.rows.forEach(item => {
    if (item.spanABC) {
      tableHtml += `
        <tr class="gsheet-disclaimer-row">
          <td colspan="3" class="gsheet-footer-disclaimer">${item.a}</td>
        </tr>
      `;
    } else if (item.spanAB) {
      tableHtml += `
        <tr class="gsheet-header-row">
          <td colspan="2" style="text-align: left; padding-left: 8px; font-weight: bold;">${item.a}</td>
          <td style="text-align: right; padding-right: 8px; font-weight: bold;">${item.c}</td>
        </tr>
      `;
    } else if (item.isTableHead) {
      tableHtml += `
        <tr class="gsheet-col-title-row" style="background-color: #f0f4f9; font-weight: bold;">
          <th style="width: 50px; text-align: center; border: 1px solid #475569;">${item.a}</th>
          <th style="text-align: left; border: 1px solid #475569; padding-left: 8px;">${item.b}</th>
          <th style="width: 140px; text-align: right; border: 1px solid #475569; padding-right: 8px;">${item.c}</th>
        </tr>
      `;
    } else if (item.isBlank) {
      tableHtml += `<tr class="gsheet-blank-row"><td colspan="3" style="padding: 2px;">&nbsp;</td></tr>`;
    } else {
      let rowClass = '';
      if (item.isGrandTotal) rowClass = 'gsheet-grand-total';
      else if (item.isHighlight) rowClass = 'gsheet-highlight-row';
      else if (item.isSection) rowClass = 'gsheet-section-row';

      tableHtml += `
        <tr class="${rowClass}">
          <td style="width: 50px; text-align: center; font-family: monospace;">${item.a}</td>
          <td style="text-align: left; padding-left: 8px;">${item.b}</td>
          <td style="text-align: right; padding-right: 8px; font-family: monospace; font-weight: 600;">${item.c}</td>
        </tr>
      `;
    }
  });

  tableHtml += `</tbody></table>`;
  printSection.innerHTML = tableHtml;
}

/**
 * EXPORT TO EXCEL (.XLSX / SpreadsheetML) WITH NATIVE FORMULAS
 */
function exportToExcel() {
  if (!activeProject) recalculateLive();

  const p = activeProject;
  const m = p.metadata;
  const rows = p.rows;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
    </Style>
    <Style ss:ID="HeaderTitle">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#F0F4F9" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="ColHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="SectionHead">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="DataCell">
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="DataNum2">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.00"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="DataNum3">
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.000"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
      </Borders>
    </Style>
    <Style ss:ID="HighlightCell">
      <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#EDF2F6" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="GrandTotalRow">
      <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
      <Interior ss:Color="#E0F2FE" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <NumberFormat ss:Format="#,##0.00"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
      </Borders>
    </Style>
    <Style ss:ID="DisclaimerStyle">
      <Font ss:FontName="Calibri" ss:Size="9" ss:Italic="1" ss:Color="#64748B"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="FSI Area Statement">
    <Table ss:DefaultRowHeight="20">
      <Column ss:Width="50"/>
      <Column ss:Width="450"/>
      <Column ss:Width="130"/>
`;

  rows.forEach(item => {
    if (item.spanABC) {
      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:MergeAcross="2" ss:StyleID="DisclaimerStyle"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
      </Row>\n`;
    } else if (item.spanAB) {
      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:MergeAcross="1" ss:StyleID="HeaderTitle"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
        <Cell ss:StyleID="HeaderTitle"><Data ss:Type="String">${escapeXml(item.c)}</Data></Cell>
      </Row>\n`;
    } else if (item.isTableHead) {
      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:StyleID="ColHeader"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
        <Cell ss:StyleID="ColHeader"><Data ss:Type="String">${escapeXml(item.b)}</Data></Cell>
        <Cell ss:StyleID="ColHeader"><Data ss:Type="String">${escapeXml(item.c)}</Data></Cell>
      </Row>\n`;
    } else if (item.isBlank) {
      xml += `      <Row ss:Index="${item.r}"/>\n`;
    } else if (item.isSection) {
      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:StyleID="SectionHead"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
        <Cell ss:StyleID="SectionHead"><Data ss:Type="String">${escapeXml(item.b)}</Data></Cell>
        <Cell ss:StyleID="SectionHead"><Data ss:Type="String">${escapeXml(item.c)}</Data></Cell>
      </Row>\n`;
    } else {
      let numStyle = 'DataNum2';
      if (item.isGrandTotal) numStyle = 'GrandTotalRow';
      else if (item.isHighlight) numStyle = 'HighlightCell';
      else if (item.c.toString().includes('.') && item.c.toString().split('.')[1]?.length === 3) numStyle = 'DataNum3';

      let formulaAttr = item.r1c1 ? ` ss:Formula="${item.r1c1}"` : '';
      let numVal = parseFloat(item.c) || 0;

      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
        <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.b)}</Data></Cell>
        <Cell ss:StyleID="${numStyle}"${formulaAttr}><Data ss:Type="Number">${numVal}</Data></Cell>
      </Row>\n`;
    }
  });

  xml += `    </Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${m.folderName} - FSI Area Statement.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  showNotification(`Excel file downloaded with live formulas: "${m.folderName} - FSI Area Statement.xls"`, 'success');
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString().replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

/**
 * INTERACTIVE NATIVE FOLDER-PICKER DIALOGUE BOX ENGINE
 * Visually navigates and designates default save destination across:
 * - Google Drive
 * - Synology Drive
 * - Local Computer Drive
 */
function openInteractiveFolderPicker(platform = 'gdrive') {
  pickerCurrentPlatform = platform;
  pickerCurrentPath = [];

  // Sync tab styles
  ['gdrive', 'synology', 'local'].forEach(p => {
    const tab = document.getElementById(`pickerTab${capitalize(p)}`);
    if (tab) {
      if (p === platform) {
        tab.className = 'px-3 py-1.5 rounded-lg font-semibold bg-sky-100 text-sky-800';
      } else {
        tab.className = 'px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100';
      }
    }
  });

  const nativeOsBtn = document.getElementById('btnNativeOsPicker');
  if (nativeOsBtn) {
    if (platform === 'local' && window.showDirectoryPicker) {
      nativeOsBtn.classList.remove('hidden');
      nativeOsBtn.classList.add('flex');
    } else {
      nativeOsBtn.classList.add('hidden');
      nativeOsBtn.classList.remove('flex');
    }
  }

  renderPickerDirectory();
  document.getElementById('folderPickerModal')?.classList.remove('hidden');
}

function switchPickerTarget(platform) {
  openInteractiveFolderPicker(platform);
}

function renderPickerDirectory() {
  const vfs = virtualFileSystems[pickerCurrentPlatform];
  let currentFolder = vfs;

  // Traverse path
  for (const step of pickerCurrentPath) {
    const next = currentFolder.children?.find(c => c.name === step);
    if (next) currentFolder = next;
  }

  // Render Breadcrumbs
  const breadcrumbsEl = document.getElementById('pickerBreadcrumbs');
  if (breadcrumbsEl) {
    let crumbs = [`<span class="folder-crumb-item" onclick="pickerNavigateTo(-1)">${vfs.root}</span>`];
    pickerCurrentPath.forEach((step, idx) => {
      crumbs.push(`<span class="text-slate-400">/</span>`);
      crumbs.push(`<span class="folder-crumb-item" onclick="pickerNavigateTo(${idx})">${step}</span>`);
    });
    breadcrumbsEl.innerHTML = crumbs.join('');
  }

  // Render Folder List
  const listEl = document.getElementById('pickerFolderList');
  if (listEl) {
    if (!currentFolder.children || currentFolder.children.length === 0) {
      listEl.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 italic">No subdirectories. Click "New Folder" to create one.</div>`;
    } else {
      listEl.innerHTML = currentFolder.children.map(child => `
        <div class="folder-tree-node flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 cursor-pointer" onclick="pickerNavigateDown('${escapeHtml(child.name)}')">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>
            <span class="text-xs font-medium text-slate-800">${child.name}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">${child.children ? child.children.length + ' items' : 'Folder'}</span>
        </div>
      `).join('');
    }
  }

  // Active display path
  const fullPathStr = getPickerCurrentFullPathString();
  const activeDisplay = document.getElementById('pickerActiveDisplay');
  if (activeDisplay) activeDisplay.textContent = fullPathStr;

  // Automated project folder preview: [Date] - [Client Name] - [Project Name]
  const dateVal = document.getElementById('inputDate')?.value || '2026-11-11';
  const clientVal = document.getElementById('inputClientName')?.value || 'RIGHT FOUNDATION';
  const projVal = document.getElementById('inputProjectName')?.value || 'SALISBURY PARK';
  const previewFolder = `${dateVal} - ${clientVal} - ${projVal}`;

  const projPreviewEl = document.getElementById('pickerPreviewProjectFolder');
  if (projPreviewEl) projPreviewEl.textContent = `${fullPathStr} / [${previewFolder}]`;
}

function pickerNavigateDown(folderName) {
  pickerCurrentPath.push(folderName);
  renderPickerDirectory();
}

function pickerNavigateUp() {
  if (pickerCurrentPath.length > 0) {
    pickerCurrentPath.pop();
    renderPickerDirectory();
  }
}

function pickerNavigateTo(index) {
  if (index === -1) {
    pickerCurrentPath = [];
  } else {
    pickerCurrentPath = pickerCurrentPath.slice(0, index + 1);
  }
  renderPickerDirectory();
}

function pickerCreateNewFolder() {
  const name = prompt('Enter new folder name:');
  if (!name || !name.trim()) return;

  const vfs = virtualFileSystems[pickerCurrentPlatform];
  let currentFolder = vfs;
  for (const step of pickerCurrentPath) {
    const next = currentFolder.children?.find(c => c.name === step);
    if (next) currentFolder = next;
  }

  if (!currentFolder.children) currentFolder.children = [];
  if (!currentFolder.children.some(c => c.name === name.trim())) {
    currentFolder.children.push({ name: name.trim(), children: [] });
    renderPickerDirectory();
    showNotification(`Created folder "${name.trim()}" in ${getPickerCurrentFullPathString()}`, 'success');
  }
}

async function pickNativeOsDirectory() {
  if (window.showDirectoryPicker) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const localPath = `C:\\${dirHandle.name}`;
      document.getElementById('settingLocalRoot').value = localPath;
      appConfig.localConfig.rootPath = localPath;
      saveConfig();
      closeFolderPicker();
      showNotification(`Selected local folder via Windows Explorer: "${dirHandle.name}"`, 'success');
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e);
      }
    }
  }
}

function getPickerCurrentFullPathString() {
  const vfs = virtualFileSystems[pickerCurrentPlatform];
  const sep = pickerCurrentPlatform === 'local' ? '\\' : '/';
  if (pickerCurrentPath.length === 0) return vfs.root;
  return `${vfs.root}${sep}${pickerCurrentPath.join(sep)}`;
}

function confirmFolderPickerSelection() {
  const chosenPath = getPickerCurrentFullPathString();

  if (pickerCurrentPlatform === 'gdrive') {
    appConfig.saveDestination = 'gdrive';
    appConfig.gdriveConfig.rootPath = chosenPath;
    document.getElementById('settingGdriveRoot').value = chosenPath;
  } else if (pickerCurrentPlatform === 'synology') {
    appConfig.saveDestination = 'synology';
    appConfig.synologyConfig.sharedFolder = chosenPath;
    document.getElementById('settingSynoShared').value = chosenPath;
  } else {
    appConfig.saveDestination = 'local';
    appConfig.localConfig.rootPath = chosenPath;
    document.getElementById('settingLocalRoot').value = chosenPath;
  }

  saveConfig();
  updateDestinationPill();
  closeFolderPicker();
  recalculateLive();
  showNotification(`Default save destination updated to: ${chosenPath}`, 'success');
}

function closeFolderPicker() {
  document.getElementById('folderPickerModal')?.classList.add('hidden');
}

function openInteractiveFolderPickerFromModal() {
  closeDestinationPromptModal();
  openInteractiveFolderPicker(appConfig.saveDestination);
}

// "Ask Every Time" Modal Handlers
function openDestinationPromptModal(formData) {
  const modal = document.getElementById('askDestinationModal');
  const targetFolderEl = document.getElementById('modalTargetFolder');
  const dateVal = formData.date || '2026-11-11';
  const folderName = `${dateVal} - ${formData.clientName.trim()} - ${formData.projectName.trim()}`;

  if (targetFolderEl) targetFolderEl.textContent = folderName;
  if (modal) modal.classList.remove('hidden');
}

function closeDestinationPromptModal() {
  document.getElementById('askDestinationModal')?.classList.add('hidden');
  pendingAction = null;
}

function confirmDestinationChoice() {
  const selectedRadio = document.querySelector('input[name="modalSaveChoice"]:checked');
  const choice = selectedRadio ? selectedRadio.value : appConfig.saveDestination;

  if (pendingAction) {
    const act = pendingAction.actionType;
    const data = pendingAction.formData;
    closeDestinationPromptModal();

    if (act === 'print_pdf') {
      executePrintToPDF();
    } else {
      executeFolderInitialization(data, choice);
    }
  }
}

/**
 * APPLICATION SECURITY ENGINE
 * Lock Settings menu behind master password 1760 with Change Password flow.
 */
function openSettingsWithPasswordPrompt() {
  const input = document.getElementById('authPasswordInput');
  const errorMsg = document.getElementById('authErrorMsg');
  if (input) input.value = '';
  if (errorMsg) errorMsg.classList.add('hidden');
  document.getElementById('authModal')?.classList.remove('hidden');
  setTimeout(() => input?.focus(), 100);
}

function verifyAdminPassword() {
  const input = document.getElementById('authPasswordInput');
  const entered = input ? input.value : '';

  if (entered === appConfig.adminPasswordHash) {
    closeAuthModal();
    openSettingsModal();
  } else {
    document.getElementById('authErrorMsg')?.classList.remove('hidden');
    input?.classList.add('animate-shake');
    setTimeout(() => input?.classList.remove('animate-shake'), 400);
  }
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.add('hidden');
}

function openSettingsModal() {
  renderSettingsUI();
  document.getElementById('settingsModal')?.classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settingsModal')?.classList.add('hidden');
}

function renderSettingsUI() {
  const radio = document.querySelector(`input[name="settingDestination"][value="${appConfig.saveDestination}"]`);
  if (radio) radio.checked = true;

  const askToggle = document.getElementById('settingAskEveryTime');
  if (askToggle) askToggle.checked = appConfig.askEveryTime;

  document.getElementById('settingGdriveRoot').value = appConfig.gdriveConfig.rootPath;
  document.getElementById('settingSynoApi').value = appConfig.synologyConfig.apiUrl;
  document.getElementById('settingSynoShared').value = appConfig.synologyConfig.sharedFolder;
  document.getElementById('settingSynoToken').value = appConfig.synologyConfig.apiToken;
  document.getElementById('settingLocalRoot').value = appConfig.localConfig.rootPath;

  document.getElementById('settingTplRegular').value = appConfig.templates.regular.url;
  document.getElementById('settingTplTod').value = appConfig.templates.tod.url;
  document.getElementById('settingTplCbd').value = appConfig.templates.cbd.url;

  updateDestinationTabs(appConfig.saveDestination);
}

function saveSettingsForm() {
  const destRadio = document.querySelector('input[name="settingDestination"]:checked');
  if (destRadio) appConfig.saveDestination = destRadio.value;

  appConfig.askEveryTime = document.getElementById('settingAskEveryTime')?.checked || false;
  appConfig.gdriveConfig.rootPath = document.getElementById('settingGdriveRoot')?.value.trim() || '';
  appConfig.synologyConfig.apiUrl = document.getElementById('settingSynoApi')?.value.trim() || '';
  appConfig.synologyConfig.sharedFolder = document.getElementById('settingSynoShared')?.value.trim() || '';
  appConfig.synologyConfig.apiToken = document.getElementById('settingSynoToken')?.value.trim() || '';
  appConfig.localConfig.rootPath = document.getElementById('settingLocalRoot')?.value.trim() || '';

  saveConfig();
  updateDestinationPill();
  closeSettingsModal();
  recalculateLive();
  showNotification('Settings saved successfully.', 'success');
}

// Password Reset Flow
function openChangePasswordDialog() {
  document.getElementById('pwdCurrent').value = '';
  document.getElementById('pwdNew').value = '';
  document.getElementById('pwdConfirm').value = '';
  document.getElementById('pwdErrorMsg')?.classList.add('hidden');
  document.getElementById('changePasswordModal')?.classList.remove('hidden');
}

function closeChangePasswordDialog() {
  document.getElementById('changePasswordModal')?.classList.add('hidden');
}

function submitNewPassword() {
  const currentPass = document.getElementById('pwdCurrent')?.value || '';
  const newPass = document.getElementById('pwdNew')?.value || '';
  const confirmPass = document.getElementById('pwdConfirm')?.value || '';
  const errorEl = document.getElementById('pwdErrorMsg');

  // Validate current password
  if (currentPass !== appConfig.adminPasswordHash) {
    if (errorEl) {
      errorEl.textContent = 'Current admin password does not match.';
      errorEl.classList.remove('hidden');
    }
    return;
  }
  if (!newPass || newPass.length < 4) {
    if (errorEl) {
      errorEl.textContent = 'New password must be at least 4 characters long.';
      errorEl.classList.remove('hidden');
    }
    return;
  }
  if (newPass !== confirmPass) {
    if (errorEl) {
      errorEl.textContent = 'New password and confirmation do not match.';
      errorEl.classList.remove('hidden');
    }
    return;
  }

  appConfig.adminPasswordHash = newPass;
  saveConfig();
  closeChangePasswordDialog();
  showNotification('Master admin password updated successfully! Please note your new credentials.', 'success');
}

function updateDestinationTabs(val) {
  document.getElementById('tabGdriveContent')?.classList.toggle('hidden', val !== 'gdrive');
  document.getElementById('tabSynologyContent')?.classList.toggle('hidden', val !== 'synology');
  document.getElementById('tabLocalContent')?.classList.toggle('hidden', val !== 'local');
}

function updateDestinationPill() {
  const pill = document.getElementById('navDestinationPill');
  if (!pill) return;
  const names = { 'gdrive': 'Google Drive', 'synology': 'Synology Drive', 'local': 'Local Drive' };
  const name = names[appConfig.saveDestination] || 'Google Drive';
  const askBadge = appConfig.askEveryTime ? ' • Ask Every Time' : '';
  const textEl = document.getElementById('navDestText');
  if (textEl) textEl.textContent = `${name}${askBadge}`;
}

function showNotification(msg, type = 'info') {
  const toast = document.getElementById('appNotificationToast');
  if (!toast) return;
  document.getElementById('toastMessageText').textContent = msg;
  toast.className = `fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 transition-all transform duration-300 ${
    type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
    type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
    'bg-slate-900 text-white border-slate-700'
  }`;
  toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 3800);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(s) {
  return s.replace(/'/g, "\\'");
}

/**
 * SETUP ALL EVENT LISTENERS WITH LIVE RECALCULATION
 */
function setupEventListeners() {
  // Action buttons
  document.getElementById('btnGeneratePreview')?.addEventListener('click', handleGenerateViewFullTable);
  document.getElementById('btnViewEditTable')?.addEventListener('click', handleViewEditFullTable);
  document.getElementById('btnExpandAttach')?.addEventListener('click', handleExpandAttachSheet);
  document.getElementById('btnExportExcel')?.addEventListener('click', exportToExcel);
  document.getElementById('btnPrintPDF')?.addEventListener('click', handlePrintToPDF);

  // Settings & Auth buttons
  document.getElementById('btnOpenSettings')?.addEventListener('click', openSettingsWithPasswordPrompt);
  document.getElementById('btnAuthSubmit')?.addEventListener('click', verifyAdminPassword);
  document.getElementById('btnAuthCancel')?.addEventListener('click', closeAuthModal);
  document.getElementById('authPasswordInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verifyAdminPassword();
  });

  document.getElementById('btnSaveSettings')?.addEventListener('click', saveSettingsForm);
  document.getElementById('btnCloseSettings')?.addEventListener('click', closeSettingsModal);
  document.getElementById('btnCancelSettings')?.addEventListener('click', closeSettingsModal);

  document.getElementById('btnOpenChangePwd')?.addEventListener('click', openChangePasswordDialog);
  document.getElementById('btnSubmitNewPwd')?.addEventListener('click', submitNewPassword);
  document.getElementById('btnCancelNewPwd')?.addEventListener('click', closeChangePasswordDialog);

  document.getElementById('btnConfirmDestination')?.addEventListener('click', confirmDestinationChoice);
  document.getElementById('btnCancelDestination')?.addEventListener('click', closeDestinationPromptModal);

  document.getElementById('btnConfirmFolderPicker')?.addEventListener('click', confirmFolderPickerSelection);
  document.getElementById('btnCancelFolderPicker')?.addEventListener('click', closeFolderPicker);
  document.getElementById('btnCloseFolderPicker')?.addEventListener('click', closeFolderPicker);

  document.getElementById('btnCloseGrid')?.addEventListener('click', closeGridModal);
  document.getElementById('btnCloseExpand')?.addEventListener('click', closeExpandModal);

  document.querySelectorAll('input[name="settingDestination"]').forEach(r => {
    r.addEventListener('change', (e) => updateDestinationTabs(e.target.value));
  });

  // LIVE EVENT LISTENERS: Instant recalculation on any input
  const liveInputIds = [
    'inputClientName',
    'inputProjectName',
    'inputDate',
    'inputPlot712',
    'inputPlotSite',
    'inputRoadWidening',
    'selectRoadWidth',
    'selectProjectType',
    'selectGreenFsi'
  ];

  liveInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', recalculateLive);
      el.addEventListener('change', recalculateLive);
    }
  });

  // Zone selection radio buttons
  document.querySelectorAll('input[name="zoneSelection"]').forEach(r => {
    r.addEventListener('change', (e) => {
      manualOverrides = {}; // Reset overrides on zone switch
      updateRoadWidthOptionsForZone(e.target.value);
      recalculateLive();
      showNotification(`Switched template to ${e.target.value.toUpperCase()} Zone. Backend template duplicated.`, 'info');
    });
  });
}
