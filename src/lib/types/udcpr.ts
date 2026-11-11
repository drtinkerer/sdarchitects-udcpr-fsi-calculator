export type ZoneType = 'regular' | 'tod' | 'cbd';
export type ProjectType = 'residential' | 'commercial' | 'mixed';
export type GreenFsiType = 'none' | 'green_griha_3' | 'green_griha_4' | 'green_griha_5';

export interface RoadWidthInfo {
  meters: number;
  tag: string;
  label: string;
  minCbd?: boolean;
}

export interface GreenFsiConfig {
  pct: number;
  title: string;
  label: string;
}

export interface ProjectFormData {
  date: string;
  clientName: string;
  projectName: string;
  plotArea712: number;
  plotAreaSite: number;
  roadWidening: number;
  dpReservationArea?: number;
  internalRoadArea?: number;
  saleableLoadingPct?: number;
  roadWidthCode: string;
  projectType: ProjectType;
  greenFsiType: GreenFsiType;
  zone: ZoneType;
}

export type RowOverrides = Record<number, number>;

export interface CalculationMetrics {
  grossNetPlotArea: number; // Row 13 in Regular / TOD / CBD
  netPermissibleFsiArea: number; // Net permissible FSI (Row 37 Regular, Row 38 TOD/CBD)
  totalWithAncillaryArea: number; // Row 41 Regular, Row 42 TOD/CBD
  totalSaleableSqM: number; // Row 51 Regular, Row 44 TOD/CBD
  totalSaleableSqFt: number; // Row 52 Regular, Row 45 TOD/CBD
  fsiRatio: number; // Effective FSI = Permissible FSI / Gross Plot
}

export interface CalculationResult {
  zone: ZoneType;
  c6: number;
  c7: number;
  c8: number;
  c10: number;
  c11: number;
  c12: number;
  c13: number;
  c15: number;
  c16: number;
  c18: number;
  c19: number;
  c20: number;
  c21: number;
  c22: number;
  c23: number;
  c25: number;
  c26: number;
  c27: number;
  c28: number;
  c29: number;
  c30: number;
  c31: number;
  c32: number;
  c33: number;
  c34?: number;
  c35?: number;
  c36: number;
  c37: number;
  c38?: number;
  c39?: number;
  c40?: number;
  c41?: number;
  c42?: number;
  c43?: number;
  c44?: number;
  c45?: number;
  c46?: number;
  c48?: number;
  c49?: number;
  c51?: number;
  c52?: number;
  tdrFactor?: number;
  todAddFactor?: number;
  cbdAddFactor?: number;
  cbdTdrFactor?: number;
  potentialFactor: number;
  ancillaryFactor: number;
  greenConfig: GreenFsiConfig;
  roadInfo: RoadWidthInfo;
  metrics: CalculationMetrics;
}

export interface TableRowItem {
  r: number;
  a: string;
  b: string;
  c: string;
  formula: string;
  r1c1?: string;
  isHeader?: boolean;
  spanAB?: boolean;
  spanABC?: boolean;
  isTableHead?: boolean;
  isSection?: boolean;
  isHighlight?: boolean;
  isGrandTotal?: boolean;
  isBlank?: boolean;
  isDisclaimer?: boolean;
  isOverridden?: boolean;
}

export interface AttachedSheet {
  id: string;
  title: string;
  category: 'zone' | 'auxiliary';
  attachedAt: string;
}

