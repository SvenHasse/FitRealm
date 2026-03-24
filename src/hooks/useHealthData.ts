// useHealthData.ts
// FitRealm – reads from the Zustand store; falls back to mock data when HealthKit
// returns nothing or mock mode is enabled.

import { useGameStore } from '../store/useGameStore';

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
  stepsToday: 7432,
  stepsGoal: 10000,
  activeCaloriesToday: 380,
  workoutMinutesToday: 42,
  workoutTypeToday: 'Laufen',
  currentStreak: 5,
  streakMilestone: 7,
  muskelmasse: 1240,
  protein: 12,
  streakTokens: 8,
};

export function useHealthData(): HealthData {
  const { healthSnapshot, recentWorkouts, gameState, useMockData } = useGameStore();

  if (useMockData) return MOCK;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayWorkouts = recentWorkouts.filter(w => new Date(w.date) >= todayStart);
  const workoutMinutesToday = Math.round(
    todayWorkouts.reduce((s, w) => s + w.durationMinutes, 0),
  );
  const workoutTypeToday = todayWorkouts[0]?.workoutType ?? 'Workout';

  const hasData = healthSnapshot.stepsToday > 0 || todayWorkouts.length > 0;
  if (!hasData) return MOCK;

  const streak = gameState.currentStreak;
  const nextMilestone = Math.ceil((streak + 1) / 7) * 7;

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
