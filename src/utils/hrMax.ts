// hrMax.ts – Heart-rate-max helpers for personalized intensity thresholds.

export function calculateHRmax(age: number): number {
  return Math.round(220 - age);
}

export function getHRThreshold(percent: number, hrMax: number): number {
  return Math.round(hrMax * (percent / 100));
}

export const DEFAULT_HRMAX = 200;
