import ExcelJS from 'exceljs';
import { Project, TimeEntry, Worker } from '../types/models';
import { dayLabels, monthBounds } from '../utils/dateUtils';
import { entriesByKey } from '../utils/entriesUtils';
import { hhmmFromDecimal, sumHHMM } from '../utils/timeUtils';
import { toNum } from '../utils/numberUtils';

export interface TimesheetSheetData {
  name: string;
  rows: (string | number | null)[][];
}

export interface TimesheetWorkbookData {
  sheets: TimesheetSheetData[];
}

export interface TimesheetWorkbookOptions {
  applyPrintSetup: boolean;
  applyColors: boolean;
}

const DEFAULT_TIMESHEET_OPTIONS: TimesheetWorkbookOptions = {
  applyPrintSetup: true,
  applyColors: true,
};

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1FF' } } as const;
const ZEBRA_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F8' } } as const;
const BORDER = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
} as const;

export const buildTimesheetsWorkbook = (
  data: TimesheetWorkbookData,
  options: Partial<TimesheetWorkbookOptions> = {},
): ExcelJS.Workbook => {
  const workbook = new ExcelJS.Workbook();
  const resolvedOptions: TimesheetWorkbookOptions = { ...DEFAULT_TIMESHEET_OPTIONS, ...options };

  data.sheets.forEach(({ name, rows }) => {
    const worksheet = workbook.addWorksheet(name.slice(0, 31));
    rows.forEach((row) => worksheet.addRow(row));

    if (!rows.length) {
      return;
    }

    const columnCount = rows[0]?.length ?? 0;
    const rowCount = rows.length;

    worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

    rows.forEach((row, rowIndex) => {
      row.forEach((_, columnIndex) => {
        const cell = worksheet.getCell(rowIndex + 1, columnIndex + 1);
        cell.border = BORDER;
        cell.alignment = {
          vertical: 'middle',
          horizontal: rowIndex === 0 ? 'center' : 'left',
          wrapText: true,
        };

        if (rowIndex === 0) {
          cell.font = { bold: true };
          if (resolvedOptions.applyColors) {
            cell.fill = HEADER_FILL;
          }
        } else if (resolvedOptions.applyColors && rowIndex % 2 === 1) {
          cell.fill = ZEBRA_FILL;
        }
      });
    });

    for (let colIndex = 0; colIndex < columnCount; colIndex += 1) {
      let maxLength = 4;
      rows.forEach((row) => {
        const value = row[colIndex];
        if (value === null || value === undefined) {
          return;
        }
        const text = typeof value === 'number' ? value.toFixed(2) : String(value);
        maxLength = Math.max(maxLength, text.length);
      });
      worksheet.getColumn(colIndex + 1).width = Math.min(40, maxLength + 2);
    }

    if (columnCount > 0 && rowCount > 0) {
      const lastColumn = worksheet.getColumn(columnCount).letter;
      worksheet.pageSetup.printArea = `A1:${lastColumn}${rowCount}`;
      worksheet.pageSetup.printTitlesRow = '1:1';

      if (resolvedOptions.applyPrintSetup) {
        worksheet.pageSetup.orientation = 'landscape';
        worksheet.pageSetup.fitToPage = true;
        worksheet.pageSetup.fitToWidth = 1;
        worksheet.pageSetup.fitToHeight = 1;
        worksheet.pageSetup.horizontalCentered = true;
        worksheet.pageSetup.verticalCentered = false;
        worksheet.pageSetup.margins = {
          left: 0.5,
          right: 0.5,
          top: 0.5,
          bottom: 0.5,
          header: 0.3,
          footer: 0.3,
        };
      }
    }
  });

  return workbook;
};

const triggerBrowserDownload = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const withBrowserDownload = async (workbook: ExcelJS.Workbook, filename: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  await triggerBrowserDownload(workbook, filename);
};

