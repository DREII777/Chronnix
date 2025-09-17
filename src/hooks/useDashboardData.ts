import { useCallback, useEffect, useMemo, useRef, useState, Dispatch, SetStateAction } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { Project, TimeEntry, Worker } from '../types/models';
import { monthBounds, shiftYearMonth, yearMonthFromDate } from '../utils/dateUtils';
import { entriesByKey } from '../utils/entriesUtils';
import { toNum } from '../utils/numberUtils';
import { decimalToHHMM, hhmmToDecimal, validateTimeInput } from '../utils/timeUtils';
import { exportDetailXlsx, exportPayrollXlsx } from '../services/xlsxService';

export interface DashboardFormData {
  pName: string;
  pClient: string;
  pRate: string;
  pDefaultH: string;
  wName: string;
  wEmail: string;
  wPay: string;
}

export interface ProjectEditData {
  pClient: string;
  pRate: string;
  pDefaultH: string;
}

export interface Totals {
  hours: number;
  factu: number;
  paie: number;
}

export interface DashboardState {
  projects: Project[];
  workers: Worker[];
  assignedIds: string[];
  entries: TimeEntry[];
  allEntries: TimeEntry[];
  openWorkers: boolean;
  globalTotals: Totals;
  projectId: string | null;
  setProjectId: (value: string | null) => void;
  yearMonth: string;
  setYearMonth: (value: string) => void;
  editRates: Record<string, string>;
  setEditRates: Dispatch<SetStateAction<Record<string, string>>>;
  editingRate: string | null;
  setEditingRate: (value: string | null) => void;
  editingCell: string | null;
  setEditingCell: (value: string | null) => void;
  editingValue: string;
  setEditingValue: (value: string) => void;
  exportOpen: boolean;
  setExportOpen: Dispatch<SetStateAction<boolean>>;
  exportBtnRef: React.RefObject<HTMLButtonElement>;
  exportMenuRef: React.RefObject<HTMLDivElement>;
  modals: {
    newProject: boolean;
    addWorker: boolean;
    projectSettings: boolean;
  };
  openModal: (key: keyof DashboardState['modals']) => void;
  closeModal: (key: keyof DashboardState['modals']) => void;
  isAnyModalOpen: boolean;
  formData: DashboardFormData;
  setFormData: Dispatch<SetStateAction<DashboardFormData>>;
  editData: ProjectEditData;
  setEditData: Dispatch<SetStateAction<ProjectEditData>>;
  timeHelpers: {
    decimalToHHMM: typeof decimalToHHMM;
    hhmmToDecimal: typeof hhmmToDecimal;
    validateTime: typeof validateTimeInput;
  };
  assignedWorkers: Worker[];
  byWorkerDate: Record<string, TimeEntry>;
  totalsByWorker: Record<string, number>;
  totals: Totals;
  toggleWorkersPanel: () => void;
  toggleAssign: (workerId: string, checked: boolean) => Promise<void>;
  createProject: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  updateProject: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  deleteProject: () => Promise<void>;
  createWorker: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  deleteWorker: (worker: Worker) => Promise<void>;
  startEditRate: (worker: Worker) => void;
  cancelEditRate: () => void;
  saveWorkerRate: (workerId: string) => Promise<void>;
  setHours: (workerId: string, day: number, value: string | number) => void;
  toggleStatus: (workerId: string, day: number) => void;
  loadEntries: () => Promise<void>;
  refreshData: () => Promise<unknown[]>;
  exportPayroll: () => Promise<void>;
  exportDetails: () => Promise<void>;
  logout: () => Promise<void>;
  shiftMonth: (delta: number) => void;
  setOpenWorkers: Dispatch<SetStateAction<boolean>>;
}

