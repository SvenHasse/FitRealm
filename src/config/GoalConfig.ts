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
      id: 'focus-steps-daily',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.steps.daily.title',
      descriptionKey: 'goals.focus.steps.daily.desc',
      currentValue: 0,
      targetValue: 10_000,
      unit: 'steps',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'shoe-print',
    },
    {
      id: 'focus-steps-weekly',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.steps.weekly.title',
      descriptionKey: 'goals.focus.steps.weekly.desc',
      currentValue: 0,
      targetValue: 70_000,
      unit: 'steps',
      reward: { muskelmasse: 600, protein: 5 },
      icon: 'shoe-print',
    },
  ],
  ausdauer: [
    {
      id: 'focus-workouts-weekly',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.workouts.weekly.title',
      descriptionKey: 'goals.focus.workouts.weekly.desc',
      currentValue: 0,
      targetValue: 5,
      unit: 'workouts',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'dumbbell',
    },
    {
      id: 'focus-workouts-intense',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.workouts.intense.title',
      descriptionKey: 'goals.focus.workouts.intense.desc',
      currentValue: 0,
      targetValue: 3,
      unit: 'workouts',
      reward: { muskelmasse: 600, protein: 5 },
      icon: 'fire',
    },
  ],
  muskelaufbau: [
    {
      id: 'focus-calories-daily',
      category: 'fitness',
      difficulty: 'medium',
      status: 'active',
      titleKey: 'goals.focus.calories.daily.title',
      descriptionKey: 'goals.focus.calories.daily.desc',
      currentValue: 0,
      targetValue: 500,
      unit: 'kcal',
      reward: { muskelmasse: 300, holz: 200 },
      icon: 'fire',
    },
    {
      id: 'focus-calories-weekly',
      category: 'fitness',
      difficulty: 'hard',
      status: 'active',
      titleKey: 'goals.focus.calories.weekly.title',
      descriptionKey: 'goals.focus.calories.weekly.desc',
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
    id: 'secondary-steps',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.steps.title',
    descriptionKey: 'goals.focus.secondary.steps.desc',
    currentValue: 0,
    targetValue: 5_000,
    unit: 'steps',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'shoe-print',
  },
  ausdauer: {
    id: 'secondary-workouts',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.workouts.title',
    descriptionKey: 'goals.focus.secondary.workouts.desc',
    currentValue: 0,
    targetValue: 3,
    unit: 'workouts',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'dumbbell',
  },
  muskelaufbau: {
    id: 'secondary-calories',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.focus.secondary.calories.title',
    descriptionKey: 'goals.focus.secondary.calories.desc',
    currentValue: 0,
    targetValue: 300,
    unit: 'kcal',
    reward: { muskelmasse: 150, holz: 100 },
    icon: 'fire',
  },
};
