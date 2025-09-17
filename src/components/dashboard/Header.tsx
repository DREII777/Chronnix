import logoUrl from '../../assets/logo.svg';
import { Totals } from '../../hooks/useDashboardData';

interface HeaderProps {
  totals: Totals;
  onLogout: () => Promise<void> | void;
}

const Header = ({ totals, onLogout }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Chronnix" className="h-10 w-auto" loading="lazy" />
          <div>
            <div className="text-lg font-semibold">Chronix — Timesheet</div>
            <div className="text-xs text-gray-500" aria-live="polite">
              (Global) Heures: {totals.hours.toFixed(2)} · Factu: {totals.factu.toFixed(2)} € · Paie: {totals.paie.toFixed(2)} €
            </div>
          </div>
        </div>
        <button type="button" onClick={() => onLogout()} className="btn">
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Header;
