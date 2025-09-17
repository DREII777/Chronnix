export const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

export type Weekday = typeof WEEKDAYS[number];

export const weekdayLabel = (yearMonth: string, day: number): Weekday => {
  const [year, month] = yearMonth.split('-').map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()];
};

export const yearMonthFromDate = (date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export const monthBounds = (yearMonth: string): { from: string; to: string; days: number } => {
  const [year, month] = yearMonth.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(totalDays)}`,
    days: totalDays,
  };
};

export const shiftYearMonth = (yearMonth: string, delta: number): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  return yearMonthFromDate(new Date(year, month - 1 + delta, 1));
};

export const dayLabels = (yearMonth: string): string[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
    return `${day} ${weekday}`;
  });
};