export const exportPayrollXlsx = async (entries: TimeEntry[], yearMonth: string): Promise<void> => {
  const summary = new Map<
    string,
    {
      minutes: number;
      rate: number;
      amount: number;
    }
  >();

  entries.forEach((entry) => {
    const workerName = entry.worker?.full_name || entry.worker?.email || entry.worker_id;
    const hours = toNum(entry.hours);
    const rate = toNum(entry.worker?.pay_rate ?? 0);
    const current = summary.get(workerName) ?? { minutes: 0, rate, amount: 0 };
    current.minutes += Math.round(hours * 60);
    current.amount += hours * rate;
    current.rate = rate || current.rate;
    summary.set(workerName, current);
  });

  type PayrollRow = { Ouvrier: string; Heures: string; Taux: number | null; Montant: number };

  const rows: PayrollRow[] = Array.from(summary.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([name, value]) => ({
      Ouvrier: name,
      Heures: hhmmFromDecimal(value.minutes / 60),
      Taux: Number(toNum(value.rate).toFixed(2)),
      Montant: Number(toNum(value.amount).toFixed(2)),
    }));

  if (!rows.length) {
    rows.push({ Ouvrier: '—', Heures: '00:00', Taux: null, Montant: 0 });
  }

  const totalHours = hhmmFromDecimal(
    rows.reduce((sum, row) => {
      const [h, m] = String(row.Heures).split(':').map(Number);
      return sum + (Number.isFinite(h) && Number.isFinite(m) ? (h * 60 + m) / 60 : 0);
    }, 0),
  );
  const totalAmount = Number(rows.reduce((sum, row) => sum + Number(row.Montant || 0), 0).toFixed(2));

  rows.push({ Ouvrier: 'TOTAL', Heures: totalHours, Taux: null, Montant: totalAmount });

  const workbook = buildTimesheetsWorkbook(
    {
      sheets: [
        {
          name: 'Paie',
          rows: [
            ['Ouvrier', 'Heures', 'Taux', 'Montant'],
            ...rows.map((row) => [row.Ouvrier, row.Heures, row.Taux, row.Montant]),
          ],
        },
      ],
    },
    { applyPrintSetup: false },
  );

  await withBrowserDownload(workbook, `paie_${yearMonth}.xlsx`);
};

interface DetailExportParams {
  yearMonth: string;
  projectId: string | null;
  projects: Project[];
  workers: Worker[];
  entries: TimeEntry[];
  allEntries: TimeEntry[];
  options?: Partial<TimesheetWorkbookOptions>;
}

const buildTimesheetRows = (
  sheetEntries: TimeEntry[],
  sheetWorkers: Worker[],
  yearMonth: string,
): (string | number | null)[][] => {
  const labels = dayLabels(yearMonth);
  const { days } = monthBounds(yearMonth);
  const map = entriesByKey(sheetEntries);
  const header = ['Ouvrier', ...labels, 'Total'];
  const data: (string | number | null)[][] = [header];

  sheetWorkers.forEach((worker) => {
    const row: (string | number | null)[] = Array(header.length).fill(null);
    row[0] = worker.full_name || worker.email || worker.id.slice(0, 8);
    const daily: string[] = [];

    for (let day = 1; day <= days; day += 1) {
      const [year, month] = yearMonth.split('-').map(Number);
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = map[`${worker.id}|${iso}`];
      const hours = entry ? toNum(entry.hours) : 0;
      const value = hours > 0 ? hhmmFromDecimal(hours) : '';
      row[day] = value;
      daily.push(value);
    }

    row[header.length - 1] = sumHHMM(daily);
    data.push(row);
  });

  const totalRow: (string | number | null)[] = Array(header.length).fill(null);
  totalRow[0] = 'TOTAL';
  for (let day = 1; day <= days; day += 1) {
    const columnValues = data.slice(1).map((r) => r[day]).filter((value): value is string => typeof value === 'string');
    totalRow[day] = sumHHMM(columnValues);
  }
  totalRow[header.length - 1] = sumHHMM(
    data
      .slice(1)
      .map((row) => row[header.length - 1])
      .filter((value): value is string => typeof value === 'string'),
  );

  data.push(totalRow);

  return data;
};

const generateTimesheetSheets = (
  params: DetailExportParams,
): TimesheetSheetData[] => {
  const { yearMonth, projectId, projects, workers, entries, allEntries } = params;

  const sheets: TimesheetSheetData[] = [];

  const buildSheet = (sheetName: string, sheetEntries: TimeEntry[], sheetWorkers: Worker[]) => {
    const data = buildTimesheetRows(sheetEntries, sheetWorkers, yearMonth);
    sheets.push({ name: sheetName, rows: data });
  };

  if (projectId) {
    const project = projects.find((p) => p.id === projectId);
    const name = project?.name || 'Chantier';
    const workerIds = new Set(entries.map((entry) => entry.worker_id));
    buildSheet(`Chantier - ${name}`, entries, workers.filter((worker) => workerIds.has(worker.id)));
  } else {
    const byProject = new Map<string, TimeEntry[]>();
    allEntries.forEach((entry) => {
      const list = byProject.get(entry.project_id) ?? [];
      list.push(entry);
      byProject.set(entry.project_id, list);
    });

    if (!byProject.size) {
      buildSheet('Chantiers', [], workers);
    } else {
      byProject.forEach((list, id) => {
        const project = projects.find((p) => p.id === id);
        const name = project?.name || 'Chantier';
        const workerIds = new Set(list.map((entry) => entry.worker_id));
        buildSheet(`Chantier - ${name}`, list, workers.filter((worker) => workerIds.has(worker.id)));
      });
    }
  }

  return sheets;
};

