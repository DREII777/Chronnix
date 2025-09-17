import { Dispatch, RefObject, SetStateAction } from 'react';
import { Project } from '../../types/models';

interface ToolbarProps {
  projects: Project[];
  projectId: string | null;
  onProjectChange: (value: string | null) => void;
  onOpenNewProject: () => void;
  onOpenProjectSettings: () => void;
  hasProject: boolean;
  yearMonth: string;
  onYearMonthChange: (value: string) => void;
  onShiftMonth: (delta: number) => void;
  exportOpen: boolean;
  setExportOpen: Dispatch<SetStateAction<boolean>>;
  exportBtnRef: RefObject<HTMLButtonElement>;
  exportMenuRef: RefObject<HTMLDivElement>;
  onExportPayroll: () => Promise<void> | void;
  onExportDetails: () => Promise<void> | void;
  exportOptions: {
    onePageLandscape: boolean;
    withColors: boolean;
  };
  onToggleExportOption: (option: 'onePageLandscape' | 'withColors') => void;
}

const Toolbar = ({
  projects,
  projectId,
  onProjectChange,
  onOpenNewProject,
  onOpenProjectSettings,
  hasProject,
  yearMonth,
  onYearMonthChange,
  onShiftMonth,
  exportOpen,
  setExportOpen,
  exportBtnRef,
  exportMenuRef,
  onExportPayroll,
  onExportDetails,
  exportOptions,
  onToggleExportOption,
}: ToolbarProps) => {
  return (
    <section className="bg-white/90 border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="project-select" className="text-xs text-gray-500 mr-1">
            Chantier
          </label>
          <select
            id="project-select"
            value={projectId ?? ''}
            onChange={(event) => onProjectChange(event.target.value || null)}
            className="px-3 py-1.5 rounded-xl border bg-white"
          >
            <option value="">— Sélectionner —</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={onOpenNewProject} aria-label="Nouveau chantier">
            +
          </button>
          {hasProject && (
            <button
              type="button"
              className="btn"
              onClick={onOpenProjectSettings}
              aria-label="Paramètres du chantier"
            >
              ⚙
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="period-input" className="text-xs text-gray-500 mr-1">
            Période
          </label>
          <button
            type="button"
            className="px-2 py-1 rounded-lg border"
            onClick={() => onShiftMonth(-1)}
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <input
            id="period-input"
            type="month"
            value={yearMonth}
            onChange={(event) => onYearMonthChange(event.target.value)}
            className="px-3 py-1.5 rounded-xl border bg-white"
          />
          <button
            type="button"
            className="px-2 py-1 rounded-lg border"
            onClick={() => onShiftMonth(1)}
            aria-label="Mois suivant"
          >
            ›
          </button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <div className="relative">
            <button
              type="button"
              ref={exportBtnRef}
              className="btn"
              onClick={(event) => {
                event.stopPropagation();
                setExportOpen(!exportOpen);
              }}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              aria-label="Ouvrir le menu Export"
            >
              ⬇️ Export
            </button>
            {exportOpen && (
              <div ref={exportMenuRef} className="menu" role="menu" aria-label="Menu Export">
                <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-500 border-b border-gray-100">
                  Options
                </div>
                <label
                  className="flex items-center gap-2 px-3 py-2 text-sm border-t border-b border-gray-100 first:border-t-0"
                  role="menuitemcheckbox"
                  aria-checked={exportOptions.onePageLandscape}
                >
                  <input
                    type="checkbox"
                    checked={exportOptions.onePageLandscape}
                    onChange={() => onToggleExportOption('onePageLandscape')}
                  />
                  One-page landscape
                </label>
                <label
                  className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-100"
                  role="menuitemcheckbox"
                  aria-checked={exportOptions.withColors}
                >
                  <input
                    type="checkbox"
                    checked={exportOptions.withColors}
                    onChange={() => onToggleExportOption('withColors')}
                  />
                  Couleurs
                </label>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportOpen(false);
                    void onExportPayroll();
                  }}
                >
                  💶 Paie (XLSX)
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setExportOpen(false);
                    void onExportDetails();
                  }}
                >
                  🧾 Détaillé (XLSX)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Toolbar;
