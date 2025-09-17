import { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { TimeEntry, Worker } from '../../types/models';
import { weekdayLabel } from '../../utils/dateUtils';
import { TimeHelpers } from './types';

interface TimesheetSectionProps {
  projectId: string | null;
  assignedWorkers: Worker[];
  yearMonth: string;
  days: number;
  editingCell: string | null;
  editingValue: string;
  setEditingCell: (value: string | null) => void;
  setEditingValue: (value: string) => void;
  timeHelpers: TimeHelpers;
  setHours: (workerId: string, day: number, value: string | number) => void;
  toggleStatus: (workerId: string, day: number) => void;
  totalsByWorker: Record<string, number>;
  byWorkerDate: Record<string, TimeEntry>;
}

const TimesheetSection = ({
  projectId,
  assignedWorkers,
  yearMonth,
  days,
  editingCell,
  editingValue,
  setEditingCell,
  setEditingValue,
  timeHelpers,
  setHours,
  toggleStatus,
  totalsByWorker,
  byWorkerDate,
}: TimesheetSectionProps) => {
  const handleFocus = (workerId: string, day: number, hours: number) => (event: FocusEvent<HTMLInputElement>) => {
    const cellKey = `${workerId}|${day}`;
    setEditingCell(cellKey);
    setEditingValue(timeHelpers.decimalToHHMM(hours));
    event.target.select();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^\d:]/g, '');
    setEditingValue(value);
  };

  const commitValue = (workerId: string, day: number, rawValue: string) => {
    const formatted = timeHelpers.validateTime(rawValue);
    const decimal = timeHelpers.hhmmToDecimal(formatted || rawValue);
    if (decimal > 0) {
      setHours(workerId, day, decimal);
    } else if (rawValue === '') {
      setHours(workerId, day, 0);
    }
    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (workerId: string, day: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      commitValue(workerId, day, editingValue);
    } else if (event.key === 'Escape') {
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const handleBlur = (workerId: string, day: number, isEditing: boolean) => (event: FocusEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    commitValue(workerId, day, editingValue || event.target.value);
  };

  return (
    <section className="bg-white rounded-2xl border shadow-sm">
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <h2 className="font-semibold">Timesheet ({yearMonth})</h2>
        {!projectId && (
          <div className="text-sm text-red-600" role="alert">
            Sélectionnez un chantier.
          </div>
        )}
      </div>
      <div className="p-4 overflow-auto">
        {projectId && assignedWorkers.length ? (
          <table className="w-full text-sm border-separate border-spacing-y-1" role="table" aria-label="Feuille de temps">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-2 w-56" scope="col">
                  Ouvrier
                </th>
                {Array.from({ length: days }, (_, index) => index + 1).map((day) => (
                  <th key={day} className="py-2 pr-2 cell" scope="col">
                    <div className="flex flex-col items-center leading-tight">
                      <div className="font-medium">{day}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{weekdayLabel(yearMonth, day)}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignedWorkers.map((worker) => (
                <tr key={worker.id} className="border-b last:border-none align-middle">
                  <td className="py-2 pr-2 w-56 sticky-name rounded-l-xl">
                    <div className="font-semibold truncate">{worker.full_name || worker.email || worker.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Total: {(totalsByWorker[worker.id] || 0).toFixed(2)} h</div>
                  </td>
                  {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
                    const [year, month] = yearMonth.split('-').map(Number);
                    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = byWorkerDate[`${worker.id}|${iso}`];
                    const status = entry?.status ?? 'absent';
                    const hours = entry?.hours ?? 0;
                    const weekday = weekdayLabel(yearMonth, day);
                    const isWeekend = weekday === 'Sam' || weekday === 'Dim';

                    const cellKey = `${worker.id}|${day}`;
                    const isEditing = editingCell === cellKey;
                    const displayValue = isEditing ? editingValue : timeHelpers.decimalToHHMM(hours);

                    return (
                      <td key={day} className={`py-2 pr-2 cell ${isWeekend ? 'bg-gray-150' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <input
                            type="text"
                            className="px-2 py-1 rounded-lg border text-center w-16"
                            value={displayValue}
                            placeholder="0:00"
                            aria-label={`Heures pour ${worker.full_name || worker.email} jour ${day}`}
                            onFocus={handleFocus(worker.id, day, hours)}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown(worker.id, day)}
                            onBlur={handleBlur(worker.id, day, isEditing)}
                          />
                          <button
                            className={`badge ${status === 'worked' ? 'bg-emerald-50' : 'bg-gray-50'}`}
                            onClick={() => toggleStatus(worker.id, day)}
                            aria-label={`${status} - cliquer pour changer`}
                          >
                            {status === 'worked' ? 'Travaillé' : 'Absent'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-500">
            {projectId ? 'Aucun ouvrier affecté à ce chantier.' : 'Sélectionnez un chantier.'}
          </div>
        )}
      </div>
    </section>
  );
};

export default TimesheetSection;
