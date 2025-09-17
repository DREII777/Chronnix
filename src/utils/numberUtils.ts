export const toNum = (value: unknown): number => {
  if (value === null || value === undefined) {
    return 0;
  }
  const normalized = String(value).replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
