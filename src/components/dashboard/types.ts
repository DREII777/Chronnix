export interface TimeHelpers {
  decimalToHHMM: (value: number | null | undefined) => string;
  hhmmToDecimal: (value: string) => number;
  validateTime: (value: string) => string;
}
