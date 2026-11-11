import { ProjectFormData, CalculationResult, TableRowItem, RowOverrides } from '../types/udcpr';

export function formatDateDisplay(isoDateString?: string): string {
  if (!isoDateString) return '11.11.2026';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return isoDateString;
}

export function getProjectTypeDisplay(code: string): string {
  switch (code) {
    case 'commercial': return 'Commercial';
    case 'mixed':
    case 'mix_use': return 'Mix Use';
    default: return 'Residential';
  }
}

export function generateRegularRows(formData: ProjectFormData, calc: CalculationResult, overrides: RowOverrides = {}): TableRowItem[] {
  const roadTag = calc.roadInfo.tag;
  const roadWidthVal = calc.roadInfo.meters;
  const dateDisplay = formatDateDisplay(formData.date);
  const projTypeDisplay = getProjectTypeDisplay(formData.projectType);
  const tdrFactor = calc.tdrFactor ?? 0.90;
  const potentialFactor = calc.potentialFactor;
  const ancillaryFactor = calc.ancillaryFactor;

  const rows: TableRowItem[] = [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${formData.clientName.toUpperCase()}`, b: '', c: projTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${formData.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: calc.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: calc.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: calc.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: calc.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: calc.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: calc.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: calc.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: calc.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: calc.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: calc.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: calc.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: calc.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: calc.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: calc.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: calc.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: calc.c25.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: calc.c26.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 27, a: 'c]', b: 'PREMIUM F.S.I. AREA [SUBJECT TO MAXIMUM OF 0.5 OF SR. NO. 1c]', c: calc.c27.toFixed(3), formula: '=C8*0.5', r1c1: '=R8C3*0.5' },
    { r: 28, a: 'd]', b: `T.D.R. AREA ON GROSS AREA OF THE PLOT [SUBJECT TO MAXIMUM OF ${tdrFactor.toFixed(2)} OF SR. NO. 1c]`, c: calc.c28.toFixed(3), formula: `=C8*${tdrFactor.toFixed(2)}`, r1c1: `=R8C3*${tdrFactor.toFixed(2)}` },
    { r: 29, a: 'd1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10d]', c: calc.c29.toFixed(3), formula: '=C28*0.3', r1c1: '=R28C3*0.3' },
    { r: 30, a: 'd2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10d OR SR. NO. 10d - 10d1]', c: calc.c30.toFixed(3), formula: '=C28*0.7', r1c1: '=R28C3*0.7' },
    { r: 31, a: 'd3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10d2 - (10a + 10b)]', c: calc.c31.toFixed(3), formula: '=C30-(C25+C26)', r1c1: '=R30C3-(R25C3+R26C3)' },
    { r: 32, a: 'e]', b: calc.greenConfig.title, c: calc.c32.toFixed(3), formula: `=C23*${calc.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${calc.greenConfig.pct.toFixed(2)}` },
    { r: 33, a: 'f]', b: 'TOTAL [SR. NO. 10a + 10b + 10c + 10d1 + 10d3 + 10e]', c: calc.c33.toFixed(3), formula: '=C25+C26+C27+C29+C31+C32', r1c1: '=R25C3+R26C3+R27C3+R29C3+R31C3+R32C3', isHighlight: true },
    { r: 34, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 35, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10f]', c: (calc.c35 ?? 0).toFixed(3), formula: '=C23+C33', r1c1: '=R23C3+R33C3', isHighlight: true },
    { r: 36, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${potentialFactor.toFixed(2)}]`, c: calc.c36.toFixed(3), formula: `=C8*${potentialFactor.toFixed(2)}`, r1c1: `=R8C3*${potentialFactor.toFixed(2)}` },
    { r: 37, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE [MINIMUM OF SR. NO. 11 OR SR. NO. 12]', c: calc.c37.toFixed(3), formula: '=MIN(C35:C36)', r1c1: '=MIN(R35C3:R36C3)', isHighlight: true },
    { r: 38, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 39, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${ancillaryFactor.toFixed(2)}]`, c: (calc.c39 ?? 0).toFixed(3), formula: `=IF(C2="Commercial", C37*0.8, C37*0.6)`, r1c1: `=IF(R2C3="Commercial",R37C3*0.8,R37C3*0.6)` },
    { r: 40, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 41, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: (calc.c41 ?? 0).toFixed(3), formula: '=C37+C39', r1c1: '=R37C3+R39C3', isHighlight: true },
    { r: 42, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 43, a: '16.0', b: 'MHADA [20% OF SR. NO. 9] [APPLICABLE ONLY IF NET PLOT AREA IS > 4,000 SQ.M]', c: (calc.c43 ?? 0).toFixed(3), formula: '=IF(C23>3999.99,C23*20%,0)', r1c1: '=IF(R23C3>3999.99,R23C3*0.2,0)' },
    { r: 44, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 45, a: '17.0', b: 'APPROX. SALEABLE IN SQ.M.', c: (calc.c45 ?? 0).toFixed(3), formula: '=C41*1.15', r1c1: '=R41C3*1.15' },
    { r: 46, a: '', b: 'APPROX. SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: (calc.c46 ?? 0).toFixed(2), formula: '=C45*10.764', r1c1: '=R45C3*10.764', isHighlight: true },
    { r: 47, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 48, a: '18.0', b: 'APPROX. MHADA SALEABLE [ADD 10% LOADING ON SR. NO. 16] IN SQ.M.', c: (calc.c48 ?? 0).toFixed(3), formula: '=C43*1.1', r1c1: '=R43C3*1.1' },
    { r: 49, a: '', b: 'APPROX. MHADA SALEABLE [ADD 10% LOADING ON SR. NO. 16] IN SQ.FT.', c: (calc.c49 ?? 0).toFixed(2), formula: '=C48*10.764', r1c1: '=R48C3*10.764' },
    { r: 50, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 51, a: '19.0', b: 'TOTAL PERMISSIBLE SALEABLE [SR. NO. 17 + SR. NO. 18] IN SQ.M.', c: (calc.c51 ?? 0).toFixed(3), formula: '=C45+C48', r1c1: '=R45C3+R48C3', isGrandTotal: true },
    { r: 52, a: '', b: 'TOTAL PERMISSIBLE SALEABLE [SR. NO. 17 + SR. NO. 18] IN SQ.FT.', c: (calc.c52 ?? 0).toFixed(2), formula: '=C51*10.764', r1c1: '=R51C3*10.764', isGrandTotal: true },
    { r: 53, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];

  return rows.map(r => ({ ...r, isOverridden: overrides[r.r] !== undefined }));
}

export function generateTODRows(formData: ProjectFormData, calc: CalculationResult, overrides: RowOverrides = {}): TableRowItem[] {
  const roadTag = calc.roadInfo.tag;
  const roadWidthVal = calc.roadInfo.meters;
  const dateDisplay = formatDateDisplay(formData.date);
  const projTypeDisplay = getProjectTypeDisplay(formData.projectType);
  const todAddFactor = calc.todAddFactor ?? 0;
  const potentialFactor = calc.potentialFactor;
  const ancillaryFactor = calc.ancillaryFactor;

  const rows: TableRowItem[] = [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${formData.clientName.toUpperCase()}`, b: '', c: projTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${formData.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'TOD POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: calc.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: calc.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: calc.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: calc.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: calc.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: calc.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: calc.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: calc.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: calc.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: calc.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: calc.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: calc.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: calc.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: calc.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: calc.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: `ADDITIONAL PERMISSIBLE FSI IN TOD ZONE [SUBJECT TO MAXIMUM OF ${todAddFactor.toFixed(1)} OF SR. NO. 1c]`, c: calc.c25.toFixed(3), formula: `=C8*${todAddFactor.toFixed(1)}`, r1c1: `=R8C3*${todAddFactor.toFixed(1)}` },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: calc.c26.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 27, a: 'c]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: calc.c27.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 28, a: 'd]', b: 'PREMIUM F.S.I. AREA [75% OF SR. NO. 10a]', c: calc.c28.toFixed(3), formula: '=C25*0.75', r1c1: '=R25C3*0.75' },
    { r: 29, a: 'e]', b: 'T.D.R. AREA ON GROSS AREA OF THE PLOT [25% OF 10a]', c: calc.c29.toFixed(3), formula: '=C25*0.25', r1c1: '=R25C3*0.25' },
    { r: 30, a: 'e1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10e]', c: calc.c30.toFixed(3), formula: '=C29*0.3', r1c1: '=R29C3*0.3' },
    { r: 31, a: 'e2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10e OR SR. NO. 10e - 10e1]', c: calc.c31.toFixed(3), formula: '=C29*0.7', r1c1: '=R29C3*0.7' },
    { r: 32, a: 'e3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10e2 - (10b + 10c)]', c: calc.c32.toFixed(3), formula: '=C31-(C26+C27)', r1c1: '=R31C3-(R26C3+R27C3)' },
    { r: 33, a: 'f]', b: calc.greenConfig.title, c: calc.c33.toFixed(3), formula: `=C23*${calc.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${calc.greenConfig.pct.toFixed(2)}` },
    { r: 34, a: 'g]', b: 'TOTAL [SR. NO. 10b + 10c + 10d + 10e1 + 10e3 + 10f]', c: (calc.c34 ?? 0).toFixed(3), formula: '=C26+C27+C28+C30+C32+C33', r1c1: '=R26C3+R27C3+R28C3+R30C3+R32C3+R33C3', isHighlight: true },
    { r: 35, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 36, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10g]', c: calc.c36.toFixed(3), formula: '=C23+C34', r1c1: '=R23C3+R34C3', isHighlight: true },
    { r: 37, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${potentialFactor.toFixed(2)}]`, c: calc.c37.toFixed(3), formula: `=C8*${potentialFactor.toFixed(2)}`, r1c1: `=R8C3*${potentialFactor.toFixed(2)}` },
    { r: 38, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE', c: (calc.c38 ?? 0).toFixed(3), formula: '=C36', r1c1: '=R36C3', isHighlight: true },
    { r: 39, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 40, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${ancillaryFactor.toFixed(2)}]`, c: (calc.c40 ?? 0).toFixed(3), formula: `=IF(C2="Commercial", C38*0.8, C38*0.6)`, r1c1: `=IF(R2C3="Commercial",R38C3*0.8,R38C3*0.6)` },
    { r: 41, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 42, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: (calc.c42 ?? 0).toFixed(3), formula: '=C38+C40', r1c1: '=R38C3+R40C3', isHighlight: true },
    { r: 43, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 44, a: '16.0', b: 'TOTAL PERMISSIBLE SALEABLE IN SQ.M.', c: (calc.c44 ?? 0).toFixed(3), formula: '=C42*1.15', r1c1: '=R42C3*1.15', isGrandTotal: true },
    { r: 45, a: '', b: 'TOTAL PERMISSIBLE SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: (calc.c45 ?? 0).toFixed(2), formula: '=C44*10.764', r1c1: '=R44C3*10.764', isGrandTotal: true },
    { r: 46, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];

  return rows.map(r => ({ ...r, isOverridden: overrides[r.r] !== undefined }));
}

export function generateCBDRows(formData: ProjectFormData, calc: CalculationResult, overrides: RowOverrides = {}): TableRowItem[] {
  const roadTag = calc.roadInfo.tag;
  const roadWidthVal = calc.roadInfo.meters;
  const dateDisplay = formatDateDisplay(formData.date);
  const projTypeDisplay = getProjectTypeDisplay(formData.projectType);
  const cbdTdrFactor = calc.cbdTdrFactor ?? 0.90;
  const cbdAddFactor = calc.cbdAddFactor ?? 0;
  const potentialFactor = calc.potentialFactor;
  const ancillaryFactor = calc.ancillaryFactor;

  const rows: TableRowItem[] = [
    { r: 1, a: 'FSI AREA STATEMENT', b: '', c: dateDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 2, a: `CLIENT: ${formData.clientName.toUpperCase()}`, b: '', c: projTypeDisplay, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 3, a: `PLOT LOCATION / PROJECT NAME: ${formData.projectName.toUpperCase()}`, b: '', c: `ROAD WIDTH - ${roadTag}`, isHeader: true, spanAB: true, formula: 'Header' },
    { r: 4, a: 'SR NO', b: 'DESCRIPTION', c: 'CBD POTENTIAL', isTableHead: true, formula: 'EXCEL FORMULA' },
    { r: 5, a: '1.0', b: 'AREA OF GROSS PLOT', c: 'PLOT', isSection: true, formula: '' },
    { r: 6, a: 'a]', b: 'AS PER 7/12 EXTRACT, CTS, DOCUMENT', c: calc.c6.toFixed(2), formula: 'INPUT (C6)', r1c1: '' },
    { r: 7, a: 'b]', b: 'AS PER SUBDIVISION / SITE / MEASUREMENT SHEET / COMPUTER GENERATED', c: calc.c7.toFixed(2), formula: 'INPUT (C7)', r1c1: '' },
    { r: 8, a: 'c]', b: 'MINIMUM GROSS PLOT AREA OF [SR. NO. 1a, 1b] TO BE CONSIDERED', c: calc.c8.toFixed(2), formula: '=MIN(C6,C7)', r1c1: '=MIN(R6C3,R7C3)', isHighlight: true },
    { r: 9, a: '2.0', b: 'DEDUCTION FOR GROSS NET PLOT', c: '', isSection: true, formula: '' },
    { r: 10, a: 'a]', b: `AREA UNDER PROPOSED D.P. ROAD WIDENING (${roadWidthVal.toFixed(2)} M WIDE)`, c: calc.c10.toFixed(2), formula: 'INPUT (C10)', r1c1: '' },
    { r: 11, a: 'b]', b: 'ANY D.P. RESERVATION AREA (GREEN BELT)', c: calc.c11.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 12, a: 'c]', b: 'TOTAL [SR. NO. 2a + 2b]', c: calc.c12.toFixed(2), formula: '=C10+C11', r1c1: '=R10C3+R11C3', isHighlight: true },
    { r: 13, a: '3.0', b: 'GROSS NET PLOT AREA [SR. NO. 1c - SR. NO. 2c]', c: calc.c13.toFixed(2), formula: '=C8-C12', r1c1: '=R8C3-R12C3', isHighlight: true },
    { r: 14, a: '4.0', b: 'OPEN SPACE', c: '', isSection: true, formula: '' },
    { r: 15, a: 'a]', b: 'REQUIRED OPEN SPACE [10% OF SR. NO. 3]', c: calc.c15.toFixed(2), formula: '=IF(C13>3999.99,C13*10%,0)', r1c1: '=IF(R13C3>3999.99,R13C3*0.1,0)' },
    { r: 16, a: 'b]', b: 'PROPOSED OPEN SPACE [SR. NO. 4a]', c: calc.c16.toFixed(2), formula: '=C15', r1c1: '=R15C3' },
    { r: 17, a: '5.0', b: 'AMENITY SPACE', c: '', isSection: true, formula: '' },
    { r: 18, a: 'a]', b: 'REQUIRED AMENITY SPACE [5% OF SR. NO. 3]', c: calc.c18.toFixed(2), formula: '=IF(C13>19999.99,C13*5%,0)', r1c1: '=IF(R13C3>19999.99,R13C3*0.05,0)' },
    { r: 19, a: 'b]', b: 'PROPOSED AMENITY SPACE [SR. NO. 5a]', c: calc.c19.toFixed(2), formula: '=C18', r1c1: '=R18C3' },
    { r: 20, a: '6.0', b: 'SERVICE ROAD AND HIGHWAY WIDENING', c: calc.c20.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 21, a: '7.0', b: 'INTERNAL ROAD AREA', c: calc.c21.toFixed(2), formula: '0.00', r1c1: '' },
    { r: 22, a: '8.0', b: 'NET AREA OF THE PLOT [SR. NO. 3 - SR. NO. 5b]', c: calc.c22.toFixed(2), formula: '=C13-C19', r1c1: '=R13C3-R19C3', isHighlight: true },
    { r: 23, a: '9.0', b: 'BUILT UP AREA WITH REFERENCE TO BASIC F.S.I. AS PER FRONT ROAD WIDTH [SR. NO. 8 x 1.1]', c: calc.c23.toFixed(3), formula: '=C22*1.1', r1c1: '=R22C3*1.1', isHighlight: true },
    { r: 24, a: '10.0', b: 'ADDITION OF AREA FOR F.S.I.', c: '', isSection: true, formula: '' },
    { r: 25, a: 'a]', b: 'IN SITU AREA AGAINST D.P. ROAD [2.00 x SR. NO. 2a] - PART OF TDR', c: calc.c25.toFixed(2), formula: '=2*C10', r1c1: '=2*R10C3' },
    { r: 26, a: 'b]', b: 'IN SITU AREA AGAINST AMENITY SPACE [2.00 x SR. NO. 5b] - PART OF TDR', c: calc.c26.toFixed(2), formula: '=C19*2', r1c1: '=R19C3*2' },
    { r: 27, a: 'c]', b: 'PREMIUM F.S.I. AREA [SUBJECT TO MAXIMUM OF 0.5 OF SR. NO. 1c]', c: calc.c27.toFixed(3), formula: '=C8*0.5', r1c1: '=R8C3*0.5' },
    { r: 28, a: 'd]', b: `T.D.R. AREA ON GROSS AREA OF THE PLOT [SUBJECT TO MAXIMUM OF ${cbdTdrFactor.toFixed(2)} OF SR. NO. 1c]`, c: calc.c28.toFixed(3), formula: `=C8*${cbdTdrFactor.toFixed(2)}`, r1c1: `=R8C3*${cbdTdrFactor.toFixed(2)}` },
    { r: 29, a: 'd1]', b: 'REQUIRED & PERMISSIBLE SLUM T.D.R. AREA [30% x SR. NO. 10d]', c: calc.c29.toFixed(3), formula: '=C28*0.3', r1c1: '=R28C3*0.3' },
    { r: 30, a: 'd2]', b: 'PERMISSIBLE REGULAR T.D.R. AREA [70% x SR. NO. 10d OR SR. NO. 10d - 10d1]', c: calc.c30.toFixed(3), formula: '=C28*0.7', r1c1: '=R28C3*0.7' },
    { r: 31, a: 'd3]', b: 'REQUIRED REGULAR T.D.R. AREA [SR. NO. 10d2 - (10a + 10b)]', c: calc.c31.toFixed(3), formula: '=C30-(C25+C26)', r1c1: '=R30C3-(R25C3+R26C3)' },
    { r: 32, a: 'e]', b: calc.greenConfig.title, c: calc.c32.toFixed(3), formula: `=C23*${calc.greenConfig.pct.toFixed(2)}`, r1c1: `=R23C3*${calc.greenConfig.pct.toFixed(2)}` },
    { r: 33, a: 'f]', b: `ADDITIONAL PERMISSIBLE FSI IN CBD ZONE [SUBJECT TO MAXIMUM OF ${cbdAddFactor.toFixed(2)} OF SR. NO. 1c]`, c: calc.c33.toFixed(3), formula: `=C8*${cbdAddFactor.toFixed(2)}`, r1c1: `=R8C3*${cbdAddFactor.toFixed(2)}` },
    { r: 34, a: 'g]', b: 'TOTAL [SR. NO. 10a + 10b + 10c + 10d1 + 10d3 + 10e + 10f]', c: (calc.c34 ?? 0).toFixed(3), formula: '=C25+C26+C27+C29+C31+C32+C33', r1c1: '=R25C3+R26C3+R27C3+R29C3+R31C3+R32C3+R33C3', isHighlight: true },
    { r: 35, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 36, a: '11.0', b: 'TOTAL LAND FSI AREA AVAILABLE [SR. NO. 9 + SR. NO. 10g]', c: calc.c36.toFixed(3), formula: '=C23+C34', r1c1: '=R23C3+R34C3', isHighlight: true },
    { r: 37, a: '12.0', b: `PERMISSIBLE POTENTIAL AREA AVAILABLE ON GROSS AREA OF THE PLOT [SR. NO. 1c x ${potentialFactor.toFixed(2)}]`, c: calc.c37.toFixed(3), formula: `=C8*${potentialFactor.toFixed(2)}`, r1c1: `=R8C3*${potentialFactor.toFixed(2)}` },
    { r: 38, a: '13.0', b: 'NET PERMISSIBLE FSI AREA AVAILABLE [MINIMUM OF SR. NO. 11 OR SR. NO. 12]', c: (calc.c38 ?? 0).toFixed(3), formula: '=MIN(C36:C37)', r1c1: '=MIN(R36C3:R37C3)', isHighlight: true },
    { r: 39, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 40, a: '14.0', b: `PERMISSIBLE ANCILLARY FSI AREA [SR. NO. 13 x ${ancillaryFactor.toFixed(2)}]`, c: (calc.c40 ?? 0).toFixed(3), formula: `=IF(C2="Commercial", C38*0.8, C38*0.6)`, r1c1: `=IF(R2C3="Commercial",R38C3*0.8,R38C3*0.6)` },
    { r: 41, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 42, a: '15.0', b: 'TOTAL PERMISSIBLE FSI AREA WITH ANCILLARY FSI AREA [SR. NO. 13 + SR. NO. 14]', c: (calc.c42 ?? 0).toFixed(3), formula: '=C38+C40', r1c1: '=R38C3+R40C3', isHighlight: true },
    { r: 43, a: '', b: '', c: '', isBlank: true, formula: '' },
    { r: 44, a: '16.0', b: 'APPROX. SALEABLE IN SQ.M.', c: (calc.c44 ?? 0).toFixed(3), formula: '=C42*1.15', r1c1: '=R42C3*1.15', isGrandTotal: true },
    { r: 45, a: '', b: 'APPROX. SALEABLE [ADD 15% LOADING ON SR. NO. 15] IN SQ.FT.', c: (calc.c45 ?? 0).toFixed(2), formula: '=C44*10.764', r1c1: '=R44C3*10.764', isGrandTotal: true },
    { r: 46, a: '*Above area calculation as per our understanding. Needs confirmation from Liaisoning Architect/Consultant.                                                         Prepared by: S D ARCHITECTS', b: '', c: '', isDisclaimer: true, spanABC: true, formula: '' }
  ];

  return rows.map(r => ({ ...r, isOverridden: overrides[r.r] !== undefined }));
}

export function generateRowsForZone(formData: ProjectFormData, calc: CalculationResult, overrides: RowOverrides = {}): TableRowItem[] {
  switch (formData.zone) {
    case 'tod':
      return generateTODRows(formData, calc, overrides);
    case 'cbd':
      return generateCBDRows(formData, calc, overrides);
    default:
      return generateRegularRows(formData, calc, overrides);
  }
}
