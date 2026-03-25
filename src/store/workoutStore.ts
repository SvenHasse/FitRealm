// workoutStore.ts
// Zustand store for tracking workouts added via dev tools or HealthKit.
// Persisted to AsyncStorage. Dashboard reads from this store.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Workout {
  id: string;
  type: string;
  date: string;              // ISO string
  durationMinutes: number;
  activeCalories: number;
  steps: number;
  avgHeartRate: number;
  minutesAbove70HRmax: number;
  isProcessed: boolean;      // true after user collects reward
}

interface WorkoutStore {
  workouts: Workout[];
  addWorkout: (workout: Omit<Workout, 'isProcessed'>) => void;
  markAsProcessed: (id: string) => void;
  getUnprocessed: () => Workout[];
  getTodayWorkouts: () => Workout[];
  clearAll: () => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      workouts: [],

      addWorkout(workout) {
        set((s) => ({
          workouts: [{ ...workout, isProcessed: false }, ...s.workouts],
        }));
      },

      markAsProcessed(id) {
        set((s) => ({
          workouts: s.workouts.map((w) =>
            w.id === id ? { ...w, isProcessed: true } : w,
          ),
        }));
      },

      getUnprocessed() {
        return get().workouts.filter((w) => !w.isProcessed);
      },

      getTodayWorkouts() {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return get().workouts.filter((w) => new Date(w.date) >= todayStart);
      },

      clearAll() {
        set({ workouts: [] });
      },
    }),
    {
      name: 'fitrealm-workout-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
