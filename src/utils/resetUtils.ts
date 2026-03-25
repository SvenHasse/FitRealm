// resetUtils.ts
// Centralized reset functions that clear both stores.

import { useGameStore } from '../store/gameStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useGameStore as useEngineStore } from '../store/useGameStore';

/** Reset everything to zero — currencies, workouts, streak, village. */
export function resetAllData() {
  useGameStore.getState().devResetAll();
  useWorkoutStore.setState({ workouts: [] });
  useEngineStore.getState().resetGameState();
  useEngineStore.getState().patchGameStateCurrencies({
    muskelmasse: 0, protein: 0, streakTokens: 0,
    currentStreak: 0, wood: 0, stone: 0, food: 0,
  });
}

/** Reset, then load realistic mock data for testing. */
export function resetWithMockData() {
  resetAllData();

  const gs = useGameStore.getState();
  const ws = useWorkoutStore.getState();

  // Currencies
  gs.addMuskelmasse(1240);
  gs.addProtein(12);
  gs.addStreakTokens(8);
  gs.addHolz(200);
  gs.addNahrung(120);
  gs.setStreak(5);
  gs.setLastWorkoutDate(new Date(Date.now() - 18 * 3_600_000));

  // Sync to engine store
  useEngineStore.getState().patchGameStateCurrencies({
    muskelmasse: 1240, protein: 12, streakTokens: 8, currentStreak: 5,
  });

  // Mock workouts over last 7 days
  const mockWorkouts = [
    {
      id: 'mock-1', type: 'Laufen',
      date: new Date(Date.now() - 18 * 3_600_000).toISOString(),
      durationMinutes: 42, activeCalories: 400, steps: 7500,
      avgHeartRate: 155, minutesAbove70HRmax: 30,
    },
    {
      id: 'mock-2', type: 'Krafttraining',
      date: new Date(Date.now() - 86_400_000).toISOString(),
      durationMinutes: 55, activeCalories: 320, steps: 2000,
      avgHeartRate: 128, minutesAbove70HRmax: 0,
    },
    {
      id: 'mock-3', type: 'HIIT',
      date: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      durationMinutes: 25, activeCalories: 280, steps: 3000,
      avgHeartRate: 168, minutesAbove70HRmax: 22,
    },
    {
      id: 'mock-4', type: 'Radfahren',
      date: new Date(Date.now() - 4 * 86_400_000).toISOString(),
      durationMinutes: 60, activeCalories: 450, steps: 1500,
      avgHeartRate: 138, minutesAbove70HRmax: 20,
    },
    {
      id: 'mock-5', type: 'Yoga',
      date: new Date(Date.now() - 6 * 86_400_000).toISOString(),
      durationMinutes: 30, activeCalories: 120, steps: 500,
      avgHeartRate: 88, minutesAbove70HRmax: 0,
    },
  ];

  // All mock workouts are pre-processed (already collected)
  mockWorkouts.forEach((w) => {
    ws.addWorkout(w);
    ws.markAsProcessed(w.id);
  });
}
