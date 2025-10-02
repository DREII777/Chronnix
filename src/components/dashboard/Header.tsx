import { useEffect, useRef, useState } from 'react';
import { Totals } from '../../hooks/useDashboardData';

interface HeaderProps {
  totals: Totals;
  onLogout: () => Promise<void> | void;
  onExportGlobal: () => Promise<void> | void;
  profileName: string;
  profileEmail?: string | null;
}

const Header = ({ totals, onLogout, onExportGlobal, profileName, profileEmail }: HeaderProps) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      if (
        profileBtnRef.current?.contains(event.target as Node) ||
        profileMenuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setProfileOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    }

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [profileOpen]);

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
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              ref={profileBtnRef}
              className="btn flex items-center gap-2"
              onClick={(event) => {
                event.stopPropagation();
                setProfileOpen((prev) => !prev);
              }}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label="Ouvrir le profil utilisateur"
            >
              <span aria-hidden>👤</span>
              <span className="text-sm font-medium">{profileName}</span>
            </button>
            {profileOpen && (
              <div ref={profileMenuRef} className="menu" role="menu" aria-label="Profil utilisateur">
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">{profileName}</div>
                  {profileEmail ? <div className="mt-0.5">{profileEmail}</div> : null}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    void onExportGlobal();
                  }}
                >
                  🌐 Export global par mois
                </button>
              </div>
            )}
          </div>
          <button onClick={() => onLogout()} className="btn">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
