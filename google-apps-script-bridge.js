/**
 * UDCPR Google Apps Script Backend Automation Bridge
 * S D ARCHITECTS UDCPR Practice
 * 
 * Master Template Links (Strictly Protected & Locked):
 * 1. Regular Zone: https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/edit?usp=sharing
 * 2. TOD Zone: https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/edit?usp=sharing
 * 3. CBD Zone: https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/edit?usp=sharing
 */

const MASTER_TEMPLATES = {
  regular: '1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U',
  tod: '1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU',
  cbd: '1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let response = {};

    switch (action) {
      case 'duplicate_and_inject':
        response = duplicateAndInject(data);
        break;
      case 'attach_auxiliary_sheet':
        response = attachAuxiliarySheet(data);
        break;
      case 'export_pdf':
        response = exportSheetToPdf(data);
        break;
      default:
        response = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Strictly duplicates the base master template into [Date] - [Client Name] - [Project Name] folder
 * Master templates remain completely unaltered and locked!
 */
function duplicateAndInject(params) {
  const clientName = (params.clientName || 'RIGHT FOUNDATION').trim();
  const projectName = (params.projectName || 'SALISBURY PARK').trim();
  const dateStr = params.date || new Date().toISOString().split('T')[0];
  
  // Strict Folder Naming Convention: [Date] - [Client Name] - [Project Name]
  const folderName = dateStr + ' - ' + clientName + ' - ' + projectName;
  const zone = params.zone || 'regular';

  // 1. Identify Master Template
  const templateId = params.customTemplateId || MASTER_TEMPLATES[zone] || MASTER_TEMPLATES.regular;
  const masterFile = DriveApp.getFileById(templateId);

  // 2. Locate or Create Target Project Directory: [Date] - [Client Name] - [Project Name]
  let parentFolder;
  if (params.parentFolderId && params.parentFolderId !== 'root') {
    parentFolder = DriveApp.getFolderById(params.parentFolderId);
  } else {
    parentFolder = DriveApp.getRootFolder();
  }

  const existingFolders = parentFolder.getFoldersByName(folderName);
  let projectFolder;
  if (existingFolders.hasNext()) {
    projectFolder = existingFolders.next();
  } else {
    projectFolder = parentFolder.createFolder(folderName);
  }

  // 3. Strictly Duplicate Template into Isolated Copy
  const newFileName = folderName + ' - FSI Area Statement (' + zone.toUpperCase() + ')';
  const clonedFile = masterFile.makeCopy(newFileName, projectFolder);
  const workingSpreadsheet = SpreadsheetApp.openById(clonedFile.getId());
  const mainSheet = workingSpreadsheet.getSheets()[0];

  // 4. Inject Form Input Data into Working Sheet Cells
  // Date Display in C1
  const dateParts = dateStr.split('-');
  const formattedDate = dateParts.length === 3 ? (dateParts[2] + '.' + dateParts[1] + '.' + dateParts[0]) : dateStr;
  mainSheet.getRange('C1').setValue('DATE: ' + formattedDate);

  // Metadata
  mainSheet.getRange('A2').setValue('CLIENT: ' + clientName.toUpperCase());
  
  let projectTypeStr = 'Residential';
  if (params.projectType === 'commercial') projectTypeStr = 'Commercial';
  else if (params.projectType === 'mixed_use' || params.projectType === 'mix_use') projectTypeStr = 'Mix Use';
  mainSheet.getRange('C2').setValue(projectTypeStr);

  mainSheet.getRange('A3').setValue('PLOT LOCATION / PROJECT NAME: ' + projectName.toUpperCase());
  
  // Road width exact tag matches template formulas: "ROAD WIDTH - <tag>"
  const roadWidthTag = params.roadWidthTag || '24m';
  mainSheet.getRange('C3').setValue('ROAD WIDTH - ' + roadWidthTag);

  // Plot areas
  mainSheet.getRange('C6').setValue(parseFloat(params.plotArea712) || 0);
  mainSheet.getRange('C7').setValue(parseFloat(params.plotAreaSite) || 0);
  mainSheet.getRange('C10').setValue(parseFloat(params.roadWidening) || 0);

  // Green FSI description (Row 33 in TOD, Row 32 in Regular and CBD)
  const greenRow = zone === 'tod' ? 33 : 32;
  let greenTitle = 'NO GREEN F.S.I. AREA [0% OF SR. NO. 9]';
  if (params.greenFsiType === 'green_griha_3') {
    greenTitle = 'ADDITIONAL SILVER-RATED GREEN F.S.I. AREA [3% OF SR. NO. 9]';
  } else if (params.greenFsiType === 'green_griha_4') {
    greenTitle = 'ADDITIONAL GOLD-RATED GREEN F.S.I. AREA [5% OF SR. NO. 9]';
  } else if (params.greenFsiType === 'green_griha_5') {
    greenTitle = 'ADDITIONAL PLATINUM-RATED GREEN F.S.I. AREA [7% OF SR. NO. 9]';
  }
  mainSheet.getRange('B' + greenRow).setValue(greenTitle);

  // Recalculate all formulas in sheet
  SpreadsheetApp.flush();

  return {
    success: true,
    folderId: projectFolder.getId(),
    folderName: folderName,
    folderUrl: projectFolder.getUrl(),
    workingFileId: clonedFile.getId(),
    workingFileName: newFileName,
    workingFileUrl: workingSpreadsheet.getUrl()
  };
}

/**
 * Attaches Auxiliary Sheet to project file as new tab
 */
function attachAuxiliarySheet(params) {
  const workingSpreadsheet = SpreadsheetApp.openById(params.workingFileId);
  const newSheet = workingSpreadsheet.insertSheet(params.auxiliaryTitle);
  newSheet.getRange('A1').setValue('Auxiliary Schedule: ' + params.auxiliaryTitle);
  newSheet.getRange('A2').setValue('Project Reference: ' + params.folderName);
  SpreadsheetApp.flush();

  return {
    success: true,
    sheetName: params.auxiliaryTitle
  };
}

/**
 * Exports active working sheet as A4 PDF and saves to project folder
 */
function exportSheetToPdf(params) {
  const projectFolder = DriveApp.getFolderById(params.folderId);

  const url = 'https://docs.google.com/spreadsheets/d/' + params.workingFileId + '/export?' +
    'exportFormat=pdf&format=pdf' +
    '&size=A4' +
    '&portrait=true' +
    '&fitw=true' +
    '&gridlines=true' +
    '&printtitle=false' +
    '&sheetnames=false' +
    '&fzr=false';

  const token = ScriptApp.getOAuthToken();
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  const pdfBlob = response.getBlob().setName(params.folderName + ' - FSI AREA STATEMENT.pdf');
  const pdfFile = projectFolder.createFile(pdfBlob);

  return {
    success: true,
    pdfFileId: pdfFile.getId(),
    pdfFileUrl: pdfFile.getUrl()
  };
}