export const useDashboardData = (user: User): DashboardState => {
  const timeHelpers = useMemo(
    () => ({
      decimalToHHMM,
      hhmmToDecimal,
      validateTime: validateTimeInput,
    }),
    [],
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [openWorkers, setOpenWorkers] = useState(false);
  const [globalTotals, setGlobalTotals] = useState<Totals>({ hours: 0, factu: 0, paie: 0 });
  const [projectId, setProjectIdState] = useState<string | null>(() => localStorage.getItem('projectId'));
  const [yearMonth, setYearMonthState] = useState<string>(() => localStorage.getItem('ym') || yearMonthFromDate());
  const [editRates, setEditRates] = useState<Record<string, string>>({});
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportBtnRef = useRef<HTMLButtonElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [modals, setModals] = useState({
    newProject: false,
    addWorker: false,
    projectSettings: false,
  });
  const [formData, setFormData] = useState<DashboardFormData>({
    pName: '',
    pClient: '',
    pRate: '',
    pDefaultH: '8',
    wName: '',
    wEmail: '',
    wPay: '',
  });
  const [editData, setEditData] = useState<ProjectEditData>({
    pClient: '',
    pRate: '',
    pDefaultH: '8',
  });

  const { from, to } = useMemo(() => monthBounds(yearMonth), [yearMonth]);

  useEffect(() => {
    ensureXlsxPreload();
  }, []);

  useEffect(() => {
    localStorage.setItem('projectId', projectId ?? '');
  }, [projectId]);

  useEffect(() => {
    localStorage.setItem('ym', yearMonth);
  }, [yearMonth]);

  useEffect(() => {
    if (!exportOpen) return;
    function onDocClick(event: MouseEvent) {
      if (
        exportBtnRef.current?.contains(event.target as Node) ||
        exportMenuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setExportOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setExportOpen(false);
      }
    }

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [exportOpen]);

  const isAnyModalOpen = useMemo(() => Object.values(modals).some(Boolean), [modals]);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isAnyModalOpen]);

  const openModal = useCallback((key: keyof DashboardState['modals']) => {
    if (key === 'projectSettings') {
      if (!projectId) {
        alert('Sélectionnez un chantier.');
        return;
      }
      const project = projects.find((item) => item.id === projectId);
      setEditData({
        pClient: project?.client || '',
        pRate: String(toNum(project?.bill_rate ?? '')),
        pDefaultH: String(toNum(project?.default_daily_hours ?? '8')),
      });
    }

    setModals((prev) => ({ ...prev, [key]: true }));

    if (key === 'newProject') {
      setFormData((prev) => ({ ...prev, pName: '', pClient: '', pRate: '', pDefaultH: '8' }));
    }
    if (key === 'addWorker') {
      setFormData((prev) => ({ ...prev, wName: '', wEmail: '', wPay: '' }));
    }
  }, [projectId, projects]);

  const closeModal = useCallback((key: keyof DashboardState['modals']) => {
    setModals((prev) => ({ ...prev, [key]: false }));
  }, []);

  useEffect(() => {
    const load = async () => {
      const [projectsResponse, workersResponse] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .eq('owner', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false }),
        supabase
          .from('workers')
          .select('*')
          .eq('owner', user.id)
          .eq('archived', false)
          .order('created_at', { ascending: false }),
      ]);
      setProjects(projectsResponse.data ?? []);
      setWorkers(workersResponse.data ?? []);
    };
    load();
  }, [user.id]);

  const setProjectId = useCallback((value: string | null) => {
    setProjectIdState(value);
  }, []);

  const setYearMonth = useCallback((value: string) => {
    setYearMonthState(value);
  }, []);

  const loadEntries = useCallback(async () => {
    if (!projectId) {
      setEntries([]);
      return;
    }
    const response = await supabase
      .from('time_entries')
      .select('*, worker:workers(*), project:projects(*)')
      .eq('owner', user.id)
      .eq('project_id', projectId)
      .gte('work_date', from)
      .lte('work_date', to)
      .order('work_date');
    setEntries(response.data ?? []);
  }, [projectId, user.id, from, to]);

  const loadGlobalTotals = useCallback(async () => {
    const { from: globalFrom, to: globalTo } = monthBounds(yearMonth);
    const response = await supabase
      .from('time_entries')
      .select('hours, project:projects(bill_rate), worker:workers(pay_rate)')
      .eq('owner', user.id)
      .gte('work_date', globalFrom)
      .lte('work_date', globalTo);

    let hours = 0;
    let factu = 0;
    let paie = 0;

    type BillRateRecord = { bill_rate: number | string | null };
    type PayRateRecord = { pay_rate: number | string | null };
    type GlobalTotalsRow = {
      hours: number | string | null;
      project: BillRateRecord | BillRateRecord[] | null;
      worker: PayRateRecord | PayRateRecord[] | null;
    };

    const rows = (response.data ?? []) as unknown as GlobalTotalsRow[];

    rows.forEach((entry) => {
      const project = Array.isArray(entry.project) ? entry.project[0] : entry.project;
      const worker = Array.isArray(entry.worker) ? entry.worker[0] : entry.worker;
      const h = toNum(entry.hours);
      const br = toNum(project?.bill_rate);
      const wr = toNum(worker?.pay_rate);
      hours += h;
      factu += h * br;
      paie += h * wr;
    });

    setGlobalTotals({ hours, factu, paie });
  }, [user.id, yearMonth]);

  const loadAllEntries = useCallback(async () => {
    const response = await supabase
      .from('time_entries')
      .select('*, worker:workers(*), project:projects(*)')
      .eq('owner', user.id)
      .gte('work_date', from)
      .lte('work_date', to);
    setAllEntries(response.data ?? []);
  }, [user.id, from, to]);

  const refreshData = useCallback(() => Promise.all([loadEntries(), loadGlobalTotals(), loadAllEntries()]), [
    loadEntries,
    loadGlobalTotals,
    loadAllEntries,
  ]);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) {
        setAssignedIds([]);
        setEntries([]);
        return;
      }
      const relation = await supabase
        .from('project_workers')
        .select('worker_id')
        .eq('owner', user.id)
        .eq('project_id', projectId);
      setAssignedIds((relation.data ?? []).map((item) => item.worker_id));
      await loadEntries();
    };
    loadProjectData();
  }, [user.id, projectId, yearMonth, loadEntries]);

  useEffect(() => {
    loadGlobalTotals();
    loadAllEntries();
  }, [user.id, yearMonth, loadGlobalTotals, loadAllEntries]);

  useEffect(() => {
    const map: Record<string, string> = {};
    workers.forEach((worker) => {
      map[worker.id] = String(toNum(worker.pay_rate ?? ''));
    });
    setEditRates(map);
  }, [workers]);

  const toggleWorkersPanel = useCallback(() => {
    setOpenWorkers((prev) => !prev);
  }, []);

  const toggleAssign = useCallback(
    async (workerId: string, checked: boolean) => {
      if (!projectId) return;
      const query = checked
        ? supabase.from('project_workers').insert({ owner: user.id, project_id: projectId, worker_id: workerId })
        : supabase
            .from('project_workers')
            .delete()
            .eq('owner', user.id)
            .eq('project_id', projectId)
            .eq('worker_id', workerId);
      const { error } = await query;
      if (error) {
        alert(error.message);
        return;
      }
      setAssignedIds((prev) => (checked ? Array.from(new Set([...prev, workerId])) : prev.filter((id) => id !== workerId)));
    },
    [projectId, user.id],
  );

  const createProject = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner: user.id,
          name: formData.pName,
          client: formData.pClient || null,
          bill_rate: toNum(formData.pRate),
          default_daily_hours: toNum(formData.pDefaultH) || 8,
        })
        .select()
        .single();
      if (error) {
        alert(error.message);
        return;
      }
      setProjects((prev) => [data as Project, ...prev]);
      setProjectIdState((data as Project).id);
      closeModal('newProject');
    },
    [closeModal, formData, user.id],
  );

  const updateProject = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!projectId) return;
      const { error } = await supabase
        .from('projects')
        .update({
          client: editData.pClient || null,
          bill_rate: toNum(editData.pRate),
          default_daily_hours: toNum(editData.pDefaultH) || 8,
        })
        .eq('id', projectId)
        .eq('owner', user.id);
      if (error) {
        alert(error.message);
        return;
      }
      const updated = await supabase
        .from('projects')
        .select('*')
        .eq('owner', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      setProjects(updated.data ?? []);
      closeModal('projectSettings');
      await Promise.all([loadEntries(), loadGlobalTotals()]);
    },
    [closeModal, editData, projectId, user.id, loadEntries, loadGlobalTotals],
  );

  const deleteProject = useCallback(async () => {
    if (!projectId) return;
    const project = projects.find((item) => item.id === projectId);
    const confirmation = confirm(
      `Chantier : ${project?.name || 'Sans nom'}\n\n` +
        '• Le chantier sera SUPPRIMÉ DÉFINITIVEMENT \n' +
        "• Cette action est irréversible\n" +
        'Continuer ?',
    );
    if (!confirmation) return;

    const { error } = await supabase
      .from('projects')
      .update({ archived: true, deleted_at: new Date().toISOString() })
      .eq('owner', user.id)
      .eq('id', projectId);
    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from('project_workers').delete().eq('owner', user.id).eq('project_id', projectId);
    const refreshed = await supabase
      .from('projects')
      .select('*')
      .eq('owner', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false });
    setProjects(refreshed.data ?? []);
    setProjectIdState(null);
    closeModal('projectSettings');
    await refreshData();
  }, [projectId, projects, user.id, closeModal, refreshData]);

  const createWorker = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const { data, error } = await supabase
        .from('workers')
        .insert({
          owner: user.id,
          full_name: formData.wName,
          email: formData.wEmail || null,
          pay_rate: toNum(formData.wPay),
        })
        .select()
        .single();
      if (error) {
        alert(error.message);
        return;
      }
      setWorkers((prev) => [data as Worker, ...prev]);
      closeModal('addWorker');
    },
    [closeModal, formData, user.id],
  );

  const deleteWorker = useCallback(
    async (worker: Worker) => {
      const name = worker.full_name || worker.email || worker.id.slice(0, 8);
      const confirmation = confirm(
        `Ouvrier : ${name}\n\n` +
          "• L'ouvrier sera SUPPRIMÉ DÉFINITIVEMENT \n" +
          '• Cette action est irréversible\n' +
          '• Il sera retiré des affectations\n' +
          '• Les pointages EXISTANTS sont conservés (historique)\n\n' +
          'Continuer ?',
      );
      if (!confirmation) return;

      const { error } = await supabase
        .from('workers')
        .update({ archived: true, deleted_at: new Date().toISOString() })
        .eq('owner', user.id)
        .eq('id', worker.id);
      if (error) {
        alert(error.message);
        return;
      }

      await supabase.from('project_workers').delete().eq('owner', user.id).eq('worker_id', worker.id);
      const refreshed = await supabase
        .from('workers')
        .select('*')
        .eq('owner', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      setWorkers(refreshed.data ?? []);
      await refreshData();
    },
    [user.id, refreshData],
  );

  const startEditRate = useCallback((worker: Worker) => {
    setEditRates((prev) => ({ ...prev, [worker.id]: String(toNum(worker.pay_rate ?? '')) }));
    setEditingRate(worker.id);
  }, []);

  const cancelEditRate = useCallback(() => {
    setEditingRate(null);
    const map: Record<string, string> = {};
    workers.forEach((worker) => {
      map[worker.id] = String(toNum(worker.pay_rate ?? ''));
    });
    setEditRates(map);
  }, [workers]);

  const saveWorkerRate = useCallback(
    async (workerId: string) => {
      const value = toNum(editRates[workerId]);
      const { error } = await supabase
        .from('workers')
        .update({ pay_rate: value })
        .eq('id', workerId)
        .eq('owner', user.id);
      if (error) {
        alert(error.message);
        return;
      }
      const refreshed = await supabase
        .from('workers')
        .select('*')
        .eq('owner', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      setWorkers(refreshed.data ?? []);
      setEditingRate(null);
      await refreshData();
    },
    [editRates, user.id, refreshData],
  );

  const upsertEntry = useCallback(
    async (workerId: string, day: number, patch: Partial<TimeEntry>) => {
      if (!projectId) return;
      const [year, month] = yearMonth.split('-').map(Number);
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const key = `${workerId}|${iso}`;
      const current = entriesByKey(entries)[key];
      const record = {
        owner: user.id,
        project_id: projectId,
        worker_id: workerId,
        work_date: iso,
        hours: current?.hours ?? 0,
        status: (current?.status as TimeEntry['status']) ?? 'worked',
        note: current?.note ?? null,
        ...patch,
      };
      const { error } = await supabase
        .from('time_entries')
        .upsert(record, { onConflict: 'owner,project_id,worker_id,work_date' });
      if (error) {
        alert(error.message);
        return;
      }
      await refreshData();
    },
    [projectId, yearMonth, entries, user.id, refreshData],
  );

  const setHours = useCallback(
    (workerId: string, day: number, value: string | number) => {
      let hours =
        typeof value === 'string' && value.includes(':') ? hhmmToDecimal(value) : toNum(value);
      hours = Math.max(0, Math.min(24, hours));
      void upsertEntry(workerId, day, { hours, status: hours > 0 ? 'worked' : 'absent' });
    },
    [upsertEntry],
  );

  const toggleStatus = useCallback(
    (workerId: string, day: number) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const map = entriesByKey(entries);
      const current = map[`${workerId}|${iso}`];
      const nextStatus = current?.status === 'worked' ? 'absent' : 'worked';
      const defaultHours = projects.find((project) => project.id === projectId)?.default_daily_hours || 8;
      void upsertEntry(workerId, day, {
        status: nextStatus,
        hours: nextStatus === 'worked' ? defaultHours : 0,
      });
    },
    [yearMonth, entries, projects, projectId, upsertEntry],
  );

  const assignedWorkers = useMemo(
    () => workers.filter((worker) => assignedIds.includes(worker.id)),
    [workers, assignedIds],
  );

  const byWorkerDate = useMemo(() => entriesByKey(entries), [entries]);

  const totalsByWorker = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.worker_id] = (acc[entry.worker_id] || 0) + toNum(entry.hours);
      return acc;
    }, {});
  }, [entries]);

  const totals = useMemo(() => {
    return entries.reduce<Totals>(
      (acc, entry) => {
        const hours = toNum(entry.hours);
        const br = toNum(entry.project?.bill_rate);
        const wr = toNum(entry.worker?.pay_rate);
        acc.hours += hours;
        acc.factu += hours * br;
        acc.paie += hours * wr;
        return acc;
      },
      { hours: 0, factu: 0, paie: 0 },
    );
  }, [entries]);

  const exportPayroll = useCallback(async () => {
    await exportPayrollXlsx(projectId ? entries : allEntries, yearMonth);
  }, [entries, allEntries, projectId, yearMonth]);

  const exportDetails = useCallback(async () => {
    await exportDetailXlsx({
      yearMonth,
      projectId,
      projects,
      workers,
      entries,
      allEntries,
    });
  }, [yearMonth, projectId, projects, workers, entries, allEntries]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const shiftMonth = useCallback(
    (delta: number) => {
      setYearMonthState((prev) => shiftYearMonth(prev, delta));
    },
    [],
  );

  return {
    projects,
    workers,
    assignedIds,
    entries,
    allEntries,
    openWorkers,
    globalTotals,
    projectId,
    setProjectId,
    yearMonth,
    setYearMonth,
    editRates,
    setEditRates,
    editingRate,
    setEditingRate,
    editingCell,
    setEditingCell,
    editingValue,
    setEditingValue,
    exportOpen,
    setExportOpen,
    exportBtnRef,
    exportMenuRef,
    modals,
    openModal,
    closeModal,
    isAnyModalOpen,
    formData,
    setFormData,
    editData,
    setEditData,
    timeHelpers,
    assignedWorkers,
    byWorkerDate,
    totalsByWorker,
    totals,
    toggleWorkersPanel,
    toggleAssign,
    createProject,
    updateProject,
    deleteProject,
    createWorker,
    deleteWorker,
    startEditRate,
    cancelEditRate,
    saveWorkerRate,
    setHours,
    toggleStatus,
    loadEntries,
    refreshData,
    exportPayroll,
    exportDetails,
    logout,
    shiftMonth,
    setOpenWorkers,
  };
};

const ensureXlsxPreload = () => {
  void import('xlsx');
};
