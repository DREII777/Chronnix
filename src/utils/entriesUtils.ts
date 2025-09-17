import { TimeEntry } from '../types/models';

export const entriesByKey = (entries: TimeEntry[]): Record<string, TimeEntry> => {
  return entries.reduce<Record<string, TimeEntry>>((acc, entry) => {
    acc[`${entry.worker_id}|${entry.work_date}`] = entry;
    return acc;
  }, {});
};
