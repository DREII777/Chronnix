import { Dispatch, FormEvent, SetStateAction } from 'react';
import Modal from '../common/Modal';
import { DashboardFormData, ProjectEditData } from '../../hooks/useDashboardData';

interface DashboardModalsProps {
  modals: {
    newProject: boolean;
    addWorker: boolean;
    projectSettings: boolean;
  };
  onClose: (key: 'newProject' | 'addWorker' | 'projectSettings') => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCreateWorker: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onUpdateProject: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteProject: () => Promise<void>;
  formData: DashboardFormData;
  setFormData: Dispatch<SetStateAction<DashboardFormData>>;
  editData: ProjectEditData;
  setEditData: Dispatch<SetStateAction<ProjectEditData>>;
}

const DashboardModals = ({
  modals,
  onClose,
  onCreateProject,
  onCreateWorker,
  onUpdateProject,
  onDeleteProject,
  formData,
  setFormData,
  editData,
  setEditData,
}: DashboardModalsProps) => {
  return (
    <>
      {modals.newProject && (
        <Modal title="Nouveau chantier" onClose={() => onClose('newProject')}>
          <form onSubmit={onCreateProject} className="grid grid-cols-2 gap-3">
            <input
              data-autofocus
              placeholder="Nom du chantier"
              value={formData.pName}
              onChange={(event) => setFormData((prev) => ({ ...prev, pName: event.target.value }))}
              required
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <input
              placeholder="Client"
              value={formData.pClient}
              onChange={(event) => setFormData((prev) => ({ ...prev, pClient: event.target.value }))}
              className="px-3 py-2 rounded-xl border"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <input
              placeholder="Taux €/h"
              value={formData.pRate}
              onChange={(event) => setFormData((prev) => ({ ...prev, pRate: event.target.value }))}
              className="px-3 py-2 rounded-xl border"
              autoComplete="off"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <input
              placeholder="Heures/jour défaut"
              value={formData.pDefaultH}
              onChange={(event) => setFormData((prev) => ({ ...prev, pDefaultH: event.target.value }))}
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <button type="submit" className="col-span-2 btn btn-primary">
              Créer
            </button>
          </form>
        </Modal>
      )}

      {modals.addWorker && (
        <Modal title="Ajouter un ouvrier" onClose={() => onClose('addWorker')}>
          <form onSubmit={onCreateWorker} className="grid grid-cols-2 gap-3">
            <input
              data-autofocus
              placeholder="Nom complet"
              value={formData.wName}
              onChange={(event) => setFormData((prev) => ({ ...prev, wName: event.target.value }))}
              required
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <input
              placeholder="Email (optionnel)"
              value={formData.wEmail}
              onChange={(event) => setFormData((prev) => ({ ...prev, wEmail: event.target.value }))}
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              inputMode="email"
            />
            <input
              placeholder="Taux €/h"
              value={formData.wPay}
              onChange={(event) => setFormData((prev) => ({ ...prev, wPay: event.target.value }))}
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <button type="submit" className="col-span-2 btn btn-primary">
              Ajouter
            </button>
          </form>
        </Modal>
      )}

      {modals.projectSettings && (
        <Modal title="Paramètres du chantier" onClose={() => onClose('projectSettings')}>
          <form onSubmit={onUpdateProject} className="grid grid-cols-2 gap-3">
            <input
              data-autofocus
              placeholder="Client"
              value={editData.pClient}
              onChange={(event) => setEditData((prev) => ({ ...prev, pClient: event.target.value }))}
              className="px-3 py-2 rounded-xl border col-span-2"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
            />
            <input
              placeholder="Taux €/h"
              value={editData.pRate}
              onChange={(event) => setEditData((prev) => ({ ...prev, pRate: event.target.value }))}
              className="px-3 py-2 rounded-xl border"
              autoComplete="off"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <input
              placeholder="Heures/jour défaut"
              value={editData.pDefaultH}
              onChange={(event) => setEditData((prev) => ({ ...prev, pDefaultH: event.target.value }))}
              className="px-3 py-2 rounded-xl border"
              autoComplete="off"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <button type="submit" className="col-span-2 btn btn-primary">
              Mettre à jour
            </button>
            <button
              type="button"
              onClick={onDeleteProject}
              className="col-span-2 btn border-red-200 text-red-600 hover:bg-red-50"
            >
              Supprimer définitivement ce chantier
            </button>
          </form>
        </Modal>
      )}
    </>
  );
};

export default DashboardModals;
