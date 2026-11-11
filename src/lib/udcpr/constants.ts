import { RoadWidthInfo, GreenFsiConfig, ProjectFormData } from '../types/udcpr';

export const MASTER_TEMPLATES = {
  regular: {
    name: 'Regular Zone Master Template (UDCPR Table 6-A)',
    id: '1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U',
    url: 'https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/edit?usp=sharing',
    totalRows: 53,
    description: 'Standard residential & commercial development across Maharashtra. Includes Slum TDR (30%) & Regular TDR (70%).'
  },
  tod: {
    name: 'TOD Zone Master Template (UDCPR Chapter 13)',
    id: '1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU',
    url: 'https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/edit?usp=sharing',
    totalRows: 46,
    description: 'Transit Oriented Development within 500m of Metro/BRTS corridor. Additional Permissible FSI up to 2.90x.'
  },
  cbd: {
    name: 'CBD Zone Master Template (Commercial Core District)',
    id: '1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ',
    url: 'https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/edit?usp=sharing',
    totalRows: 46,
    description: 'Central Business District. Minimum 12m road width statutory requirement with potential up to 5.00x gross area.'
  }
};

export const ROAD_WIDTH_MAP: Record<string, RoadWidthInfo> = {
  w_6: { meters: 6.0, tag: '6m', label: '6.00 m (Basic FSI only = 1.10 | TDR = 0.00)', minCbd: false },
  w_7_5: { meters: 7.5, tag: '7.5m', label: '7.50 m (Basic FSI only = 1.10 | TDR = 0.00)', minCbd: false },
  w_9: { meters: 9.0, tag: '9m', label: '9.00 m (TDR = 0.40 | Potential = 2.00)', minCbd: false },
  w_12: { meters: 12.0, tag: '12m', label: '12.00 m (TDR = 0.65 | Potential = 2.25)', minCbd: true },
  w_15: { meters: 15.0, tag: '15m', label: '15.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
  w_18: { meters: 18.0, tag: '18m', label: '18.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
  w_21: { meters: 21.0, tag: '21m', label: '21.00 m (TDR = 0.90 | Potential = 2.50)', minCbd: true },
  w_24: { meters: 24.0, tag: '24m', label: '24.00 m (TDR = 1.15 | Potential = 2.75)', minCbd: true },
  w_27: { meters: 27.0, tag: '27m', label: '27.00 m (TDR = 1.15 | Potential = 2.75)', minCbd: true },
  w_30: { meters: 30.0, tag: '30m', label: '30.00 m (TDR = 1.40 | Potential = 3.00)', minCbd: true },
  w_above_30: { meters: 36.0, tag: 'Above 30m', label: 'Above 30.00 m (TDR = 1.40 | Potential = 3.00)', minCbd: true }
};

export const REGULAR_TDR_MAP: Record<string, number> = {
  '6m': 0, '7.5m': 0, '9m': 0.40, '12m': 0.65, '15m': 0.90, '18m': 0.90, '21m': 0.90,
  '24m': 1.15, '27m': 1.15, '30m': 1.40, 'Above 30m': 1.40
};

export const REGULAR_POTENTIAL_MAP: Record<string, number> = {
  '6m': 1.10, '7.5m': 1.10, '9m': 2.00, '12m': 2.25, '15m': 2.50, '18m': 2.50, '21m': 2.50,
  '24m': 2.75, '27m': 2.75, '30m': 3.00, 'Above 30m': 3.00
};

export const TOD_ADD_MAP: Record<string, number> = {
  '6m': 0, '7.5m': 0, '9m': 1.40, '12m': 1.90, '15m': 2.40, '18m': 2.40, '21m': 2.40,
  '24m': 2.90, '27m': 2.90, '30m': 2.90, 'Above 30m': 2.90
};

export const TOD_POTENTIAL_MAP: Record<string, number> = {
  '6m': 1.10, '7.5m': 1.10, '9m': 2.50, '12m': 3.00, '15m': 3.50, '18m': 3.50, '21m': 3.50,
  '24m': 4.00, '27m': 4.00, '30m': 4.00, 'Above 30m': 4.00
};

export const CBD_TDR_MAP: Record<string, number> = {
  '12m': 0.65, '15m': 0.90, '18m': 0.90, '21m': 0.90, '24m': 1.15, '27m': 1.15,
  '30m': 1.40, 'Above 30m': 1.40
};

export const CBD_ADD_MAP: Record<string, number> = {
  '12m': 0.75, '15m': 0.50, '18m': 1.50, '21m': 1.50, '24m': 1.25, '27m': 2.25,
  '30m': 2.00, 'Above 30m': 2.00
};

export const CBD_POTENTIAL_MAP: Record<string, number> = {
  '12m': 3.00, '15m': 3.00, '18m': 4.00, '21m': 4.00, '24m': 4.00, '27m': 5.00,
  '30m': 5.00, 'Above 30m': 5.00
};

export function getGreenFsiConfig(code: string): GreenFsiConfig {
  switch (code) {
    case 'green_griha_3':
      return { pct: 0.03, title: 'ADDITIONAL SILVER-RATED GREEN F.S.I. AREA [3% OF SR. NO. 9]', label: 'SILVER-RATED (+3%)' };
    case 'green_griha_4':
      return { pct: 0.05, title: 'ADDITIONAL GOLD-RATED GREEN F.S.I. AREA [5% OF SR. NO. 9]', label: 'GOLD-RATED (+5%)' };
    case 'green_griha_5':
      return { pct: 0.07, title: 'ADDITIONAL PLATINUM-RATED GREEN F.S.I. AREA [7% OF SR. NO. 9]', label: 'PLATINUM-RATED (+7%)' };
    default:
      return { pct: 0.00, title: 'NO GREEN F.S.I. AREA [0% OF SR. NO. 9]', label: 'NO GREEN (0%)' };
  }
}

export const DEFAULT_FORM_DATA: ProjectFormData = {
  date: '2026-11-11',
  clientName: 'RIGHT FOUNDATION',
  projectName: 'SALISBURY PARK',
  plotArea712: 2071.27,
  plotAreaSite: 2071.27,
  roadWidening: 171.10,
  dpReservationArea: 0,
  internalRoadArea: 0,
  saleableLoadingPct: 15,
  roadWidthCode: 'w_24',
  projectType: 'residential',
  greenFsiType: 'green_griha_4',
  zone: 'regular'
};

