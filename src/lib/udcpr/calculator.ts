import { ProjectFormData, RowOverrides, CalculationResult, ZoneType, CalculationMetrics } from '../types/udcpr';
import {
  ROAD_WIDTH_MAP,
  REGULAR_TDR_MAP,
  REGULAR_POTENTIAL_MAP,
  TOD_ADD_MAP,
  TOD_POTENTIAL_MAP,
  CBD_TDR_MAP,
  CBD_ADD_MAP,
  CBD_POTENTIAL_MAP,
  getGreenFsiConfig
} from './constants';

export function calculateRegularZone(formData: ProjectFormData, overrides: RowOverrides = {}): CalculationResult {
  const c6 = overrides[6] !== undefined ? overrides[6] : (Number(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? overrides[7] : (Number(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? overrides[8] : Math.min(c6, c7); // MIN(C6, C7)
  const c10 = overrides[10] !== undefined ? overrides[10] : (Number(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? overrides[11] : (Number(formData.dpReservationArea) || 0.0);
  const c12 = overrides[12] !== undefined ? overrides[12] : (c10 + c11);
  const c13 = overrides[13] !== undefined ? overrides[13] : Math.max(0, c8 - c12); // C8 - C12

  // Open Space & Amenity Space
  const c15 = overrides[15] !== undefined ? overrides[15] : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? overrides[16] : c15;
  const c18 = overrides[18] !== undefined ? overrides[18] : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? overrides[19] : c18;

  const c20 = overrides[20] !== undefined ? overrides[20] : 0.0;
  const c21 = overrides[21] !== undefined ? overrides[21] : (Number(formData.internalRoadArea) || 0.0);
  const c22 = overrides[22] !== undefined ? overrides[22] : Math.max(0, c13 - c19 - c21); // C13 - C19 - C21
  const c23 = overrides[23] !== undefined ? overrides[23] : (c22 * 1.10); // C22 * 1.1

  // Addition of area for FSI
  const c25 = overrides[25] !== undefined ? overrides[25] : (2.0 * c10); // 2 * C10
  const c26 = overrides[26] !== undefined ? overrides[26] : (2.0 * c19); // 2 * C19
  const c27 = overrides[27] !== undefined ? overrides[27] : (c8 * 0.50); // C8 * 0.5

  const roadInfo = ROAD_WIDTH_MAP[formData.roadWidthCode] || ROAD_WIDTH_MAP.w_24;
  const roadTag = roadInfo.tag;
  const tdrFactor = REGULAR_TDR_MAP[roadTag] !== undefined ? REGULAR_TDR_MAP[roadTag] : 0.90;
  const c28 = overrides[28] !== undefined ? overrides[28] : (c8 * tdrFactor);
  const c29 = overrides[29] !== undefined ? overrides[29] : (c28 * 0.30); // 30% Slum TDR
  const c30 = overrides[30] !== undefined ? overrides[30] : (c28 * 0.70); // 70% Regular TDR
  const c31 = overrides[31] !== undefined ? overrides[31] : (c30 - (c25 + c26)); // C30 - (C25 + C26)

  // Green FSI
  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c32 = overrides[32] !== undefined ? overrides[32] : (c23 * greenConfig.pct);
  const c33 = overrides[33] !== undefined ? overrides[33] : (c25 + c26 + c27 + c29 + c31 + c32);

  // Total Land FSI & Potential
  const c35 = overrides[35] !== undefined ? overrides[35] : (c23 + c33);
  const potentialFactor = REGULAR_POTENTIAL_MAP[roadTag] !== undefined ? REGULAR_POTENTIAL_MAP[roadTag] : 2.50;
  const c36 = overrides[36] !== undefined ? overrides[36] : (c8 * potentialFactor);
  const c37 = overrides[37] !== undefined ? overrides[37] : Math.min(c35, c36); // MIN(C35:C36)

  // Ancillary FSI
  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c39 = overrides[39] !== undefined ? overrides[39] : (c37 * ancillaryFactor);
  const c41 = overrides[41] !== undefined ? overrides[41] : (c37 + c39); // C37 + C39

  // MHADA (Row 43 in Regular)
  const c43 = overrides[43] !== undefined ? overrides[43] : (c23 > 3999.99 ? c23 * 0.20 : 0.0);

  // Saleable Calculations
  const loadingFactor = 1.0 + ((formData.saleableLoadingPct !== undefined ? formData.saleableLoadingPct : 15) / 100);
  const c45 = overrides[45] !== undefined ? overrides[45] : (c41 * loadingFactor);
  const c46 = overrides[46] !== undefined ? overrides[46] : (c45 * 10.764); // sq.ft
  const c48 = overrides[48] !== undefined ? overrides[48] : (c43 * 1.10); // C43 * 1.1
  const c49 = overrides[49] !== undefined ? overrides[49] : (c48 * 10.764);
  const c51 = overrides[51] !== undefined ? overrides[51] : (c45 + c48); // Grand Total Sq.M
  const c52 = overrides[52] !== undefined ? overrides[52] : (c51 * 10.764); // Grand Total Sq.Ft
  const metrics: CalculationMetrics = {
    grossNetPlotArea: c13,
    netPermissibleFsiArea: c37,
    totalWithAncillaryArea: c41,
    totalSaleableSqM: c51,
    totalSaleableSqFt: c52,
    fsiRatio: c8 > 0 ? (c37 / c8) : 0
  };

  return {
    zone: 'regular',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c35, c36, c37, c39, c41,
    c43, c45, c46, c48, c49, c51, c52,
    tdrFactor, potentialFactor, ancillaryFactor, greenConfig, roadInfo, metrics
  };
}

export function calculateTODZone(formData: ProjectFormData, overrides: RowOverrides = {}): CalculationResult {
  const c6 = overrides[6] !== undefined ? overrides[6] : (Number(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? overrides[7] : (Number(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? overrides[8] : Math.min(c6, c7);
  const c10 = overrides[10] !== undefined ? overrides[10] : (Number(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? overrides[11] : (Number(formData.dpReservationArea) || 0.0);
  const c12 = overrides[12] !== undefined ? overrides[12] : (c10 + c11);
  const c13 = overrides[13] !== undefined ? overrides[13] : Math.max(0, c8 - c12);

  const c15 = overrides[15] !== undefined ? overrides[15] : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? overrides[16] : c15;
  const c18 = overrides[18] !== undefined ? overrides[18] : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? overrides[19] : c18;

  const c20 = overrides[20] !== undefined ? overrides[20] : 0.0;
  const c21 = overrides[21] !== undefined ? overrides[21] : (Number(formData.internalRoadArea) || 0.0);
  const c22 = overrides[22] !== undefined ? overrides[22] : Math.max(0, c13 - c19 - c21);
  const c23 = overrides[23] !== undefined ? overrides[23] : (c22 * 1.10);

  // Row 25 (10.a): Additional Permissible FSI in TOD Zone
  const roadInfo = ROAD_WIDTH_MAP[formData.roadWidthCode] || ROAD_WIDTH_MAP.w_24;
  const roadTag = roadInfo.tag;
  const todAddFactor = TOD_ADD_MAP[roadTag] !== undefined ? TOD_ADD_MAP[roadTag] : 0;
  const c25 = overrides[25] !== undefined ? overrides[25] : (c8 * todAddFactor);

  const c26 = overrides[26] !== undefined ? overrides[26] : (2.0 * c10); // 10b
  const c27 = overrides[27] !== undefined ? overrides[27] : (2.0 * c19); // 10c

  // Row 28 (10.d): Premium FSI = 75% of 10a
  const c28 = overrides[28] !== undefined ? overrides[28] : (c25 * 0.75);

  // Row 29 (10.e): TDR Area = 25% of 10a
  const c29 = overrides[29] !== undefined ? overrides[29] : (c25 * 0.25);
  const c30 = overrides[30] !== undefined ? overrides[30] : (c29 * 0.30); // 30% x 10e
  const c31 = overrides[31] !== undefined ? overrides[31] : (c29 * 0.70); // 70% x 10e
  const c32 = overrides[32] !== undefined ? overrides[32] : (c31 - (c26 + c27)); // 10e2 - (10b + 10c)

  // Row 33 (10.f): Green FSI
  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c33 = overrides[33] !== undefined ? overrides[33] : (c23 * greenConfig.pct);

  // Row 34 (10.g): Total
  const c34 = overrides[34] !== undefined ? overrides[34] : (c26 + c27 + c28 + c30 + c32 + c33);

  // Row 36 (11.0): Total Land FSI Area
  const c36 = overrides[36] !== undefined ? overrides[36] : (c23 + c34);

  // Row 37 (12.0): Potential Area on Gross Area
  const potentialFactor = TOD_POTENTIAL_MAP[roadTag] !== undefined ? TOD_POTENTIAL_MAP[roadTag] : 2.50;
  const c37 = overrides[37] !== undefined ? overrides[37] : (c8 * potentialFactor);

  // Row 38 (13.0): In TOD template, C38 is =C36
  const c38 = overrides[38] !== undefined ? overrides[38] : c36;

  // Row 40 (14.0): Ancillary FSI
  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c40 = overrides[40] !== undefined ? overrides[40] : (c38 * ancillaryFactor);

  // Row 42 (15.0): Total Permissible FSI with Ancillary
  const c42 = overrides[42] !== undefined ? overrides[42] : (c38 + c40);

  // Row 44 (16.0): Approx Saleable
  const todLoadingFactor = 1.0 + ((formData.saleableLoadingPct !== undefined ? formData.saleableLoadingPct : 15) / 100);
  const c44 = overrides[44] !== undefined ? overrides[44] : (c42 * todLoadingFactor);
  const c45 = overrides[45] !== undefined ? overrides[45] : (c44 * 10.764);

  const metrics: CalculationMetrics = {
    grossNetPlotArea: c13,
    netPermissibleFsiArea: c38,
    totalWithAncillaryArea: c42,
    totalSaleableSqM: c44,
    totalSaleableSqFt: c45,
    fsiRatio: c8 > 0 ? (c38 / c8) : 0
  };

  return {
    zone: 'tod',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c34, c36, c37, c38, c40, c42, c44, c45,
    todAddFactor, potentialFactor, ancillaryFactor, greenConfig, roadInfo, metrics
  };
}

export function calculateCBDZone(formData: ProjectFormData, overrides: RowOverrides = {}): CalculationResult {
  const c6 = overrides[6] !== undefined ? overrides[6] : (Number(formData.plotArea712) || 0);
  const c7 = overrides[7] !== undefined ? overrides[7] : (Number(formData.plotAreaSite) || 0);
  const c8 = overrides[8] !== undefined ? overrides[8] : Math.min(c6, c7);
  const c10 = overrides[10] !== undefined ? overrides[10] : (Number(formData.roadWidening) || 0);
  const c11 = overrides[11] !== undefined ? overrides[11] : (Number(formData.dpReservationArea) || 0.0);
  const c12 = overrides[12] !== undefined ? overrides[12] : (c10 + c11);
  const c13 = overrides[13] !== undefined ? overrides[13] : Math.max(0, c8 - c12);

  const c15 = overrides[15] !== undefined ? overrides[15] : (c13 > 3999.99 ? c13 * 0.10 : 0.0);
  const c16 = overrides[16] !== undefined ? overrides[16] : c15;
  const c18 = overrides[18] !== undefined ? overrides[18] : (c13 > 19999.99 ? c13 * 0.05 : 0.0);
  const c19 = overrides[19] !== undefined ? overrides[19] : c18;

  const c20 = overrides[20] !== undefined ? overrides[20] : 0.0;
  const c21 = overrides[21] !== undefined ? overrides[21] : (Number(formData.internalRoadArea) || 0.0);
  const c22 = overrides[22] !== undefined ? overrides[22] : Math.max(0, c13 - c19 - c21);
  const c23 = overrides[23] !== undefined ? overrides[23] : (c22 * 1.10);

  const c25 = overrides[25] !== undefined ? overrides[25] : (2.0 * c10); // 10a
  const c26 = overrides[26] !== undefined ? overrides[26] : (2.0 * c19); // 10b
  const c27 = overrides[27] !== undefined ? overrides[27] : (c8 * 0.50); // 10c

  const roadInfo = ROAD_WIDTH_MAP[formData.roadWidthCode] || ROAD_WIDTH_MAP.w_24;
  const roadTag = roadInfo.tag;
  const cbdTdrFactor = CBD_TDR_MAP[roadTag] !== undefined ? CBD_TDR_MAP[roadTag] : 0.90;
  const c28 = overrides[28] !== undefined ? overrides[28] : (c8 * cbdTdrFactor);
  const c29 = overrides[29] !== undefined ? overrides[29] : (c28 * 0.30);
  const c30 = overrides[30] !== undefined ? overrides[30] : (c28 * 0.70);
  const c31 = overrides[31] !== undefined ? overrides[31] : (c30 - (c25 + c26));

  const greenConfig = getGreenFsiConfig(formData.greenFsiType);
  const c32 = overrides[32] !== undefined ? overrides[32] : (c23 * greenConfig.pct);

  const cbdAddFactor = CBD_ADD_MAP[roadTag] !== undefined ? CBD_ADD_MAP[roadTag] : 0;
  const c33 = overrides[33] !== undefined ? overrides[33] : (c8 * cbdAddFactor);

  const c34 = overrides[34] !== undefined ? overrides[34] : (c25 + c26 + c27 + c29 + c31 + c32 + c33);

  const c36 = overrides[36] !== undefined ? overrides[36] : (c23 + c34);

  const potentialFactor = CBD_POTENTIAL_MAP[roadTag] !== undefined ? CBD_POTENTIAL_MAP[roadTag] : 2.50;
  const c37 = overrides[37] !== undefined ? overrides[37] : (c8 * potentialFactor);

  const c38 = overrides[38] !== undefined ? overrides[38] : Math.min(c36, c37);

  const isCommercial = formData.projectType === 'commercial';
  const ancillaryFactor = isCommercial ? 0.80 : 0.60;
  const c40 = overrides[40] !== undefined ? overrides[40] : (c38 * ancillaryFactor);

  const c42 = overrides[42] !== undefined ? overrides[42] : (c38 + c40);
  const cbdLoadingFactor = 1.0 + ((formData.saleableLoadingPct !== undefined ? formData.saleableLoadingPct : 15) / 100);
  const c44 = overrides[44] !== undefined ? overrides[44] : (c42 * cbdLoadingFactor);
  const c45 = overrides[45] !== undefined ? overrides[45] : (c44 * 10.764);
  const metrics: CalculationMetrics = {
    grossNetPlotArea: c13,
    netPermissibleFsiArea: c38,
    totalWithAncillaryArea: c42,
    totalSaleableSqM: c44,
    totalSaleableSqFt: c45,
    fsiRatio: c8 > 0 ? (c38 / c8) : 0
  };

  return {
    zone: 'cbd',
    c6, c7, c8, c10, c11, c12, c13, c15, c16, c18, c19, c20, c21, c22, c23,
    c25, c26, c27, c28, c29, c30, c31, c32, c33, c34, c36, c37, c38, c40, c42, c44, c45,
    cbdTdrFactor, cbdAddFactor, potentialFactor, ancillaryFactor, greenConfig, roadInfo, metrics
  };
}

export function calculateZone(formData: ProjectFormData, overrides: RowOverrides = {}): CalculationResult {
  switch (formData.zone) {
    case 'tod':
      return calculateTODZone(formData, overrides);
    case 'cbd':
      return calculateCBDZone(formData, overrides);
    default:
      return calculateRegularZone(formData, overrides);
  }
}
