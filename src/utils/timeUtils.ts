import { toNum } from './numberUtils';

export const hhmmFromDecimal = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const hh = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const mm = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

export const sumHHMM = (values: string[]): string => {
  let minutes = 0;
  values.forEach((value) => {
    if (!value) return;
    const [h, m] = value.split(':').map((part) => parseInt(part || '0', 10));
    minutes += (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
  });
  const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mm = (minutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

export const decimalToHHMM = (value: number | null | undefined): string => {
  if (!value || value <= 0) {
    return '';
  }
  return hhmmFromDecimal(value);
};

export const hhmmToDecimal = (value: string): number => {
  if (!value) return 0;
  if (value.includes(':')) {
    const [hours, minutes] = value.split(':').map((part) => parseInt(part || '0', 10));
    return Math.min(24, Math.max(0, (hours || 0) + (minutes || 0) / 60));
  }
  return Math.min(24, Math.max(0, toNum(value)));
};

export const validateTimeInput = (value: string): string => {
  if (!value) return '';
  if (/^\d+$/.test(value)) {
    const hours = Math.min(23, parseInt(value, 10));
    return `${hours}:00`;
  }
  if (/^\d{1,2}:\d{0,2}$/.test(value)) {
    const [h, m] = value.split(':');
    const hours = Math.min(23, parseInt(h || '0', 10));
    const minutes = Math.min(59, parseInt(m || '0', 10));
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  }
  return value;
};