export const exportDetailXlsx = async (params: DetailExportParams): Promise<void> => {
  const { options, yearMonth } = params;
  const sheets = generateTimesheetSheets(params);
  const workbook = buildTimesheetsWorkbook({ sheets }, options);
  const today = new Date();
  const isoDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(
    2,
    '0',
  )}`;
  await withBrowserDownload(workbook, `Chronnix_Timesheets_${isoDate}.xlsx`);
};

interface GlobalExportParams {
  yearMonth: string;
  workers: Worker[];
  entries: TimeEntry[];
}

const resolveWorkerDisplay = (worker: Worker | null | undefined): { name: string; email: string } => {
  const name = worker?.full_name?.trim();
  const email = worker?.email?.trim();

  if (name) {
    return { name, email: email || '' };
  }

  if (email) {
    return { name: email, email };
  }

  return { name: worker?.id?.slice(0, 8) || '—', email: '' };
};

export const exportGlobalMonthXlsx = async ({ yearMonth, workers, entries }: GlobalExportParams): Promise<void> => {
  const workerMeta = new Map(
    workers.map((worker) => [
      worker.id,
      {
        rate: toNum(worker.pay_rate),
        info: resolveWorkerDisplay(worker),
      },
    ]),
  );

  type Summary = {
    hours: number;
    days: Set<string>;
    rate: number;
    name: string;
    email: string;
  };

  const byWorker = new Map<string, Summary>();

  entries.forEach((entry) => {
    const hours = toNum(entry.hours);
    if (!hours) {
      return;
    }

    const meta = workerMeta.get(entry.worker_id) ?? {
      rate: toNum(entry.worker?.pay_rate),
      info: resolveWorkerDisplay(entry.worker ?? null),
    };

    const { name, email } = meta.info;
    const rate = meta.rate || toNum(entry.worker?.pay_rate);

    const current = byWorker.get(entry.worker_id) ?? {
      hours: 0,
      days: new Set<string>(),
      rate: rate || 0,
      name,
      email,
    };

    current.hours += hours;
    current.days.add(entry.work_date);
    current.rate = rate || current.rate;
    current.name = name || current.name;
    current.email = email ?? current.email;

    byWorker.set(entry.worker_id, current);
  });

  const summaryRows = Array.from(byWorker.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((summary) => {
      const totalPay = Number((summary.hours * summary.rate).toFixed(2));
      return [
        summary.name || '—',
        summary.email,
        Number(summary.hours.toFixed(2)),
        summary.days.size,
        summary.rate ? Number(summary.rate.toFixed(2)) : null,
        totalPay,
      ] as (string | number | null);
    });

  const totalHours = Number(
    summaryRows.reduce((sum, row) => sum + (typeof row[2] === 'number' ? row[2] : 0), 0).toFixed(2),
  );
  const totalDays = summaryRows.reduce((sum, row) => sum + (typeof row[3] === 'number' ? row[3] : 0), 0);
  const totalPay = Number(
    summaryRows.reduce((sum, row) => sum + (typeof row[5] === 'number' ? row[5] : 0), 0).toFixed(2),
  );

  const summarySheet = {
    name: 'Résumé',
    rows: [
      ['Nom', 'Email', 'Heures totales', 'Jours', 'Taux horaire', 'Total paie'],
      ...summaryRows,
      ['TOTAL', '', totalHours, totalDays, null, totalPay],
    ],
  } satisfies TimesheetSheetData;

  const detailRows = entries
    .slice()
    .sort((a, b) => {
      if (a.work_date === b.work_date) {
        const nameA = resolveWorkerDisplay(a.worker ?? null).name;
        const nameB = resolveWorkerDisplay(b.worker ?? null).name;
        return nameA.localeCompare(nameB);
      }
      return a.work_date.localeCompare(b.work_date);
    })
    .map((entry) => {
      const workerInfo = resolveWorkerDisplay(entry.worker ?? null);
      const projectName = entry.project?.name?.trim() || '—';
      return [
        entry.work_date,
        workerInfo.name,
        projectName,
        Number(toNum(entry.hours).toFixed(2)),
        entry.note?.trim() || '',
      ] as (string | number | null);
    });

  const detailSheet = {
    name: 'Détails',
    rows: [['Date', 'Ouvrier', 'Chantier', 'Heures', 'Notes'], ...detailRows],
  } satisfies TimesheetSheetData;

  const workbook = buildTimesheetsWorkbook({ sheets: [summarySheet, detailSheet] }, { applyPrintSetup: false });

  await withBrowserDownload(workbook, `Chronnix_Global_${yearMonth}.xlsx`);
};
