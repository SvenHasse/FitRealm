// progressPoints.ts
// FitRealm – Progress Point (PP) system: normalizes daily fitness metrics
// into a 0-100+ scale, weights them by FitnessFocus, and converts to rewards.

import { FitnessFocus } from '../models/types';

// ── Daily Targets (100 PP = daily target met) ────────────────────────────────

export const DAILY_TARGETS = {
  steps: 10_000,
  workouts: 45,   // minutes
  calories: 500,  // active kcal
} as const;

// ── Raw PP: normalize a single metric to 0-100+ ─────────────────────────────

export type PPMetric = 'steps' | 'workouts' | 'calories';

/**
 * Converts a raw metric value into normalized Progress Points.
 * 100 PP = daily target met. Values above target yield >100 PP (no cap).
 */
export function rawPP(metric: PPMetric, value: number): number {
  const target = DAILY_TARGETS[metric];
  if (target <= 0) return 0;
  return (value / target) * 100;
}

// ── Focus Weights ────────────────────────────────────────────────────────────

export interface FocusWeights {
  steps: number;
  workouts: number;
  calories: number;
}

/**
 * Returns weight distribution for the given focus.
 * Primary metric gets 0.70, each secondary gets 0.15.
 */
export function getFocusWeights(focus: FitnessFocus): FocusWeights {
  const PRIMARY = 0.70;
  const SECONDARY = 0.15;

  switch (focus) {
    case 'ausdauer':
      return { steps: SECONDARY, workouts: PRIMARY, calories: SECONDARY };
    case 'diaet':
      return { steps: SECONDARY, workouts: SECONDARY, calories: PRIMARY };
    case 'muskelaufbau':
      return { steps: SECONDARY, workouts: PRIMARY, calories: SECONDARY };
  }
}

// ── Total PP (weighted) ──────────────────────────────────────────────────────

export interface DailyMetrics {
  steps: number;
  workoutMinutes: number;
  calories: number;
}

/**
 * Calculates the weighted total Progress Points for a day.
 */
export function calculateTotalPP(metrics: DailyMetrics, focus: FitnessFocus): number {
  const weights = getFocusWeights(focus);
  const ppSteps    = rawPP('steps',    metrics.steps);
  const ppWorkouts = rawPP('workouts', metrics.workoutMinutes);
  const ppCalories = rawPP('calories', metrics.calories);

  return (
    ppSteps    * weights.steps +
    ppWorkouts * weights.workouts +
    ppCalories * weights.calories
  );
}

// ── PP → Rewards config ──────────────────────────────────────────────────────

export const PP_REWARDS = {
  muskelmassePerPP: 2.0,          // 2g Muskelmasse per PP
  proteinThreshold: 80,           // PP >= 80 → 1 Protein
  proteinBonusThreshold: 150,     // PP >= 150 → 2 Protein (total)
} as const;

export interface PPRewardResult {
  muskelmasse: number;
  protein: number;
  totalPP: number;
}

/**
 * Converts total PP into game rewards (Muskelmasse + Protein).
 */
export function ppToRewards(totalPP: number): PPRewardResult {
  const muskelmasse = totalPP * PP_REWARDS.muskelmassePerPP;
  let protein = 0;
  if (totalPP >= PP_REWARDS.proteinBonusThreshold) {
    protein = 2;
  } else if (totalPP >= PP_REWARDS.proteinThreshold) {
    protein = 1;
  }
  return { muskelmasse, protein, totalPP };
}
