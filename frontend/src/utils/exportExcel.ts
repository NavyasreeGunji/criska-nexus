import ExcelJS from 'exceljs';

export interface ExcelColumn {
  key: string;
  label: string;
  width: number;
  numFmt?: string;
  align?: 'left' | 'center' | 'right';
}

export async function exportExcel(
  columns: ExcelColumn[],
  rows: Record<string, any>[],
  sheetName: string,
  fileName: string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Criska Nexus';
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName);

  ws.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: c.width,
  }));

  // Header row styling
  const headerRow = ws.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FF1E40AF' } },
      left:   { style: 'thin', color: { argb: 'FF1E40AF' } },
      bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
      right:  { style: 'thin', color: { argb: 'FF1E40AF' } },
    };
  });

  // Data rows
  rows.forEach((rowData, i) => {
    const row = ws.addRow(columns.map((c) => rowData[c.key] ?? ''));
    row.height = 18;
    const bgColor = i % 2 === 0 ? 'FFFFFFFF' : 'FFF0F4FF';

    row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      const col = columns[colIdx - 1];
      cell.font = { size: 10, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col?.align ?? 'left',
        wrapText: false,
      };
      cell.border = {
        top:    { style: 'hair', color: { argb: 'FFD1D5DB' } },
        left:   { style: 'hair', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'hair', color: { argb: 'FFD1D5DB' } },
        right:  { style: 'hair', color: { argb: 'FFD1D5DB' } },
      };
      if (col?.numFmt) cell.numFmt = col.numFmt;
    });
  });

  // Freeze header, enable auto-filter
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
