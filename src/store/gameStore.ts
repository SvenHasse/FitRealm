// gameStore.ts
// Single source of truth for all FitRealm currencies, resources and streak state.
// Persisted to AsyncStorage via Zustand middleware.
//
// NOTE: lastWorkoutDate is stored as an ISO string (not a Date) so JSON
// serialisation works correctly with AsyncStorage. Components convert it
// with `new Date(lastWorkoutDate)` when needed.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameState {
  // ── Currencies ─────────────────────────────────────────────────────────────
  muskelmasse: number;
  protein: number;
  streakTokens: number;

  // ── Resources ──────────────────────────────────────────────────────────────
  holz: number;
  nahrung: number;
  stein: number;

  // ── Streak ─────────────────────────────────────────────────────────────────
  currentStreak: number;
  lastWorkoutDate: string | null;          // ISO string — convert with new Date()
  collectedMilestones: number[];           // streak-day values already claimed
  lastFocusGoalAchievedAt: number | null;  // Unix timestamp (ms) — when focus goal was last met

  // ── Actions ────────────────────────────────────────────────────────────────
  addMuskelmasse:   (amount: number) => void;
  addProtein:       (amount: number) => void;
  addStreakTokens:  (amount: number) => void;
  addHolz:          (amount: number) => void;
  addNahrung:       (amount: number) => void;
  addStein:         (amount: number) => void;
  setStreak:        (days: number)   => void;
  setLastWorkoutDate: (date: Date)   => void;
  collectMilestone: (days: number)   => void;
  recordFocusGoalAchieved: ()        => void;

  // ── Dev tools ──────────────────────────────────────────────────────────────
  devAddMuskelmasse:  (amount: number) => void;
  devAddProtein:      (amount: number) => void;
  devAddStreakTokens: (amount: number) => void;
  devAddStreak:       (days: number)   => void;
  devResetAll:        ()               => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // ── Initial state (mirrors mock/dev defaults) ─────────────────────────
      muskelmasse:        1240,
      protein:            12,
      streakTokens:       8,
      holz:               200,
      nahrung:            120,
      stein:              50,
      currentStreak:           5,
      lastWorkoutDate:         new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      collectedMilestones:     [3, 7],
      lastFocusGoalAchievedAt: null,

      // ── Actions ──────────────────────────────────────────────────────────
      addMuskelmasse:  (a) => set((s) => ({ muskelmasse:  s.muskelmasse  + a })),
      addProtein:      (a) => set((s) => ({ protein:      s.protein      + a })),
      addStreakTokens: (a) => set((s) => ({ streakTokens: s.streakTokens + a })),
      addHolz:         (a) => set((s) => ({ holz:         s.holz         + a })),
      addNahrung:      (a) => set((s) => ({ nahrung:      s.nahrung      + a })),
      addStein:        (a) => set((s) => ({ stein:        s.stein        + a })),

      setStreak:               (days) => set({ currentStreak:    days }),
      setLastWorkoutDate:      (date) => set({ lastWorkoutDate:  date.toISOString() }),
      recordFocusGoalAchieved: ()     => set({ lastFocusGoalAchievedAt: Date.now() }),
      collectMilestone:        (days) => set((s) => ({
        collectedMilestones: [...s.collectedMilestones, days],
      })),

      // ── Dev tools ─────────────────────────────────────────────────────────
      devAddMuskelmasse:  (a) => set((s) => ({ muskelmasse:  s.muskelmasse  + a })),
      devAddProtein:      (a) => set((s) => ({ protein:      s.protein      + a })),
      devAddStreakTokens: (a) => set((s) => ({ streakTokens: s.streakTokens + a })),
      devAddStreak:       (a) => set((s) => ({ currentStreak: s.currentStreak + a })),
      devResetAll:        ()  => set({
        muskelmasse: 0, protein: 0, streakTokens: 0,
        holz: 0, nahrung: 0, stein: 0,
        currentStreak: 0, collectedMilestones: [],
      }),
    }),
    {
      name:    'fitrealm-game-store',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
