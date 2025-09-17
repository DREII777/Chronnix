import { ChangeEvent } from 'react';
import { Worker } from '../../types/models';
import { toNum } from '../../utils/numberUtils';

interface WorkersPanelProps {
  open: boolean;
  onToggleOpen: () => void;
  projectId: string | null;
  workers: Worker[];
  onOpenAddWorker: () => void;
  editingRate: string | null;
  editRates: Record<string, string>;
  onRateChange: (workerId: string, value: string) => void;
  onSaveWorkerRate: (workerId: string) => Promise<void> | void;
  onCancelEditRate: () => void;
  onStartEditRate: (worker: Worker) => void;
  assignedIds: string[];
  onToggleAssign: (workerId: string, checked: boolean) => Promise<void> | void;
  onDeleteWorker: (worker: Worker) => Promise<void> | void;
}

const WorkersPanel = ({
  open,
  onToggleOpen,
  projectId,
  workers,
  onOpenAddWorker,
  editingRate,
  editRates,
  onRateChange,
  onSaveWorkerRate,
  onCancelEditRate,
  onStartEditRate,
  assignedIds,
  onToggleAssign,
  onDeleteWorker,
}: WorkersPanelProps) => {
  return (
    <section className="bg-white rounded-2xl border shadow-sm">
      <div
        className="px-4 py-3 border-b flex items-center gap-3 cursor-pointer select-none"
        onClick={onToggleOpen}
        role="button"
        aria-expanded={open}
        aria-controls="workers-panel"
      >
        <h2 className="font-semibold">Ouvriers</h2>
        <div className="ml-auto text-xs text-gray-500">{workers.length} ouvrier(s)</div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAddWorker();
          }}
          className="ml-3 btn"
        >
          Ajouter
        </button>
        <span className="text-gray-400" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </div>
      {open && (
        <div id="workers-panel" className="p-4">
          {!projectId ? (
            <div className="text-sm text-gray-500">Sélectionnez un chantier pour gérer les affectations.</div>
          ) : workers.length ? (
            <ul className="text-sm divide-y">
              {workers.map((worker) => (
                <li key={worker.id} className="py-2 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{worker.full_name || worker.email || worker.id.slice(0, 8)}</div>
                    {worker.email ? <div className="text-xs text-gray-500 truncate">{worker.email}</div> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingRate === worker.id ? (
                      <>
                        <input
                          className="w-24 px-2 py-1 rounded-lg border text-right"
                          autoFocus
                          value={editRates[worker.id] ?? ''}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => onRateChange(worker.id, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              onSaveWorkerRate(worker.id);
                            } else if (event.key === 'Escape') {
                              onCancelEditRate();
                            }
                          }}
                        />
                        <span>€/h</span>
                        <button
                          className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                          onClick={() => onSaveWorkerRate(worker.id)}
                          aria-label="Valider"
                        >
                          ✓
                        </button>
                        <button
                          className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                          onClick={onCancelEditRate}
                          aria-label="Annuler"
                        >
                          ✖
                        </button>
                      </>
                    ) : (
                      <button
                        className="px-2 py-1 rounded-lg border bg-white hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onStartEditRate(worker)}
                        aria-label={`Modifier le taux de ${worker.full_name || worker.email}`}
                      >
                        {toNum(worker.pay_rate).toFixed(2)} €/h
                      </button>
                    )}
                    <label className="ml-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={assignedIds.includes(worker.id)}
                        onChange={(event) => onToggleAssign(worker.id, event.target.checked)}
                        aria-label={`Affecter ${worker.full_name || worker.email} au chantier`}
                      />
                      <span>Affecté</span>
                    </label>
                    <button
                      className="p-2 rounded-lg border hover:bg-red-50 hover:border-red-300 text-red-600"
                      title="Supprimer définitivement cet ouvrier"
                      onClick={() => onDeleteWorker(worker)}
                      aria-label={`Supprimer définitivement ${worker.full_name || worker.email}`}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">Aucun ouvrier.</div>
          )}
        </div>
      )}
    </section>
  );
};

export default WorkersPanel;
