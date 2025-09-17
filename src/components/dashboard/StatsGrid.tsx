import { Totals } from '../../hooks/useDashboardData';

interface StatsGridProps {
  totals: Totals;
  hasProject: boolean;
}

const StatsGrid = ({ totals, hasProject }: StatsGridProps) => {
  return (
    <section className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 grid sm:grid-cols-3 gap-3">
        <div className="card">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>Heures</span>
            <span className="text-[10px] text-gray-400">{hasProject ? '(chantier)' : '(sélectionnez un chantier)'}</span>
          </div>
          <div className="text-2xl font-semibold mt-1">{totals.hours.toFixed(2)} h</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">Facturation estimée</div>
          <div className="text-2xl font-semibold mt-1">{totals.factu.toFixed(2)} €</div>
        </div>
        <div className="card">
          <div className="text-xs text-gray-500">Paie estimée</div>
          <div className="text-2xl font-semibold mt-1">{totals.paie.toFixed(2)} €</div>
        </div>
      </div>
    </section>
  );
};

export default StatsGrid;
