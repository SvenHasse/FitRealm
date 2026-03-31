// GoalConfig.ts
// FitRealm – Generates fitness goals based on the player's chosen FitnessFocus.

import { FitnessFocus, Goal } from '../models/types';

/**
 * Returns 4 fitness goals:
 *   2 primary goals for the chosen focus (medium + hard)
 *   2 secondary goals for the other two metrics (easy each)
 */
export function generateFitnessGoals(focus: FitnessFocus): Goal[] {
  const primary = PRIMARY_GOALS[focus];
  const secondaryMetrics = (['ausdauer', 'diaet', 'muskelaufbau'] as FitnessFocus[]).filter(m => m !== focus);
  const secondary = secondaryMetrics.map(m => SECONDARY_GOALS[m]);
  return [...primary, ...secondary];
}

// ── Primary goal definitions (2 per focus) ──────────────────────────────────

const PRIMARY_GOALS: Record<FitnessFocus, [Goal, Goal]> = {
  diaet: [
    {
      id: 'focus-diaet-daily',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.diaet.daily.title',
      descriptionKey: 'goals.focus.diaet.daily.desc',
      currentValue: 0,
      targetValue: 10_000,
      unit: 'steps',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'shoe-print',
    },
    {
      id: 'focus-diaet-weekly',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.diaet.weekly.title',
      descriptionKey: 'goals.focus.diaet.weekly.desc',
      currentValue: 0,
      targetValue: 70_000,
      unit: 'steps',
      reward: { muskelmasse: 600, protein: 5 },
      icon: 'shoe-print',
    },
  ],
  ausdauer: [
    {
      id: 'focus-ausdauer-weekly',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.ausdauer.weekly.title',
      descriptionKey: 'goals.focus.ausdauer.weekly.desc',
      currentValue: 0,
      targetValue: 5,
      unit: 'workouts',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'dumbbell',
    },
    {
      id: 'focus-ausdauer-intense',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.ausdauer.intense.title',
      descriptionKey: 'goals.focus.ausdauer.intense.desc',
      currentValue: 0,
      targetValue: 3,
      unit: 'workouts',
      reward: { muskelmasse: 600, protein: 5 },
      icon: 'fire',
    },
  ],
  muskelaufbau: [
    {
      id: 'focus-muskelaufbau-daily',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.muskelaufbau.daily.title',
      descriptionKey: 'goals.focus.muskelaufbau.daily.desc',
      currentValue: 0,
      targetValue: 500,
      unit: 'kcal',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'fire',
    },
    {
      id: 'focus-muskelaufbau-weekly',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.muskelaufbau.weekly.title',
      descriptionKey: 'goals.focus.muskelaufbau.weekly.desc',
      currentValue: 0,
      targetValue: 3500,
      unit: 'kcal',
      reward: { muskelmasse: 600, protein: 5 },
      icon: 'fire',
    },
  ],
};

// ── Secondary goals (1 per non-focus metric, easy difficulty) ────────────────

const SECONDARY_GOALS: Record<FitnessFocus, Goal> = {
  diaet: {
    id: 'secondary-diaet',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.diaet.title',
    descriptionKey: 'goals.focus.secondary.diaet.desc',
    currentValue: 0,
    targetValue: 5_000,
    unit: 'steps',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'shoe-print',
  },
  ausdauer: {
    id: 'secondary-ausdauer',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.ausdauer.title',
    descriptionKey: 'goals.focus.secondary.ausdauer.desc',
    currentValue: 0,
    targetValue: 3,
    unit: 'workouts',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'dumbbell',
  },
  muskelaufbau: {
    id: 'secondary-muskelaufbau',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.muskelaufbau.title',
    descriptionKey: 'goals.focus.secondary.muskelaufbau.desc',
    currentValue: 0,
    targetValue: 300,
    unit: 'kcal',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'fire',
  },
};
