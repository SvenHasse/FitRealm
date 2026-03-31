// useWorkoutReward.ts
// Orchestrates the reward-screen animation phase machine.
// Phases advance automatically; the UI reads `phase` to decide what to show.
// Rewards are calculated using the EffKcal formula (focus-dependent).

import { useState, useEffect, useCallback } from 'react';
import { WorkoutRewardData } from '../navigation/types';
import { markWorkoutProcessed } from '../utils/workoutProcessor';
import { calculateEffKcal, getProteinFromEffKcal, isStreakGoalReached } from '../utils/effKcalUtils';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import { useWorkoutStore } from '../store/workoutStore';

export type RewardPhase =
  | 'header'       // header animates in
  | 'stats'        // 4 stat rows stagger in
  | 'reward'       // "Deine Belohnung" divider fades in
  | 'counter'      // MM counter counts 0 → mmEarned
  | 'streak'       // streak badge bounces in
  | 'protein'      // protein icons stagger in
  | 'progress'     // progress bar fills
  | 'ready'        // collect button active
  | 'collecting'   // fly-out + confetti
  | 'done';        // modal can close

export interface EffKcalReward {
  effKcal: number;
  mmEarned: number;
  proteinEarned: number;
  streakAchieved: boolean;
}

interface UseWorkoutRewardReturn {
  phase: RewardPhase;
  reward: EffKcalReward;
  collect: () => Promise<void>;
  /** Returns the next unprocessed workout data if more remain, else null */
  getNextWorkout: () => { workout: WorkoutRewardData; queueLength: number; queueIndex: number } | null;
}

export function useWorkoutReward(
  workout: WorkoutRewardData,
  queueIndex?: number,
  queueLength?: number,
): UseWorkoutRewardReturn {
  const [phase, setPhase] = useState<RewardPhase>('header');

  const fitnessFocus = useEngineStore(s => s.userProfile?.fitnessFocus ?? 'diaet');
  const { addMuskelmasse, addProtein, setLastWorkoutDate } = useGameStore();
  const { patchGameStateCurrencies } = useEngineStore();

  // ── EffKcal-based reward calculation ──────────────────────────────────────
  const effKcal = calculateEffKcal(fitnessFocus, workout.activeCalories, workout.durationMinutes);
  const mmEarned = Math.round(effKcal);
  const proteinEarned = getProteinFromEffKcal(effKcal);
  const streakAchieved = isStreakGoalReached(effKcal);

  const reward: EffKcalReward = { effKcal, mmEarned, proteinEarned, streakAchieved };

  // ── Phase advancement ─────────────────────────────────────────────────────
  useEffect(() => {
    const timings: [RewardPhase, number][] = [
      ['stats',    400],
      ['reward',   1200],
      ['counter',  1700],
      ['streak',   3100],
      ['protein',  3500],
      ['progress', 3900],
      ['ready',    4400],
    ];

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Collect ───────────────────────────────────────────────────────────────
  const collect = useCallback(async () => {
    setPhase('collecting');
    await markWorkoutProcessed(workout.id);
    useWorkoutStore.getState().markAsProcessed(workout.id);

    // Credit currencies
    addMuskelmasse(mmEarned);
    if (proteinEarned > 0) addProtein(proteinEarned);
    setLastWorkoutDate(new Date());

    // Update daily EffKcal total in currency store
    const gs = useGameStore.getState();
    const currentDaily = gs.lastEffKcalDate === new Date().toDateString()
      ? gs.dailyEffKcal
      : 0;
    gs.updateDailyEffKcal(currentDaily + effKcal);

    // Sync to engine store
    const cs = useGameStore.getState();
    patchGameStateCurrencies({
      muskelmasse:   cs.muskelmasse,
      protein:       cs.protein,
      streakTokens:  cs.streakTokens,
      currentStreak: cs.currentStreak,
    });

    setTimeout(() => setPhase('done'), 900);
  }, [workout.id, effKcal, mmEarned, proteinEarned, addMuskelmasse, addProtein, setLastWorkoutDate, patchGameStateCurrencies]);

  // ── Queue navigation ──────────────────────────────────────────────────────
  const getNextWorkout = useCallback(() => {
    const allWorkouts = useWorkoutStore.getState().workouts;
    const remaining = allWorkouts.filter((w) => !w.isProcessed);
    if (remaining.length === 0) return null;

    const next = remaining[0];
    const currentIdx = (queueIndex ?? 0) + 1;
    const totalLen = queueLength ?? 1;

    return {
      workout: {
        id: next.id,
        type: next.type,
        dateISO: next.date,
        durationMinutes: next.durationMinutes,
        activeCalories: next.activeCalories,
        steps: next.steps,
        avgHeartRate: next.avgHeartRate,
        minutesAbove70HRmax: next.minutesAbove70HRmax,
      } as WorkoutRewardData,
      queueLength: totalLen,
      queueIndex: currentIdx,
    };
  }, [queueIndex, queueLength]);

  return { phase, reward, collect, getNextWorkout };
}
