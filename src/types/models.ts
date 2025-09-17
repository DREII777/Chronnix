export interface Project {
  id: string;
  owner: string;
  name: string;
  client: string | null;
  bill_rate: number | null;
  default_daily_hours: number | null;
  archived?: boolean;
  created_at?: string;
}

export interface Worker {
  id: string;
  owner: string;
  full_name: string | null;
  email: string | null;
  pay_rate: number | null;
  archived?: boolean;
  created_at?: string;
}

export type EntryStatus = 'worked' | 'absent';

export interface TimeEntry {
  id?: string;
  owner: string;
  project_id: string;
  worker_id: string;
  work_date: string;
  hours: number;
  status: EntryStatus;
  note?: string | null;
  project?: Project | null;
  worker?: Worker | null;
}

export interface ProjectWorker {
  owner: string;
  project_id: string;
  worker_id: string;
}
