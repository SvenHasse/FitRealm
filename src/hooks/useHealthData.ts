// useHealthData.ts
// FitRealm – reads today's health metrics from workoutStore first,
// then falls back to engine store / HealthKit data.
// Streak always comes from the currency store (single source of truth).

import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import { useWorkoutStore } from '../store/workoutStore';

export interface HealthData {
  stepsToday: number;
  stepsGoal: number;
  activeCaloriesToday: number;
  workoutMinutesToday: number;
  workoutTypeToday: string;
  currentStreak: number;
  streakMilestone: number;
  muskelmasse: number;
  protein: number;
  streakTokens: number;
}

const MOCK: HealthData = {
  stepsToday: 5200,
  stepsGoal: 10000,
  activeCaloriesToday: 280,
  workoutMinutesToday: 32,
  workoutTypeToday: 'Laufen',
  currentStreak: 5,
  streakMilestone: 7,
  muskelmasse: 1240,
  protein: 12,
  streakTokens: 8,
};

export function useHealthData(): HealthData {
  const { healthSnapshot, recentWorkouts, gameState, useMockData } = useEngineStore();
  const { currentStreak, streakTokens: csStreakTokens } = useGameStore();
  const allWorkouts = useWorkoutStore((s) => s.workouts);

  // Streak always from currency store
  const streak = currentStreak;
  const nextMilestone = Math.ceil((streak + 1) / 7) * 7;

  // Check workoutStore for today's data first
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStoreWorkouts = allWorkouts.filter((w) => new Date(w.date) >= todayStart);

  // Sum today's workouts from workoutStore
  if (todayStoreWorkouts.length > 0) {
    const workoutMinutesToday = Math.round(
      todayStoreWorkouts.reduce((s, w) => s + w.durationMinutes, 0),
    );
    const activeCaloriesToday = Math.round(
      todayStoreWorkouts.reduce((s, w) => s + w.activeCalories, 0),
    );
    const stepsToday = Math.round(
      todayStoreWorkouts.reduce((s, w) => s + w.steps, 0),
    );
    // Most recent workout type (index 0 = newest since we prepend)
    const workoutTypeToday = todayStoreWorkouts.length === 1
      ? todayStoreWorkouts[0].type
      : `${todayStoreWorkouts.length} Workouts`;

    return {
      stepsToday: stepsToday || Math.round(healthSnapshot.stepsToday),
      stepsGoal: 10000,
      activeCaloriesToday,
      workoutMinutesToday,
      workoutTypeToday,
      currentStreak: streak,
      streakMilestone: nextMilestone,
      muskelmasse: Math.round(gameState.muskelmasse),
      protein: Math.round(gameState.protein),
      streakTokens: Math.round(gameState.streakTokens),
    };
  }

  // Fall back to engine store data
  if (useMockData) {
    // Use MOCK for health metrics but always real streak from store
    return { ...MOCK, currentStreak: streak, streakMilestone: nextMilestone };
  }

  const todayEngineWorkouts = recentWorkouts.filter((w) => new Date(w.date) >= todayStart);
  const workoutMinutesToday = Math.round(
    todayEngineWorkouts.reduce((s, w) => s + w.durationMinutes, 0),
  );
  const workoutTypeToday = todayEngineWorkouts[0]?.workoutType ?? 'Workout';

  const hasData = healthSnapshot.stepsToday > 0 || todayEngineWorkouts.length > 0;
  if (!hasData) {
    // Use MOCK for health metrics but always real streak from store
    return { ...MOCK, currentStreak: streak, streakMilestone: nextMilestone };
  }

  return {
    stepsToday: Math.round(healthSnapshot.stepsToday),
    stepsGoal: 10000,
    activeCaloriesToday: Math.round(healthSnapshot.activeCaloriesToday),
    workoutMinutesToday,
    workoutTypeToday,
    currentStreak: streak,
    streakMilestone: nextMilestone,
    muskelmasse: Math.round(gameState.muskelmasse),
    protein: Math.round(gameState.protein),
    streakTokens: Math.round(gameState.streakTokens),
  };
}
