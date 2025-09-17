import { describe, expect, it } from 'vitest';
import { buildTimesheetsWorkbook } from '../src/services/xlsxService';

describe('buildTimesheetsWorkbook', () => {
  const baseData = {
    sheets: [
      {
        name: 'Feuille',
        rows: [
          ['Ouvrier', '01/07', 'Total'],
          ['Alice', '01:30', '01:30'],
          ['TOTAL', '01:30', '01:30'],
        ] as (string | number | null)[][],
      },
    ],
  };

  it('applies print settings, header styling and freeze panes', () => {
    const workbook = buildTimesheetsWorkbook(baseData);
    const worksheet = workbook.getWorksheet(1);

    expect(worksheet).toBeDefined();
    if (!worksheet) return;

    expect(worksheet.pageSetup.orientation).toBe('landscape');
    expect(worksheet.pageSetup.fitToPage).toBe(true);
    expect(worksheet.pageSetup.fitToWidth).toBe(1);
    expect(worksheet.pageSetup.fitToHeight).toBe(1);
    expect(worksheet.pageSetup.printArea).toBe('A1:C3');
    expect(worksheet.pageSetup.printTitlesRow).toBe('1:1');
    expect(worksheet.views?.[0]).toMatchObject({ state: 'frozen', xSplit: 1, ySplit: 1 });

    const headerCell = worksheet.getCell('A1');
    expect(headerCell.font?.bold).toBe(true);
    expect(headerCell.fill?.fgColor?.argb).toBe('FFE8F1FF');

    const zebraCell = worksheet.getCell('A2');
    expect(zebraCell.fill?.fgColor?.argb).toBe('FFF7F7F8');
  });

  it('disables colors when requested', () => {
    const workbook = buildTimesheetsWorkbook(baseData, { applyColors: false });
    const worksheet = workbook.getWorksheet(1);

    expect(worksheet).toBeDefined();
    if (!worksheet) return;

    expect(worksheet.getCell('A1').fill).toBeUndefined();
    expect(worksheet.getCell('A2').fill).toBeUndefined();
  });
});
