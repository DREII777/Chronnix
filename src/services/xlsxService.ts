import { Project, TimeEntry, Worker } from '../types/models';
import { dayLabels, monthBounds } from '../utils/dateUtils';
import { entriesByKey } from '../utils/entriesUtils';
import { hhmmFromDecimal, sumHHMM } from '../utils/timeUtils';
import { toNum } from '../utils/numberUtils';

export const exportPayrollXlsx = async (entries: TimeEntry[], yearMonth: string): Promise<void> => {
  const XLSX = await import('xlsx');
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

  const rows = Array.from(summary.entries())
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

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Ouvrier', 'Heures', 'Taux', 'Montant'],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Paie');
  XLSX.writeFile(workbook, `paie_${yearMonth}.xlsx`);
};

interface DetailExportParams {
  yearMonth: string;
  projectId: string | null;
  projects: Project[];
  workers: Worker[];
  entries: TimeEntry[];
  allEntries: TimeEntry[];
}

export const exportDetailXlsx = async ({
  yearMonth,
  projectId,
  projects,
  workers,
  entries,
  allEntries,
}: DetailExportParams): Promise<void> => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const labels = dayLabels(yearMonth);
  const { days } = monthBounds(yearMonth);

  const buildSheet = (sheetName: string, sheetEntries: TimeEntry[], sheetWorkers: Worker[]) => {
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

    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [{ wch: 24 }, ...Array(days).fill({ wch: 7 }), { wch: 10 }];
    sheet['!freeze'] = { xSplit: 1, ySplit: 1 };
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
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

  XLSX.writeFile(workbook, `detail_${yearMonth}.xlsx`);
};
