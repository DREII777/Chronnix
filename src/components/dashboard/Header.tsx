import { Totals } from '../../hooks/useDashboardData';

interface HeaderProps {
  totals: Totals;
  onLogout: () => Promise<void> | void;
  onExportGlobal: () => Promise<void> | void;
  profileName: string;
  profileEmail?: string | null;
}

const Header = ({ totals, onLogout, onExportGlobal, profileName, profileEmail }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="./logo.png" alt="Chronix logo" className="h-10 w-auto rounded-xl" />
          <div>
            <div className="text-lg font-semibold">Chronix — Timesheet</div>
            <div className="text-xs text-gray-500">
              (Global) Heures: {totals.hours.toFixed(2)} · Factu: {totals.factu.toFixed(2)} € · Paie: {totals.paie.toFixed(2)} €
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{profileName}</div>
            {profileEmail ? <div className="text-xs text-gray-500">{profileEmail}</div> : null}
          </div>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void onExportGlobal();
            }}
          >
            🌐 Export global par mois
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              void onLogout();
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
