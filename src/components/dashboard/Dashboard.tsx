import { useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { monthBounds } from '../../utils/dateUtils';
import WorkersPanel from './WorkersPanel';
import TimesheetSection from './TimesheetSection';
import Toolbar from './Toolbar';
import StatsGrid from './StatsGrid';
import Header from './Header';
import DashboardModals from './DashboardModals';
import { useDashboardData } from '../../hooks/useDashboardData';

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const state = useDashboardData(user);
  const daysInMonth = useMemo(() => monthBounds(state.yearMonth).days, [state.yearMonth]);
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();
  const email = user.email?.trim();
  const profileName = fullName || email || 'Profil utilisateur';
  const profileEmail = email && email !== profileName ? email : null;

  return (
    <div className="min-h-screen">
      <Header
        totals={state.globalTotals}
        onLogout={state.logout}
        onExportGlobal={state.exportGlobal}
        profileName={profileName}
        profileEmail={profileEmail}
      />

      {state.feedback ? (
        <div
          className={`${state.feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} border-b`}
          role="status"
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-start justify-between gap-4">
            <span>{state.feedback.message}</span>
            <button type="button" className="btn" onClick={state.clearFeedback}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      <DashboardModals
        modals={state.modals}
        onClose={state.closeModal}
        onCreateProject={state.createProject}
        onCreateWorker={state.createWorker}
        onUpdateProject={state.updateProject}
        onDeleteProject={state.deleteProject}
        formData={state.formData}
        setFormData={state.setFormData}
        editData={state.editData}
        setEditData={state.setEditData}
      />

      <Toolbar
        projects={state.projects}
        projectId={state.projectId}
        onProjectChange={state.setProjectId}
        onOpenNewProject={() => state.openModal('newProject')}
        onOpenProjectSettings={() => state.openModal('projectSettings')}
        hasProject={Boolean(state.projectId)}
        yearMonth={state.yearMonth}
        onYearMonthChange={state.setYearMonth}
        onShiftMonth={state.shiftMonth}
        exportOpen={state.exportOpen}
        setExportOpen={state.setExportOpen}
        exportBtnRef={state.exportBtnRef}
        exportMenuRef={state.exportMenuRef}
        onExportPayroll={state.exportPayroll}
        onExportDetails={state.exportDetails}
      />

      <StatsGrid totals={state.totals} hasProject={Boolean(state.projectId)} />

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <WorkersPanel
          open={state.openWorkers}
          onToggleOpen={state.toggleWorkersPanel}
          projectId={state.projectId}
          workers={state.workers}
          onOpenAddWorker={() => state.openModal('addWorker')}
          editingRate={state.editingRate}
          editRates={state.editRates}
          onRateChange={(workerId, value) => state.setEditRates((prev) => ({ ...prev, [workerId]: value }))}
          onSaveWorkerRate={state.saveWorkerRate}
          onCancelEditRate={state.cancelEditRate}
          onStartEditRate={state.startEditRate}
          assignedIds={state.assignedIds}
          onToggleAssign={state.toggleAssign}
          onDeleteWorker={state.deleteWorker}
        />
        <TimesheetSection
          projectId={state.projectId}
          assignedWorkers={state.assignedWorkers}
          yearMonth={state.yearMonth}
          days={daysInMonth}
          editingCell={state.editingCell}
          editingValue={state.editingValue}
          setEditingCell={state.setEditingCell}
          setEditingValue={state.setEditingValue}
          timeHelpers={state.timeHelpers}
          setHours={state.setHours}
          toggleStatus={state.toggleStatus}
          totalsByWorker={state.totalsByWorker}
          byWorkerDate={state.byWorkerDate}
        />
      </main>
    </div>
  );
};

export default Dashboard;
