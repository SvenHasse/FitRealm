// effKcalUtils.ts
// EffKcal: Effektive Kalorien — fokusgewichtete Tagesleistung → MM + Protein

import { FitnessFocus } from '../models/types';

const SHIELD_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // kept for reference

/**
 * Berechnet EffKcal aus HealthKit-Daten je nach Fokus.
 *
 * Ausdauer:     EffKcal = kcal × (min / 40)^0.7   — lange Einheiten belohnt
 * Diät:         EffKcal = kcal                      — jede aktive kcal zählt
 * Muskelaufbau: EffKcal = kcal × (kcal/min / 8)^0.7 — Intensität belohnt
 *
 * Kipppunkt (= gleich wie Diät): 40 Min (Ausdauer), 8 kcal/min (Muskelaufbau)
 */
export function calculateEffKcal(
  focus: FitnessFocus,
  activeKcal: number,
  activeMinutes: number,
): number {
  if (activeKcal <= 0) return 0;

  switch (focus) {
    case 'ausdauer': {
      if (activeMinutes <= 0) return activeKcal * 0.1;
      return activeKcal * Math.pow(activeMinutes / 40, 0.7);
    }
    case 'diaet': {
      return activeKcal;
    }
    case 'muskelaufbau': {
      if (activeMinutes <= 0) return activeKcal * 0.5;
      const intensity = activeKcal / activeMinutes;
      return activeKcal * Math.pow(intensity / 8, 0.7);
    }
  }
}

/** Protein verdient: 450 = 1P, 525 = 2P, 600 = 3P (max) */
export function getProteinFromEffKcal(effKcal: number): number {
  if (effKcal >= 600) return 3;
  if (effKcal >= 525) return 2;
  if (effKcal >= 450) return 1;
  return 0;
}

/** Streak gilt als erfüllt wenn EffKcal >= 300 */
export function isStreakGoalReached(effKcal: number): boolean {
  return effKcal >= 300;
}

/** Intensität in kcal/min (für Muskelaufbau-Anzeige) */
export function getIntensity(activeKcal: number, activeMinutes: number): number {
  if (activeMinutes <= 0) return 0;
  return Math.round((activeKcal / activeMinutes) * 10) / 10;
}

/** MM bis zum nächsten Protein-Schwellwert. null = max (600) bereits erreicht. */
export function mmUntilNextProtein(effKcal: number): number | null {
  if (effKcal >= 600) return null;
  if (effKcal >= 525) return Math.ceil(600 - effKcal);
  if (effKcal >= 450) return Math.ceil(525 - effKcal);
  return Math.ceil(450 - effKcal);
}
