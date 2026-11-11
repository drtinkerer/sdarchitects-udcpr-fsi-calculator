import { TableRowItem } from '../types/udcpr';

function escapeXml(unsafe: string | number): string {
  if (unsafe === undefined || unsafe === null) return '';
  return unsafe.toString().replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function generateSpreadsheetML(rows: TableRowItem[], fileName: string = 'FSI_AREA_STATEMENT'): string {
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
      let styleId = 'DataNum2';
      if (item.isGrandTotal) styleId = 'GrandTotalRow';
      else if (item.isHighlight) styleId = 'HighlightCell';

      const numVal = parseFloat(item.c);
      const isNum = !isNaN(numVal);
      const formulaAttr = item.r1c1 ? ` ss:Formula="${escapeXml(item.r1c1)}"` : '';

      xml += `      <Row ss:Index="${item.r}">
        <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.a)}</Data></Cell>
        <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(item.b)}</Data></Cell>
        <Cell ss:StyleID="${styleId}"${formulaAttr}>${isNum ? `<Data ss:Type="Number">${numVal}</Data>` : `<Data ss:Type="String">${escapeXml(item.c)}</Data>`}</Cell>
      </Row>\n`;
    }
  });

  xml += `    </Table>
  </Worksheet>
</Workbook>`;

  return xml;
}

export function downloadSpreadsheet(rows: TableRowItem[], filename: string) {
  const xml = generateSpreadsheetML(rows, filename);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
