// useWorkoutReward.ts
// Orchestrates the reward-screen animation phase machine.
// Phases advance automatically; the UI reads `phase` to decide what to show.

import { useState, useEffect, useCallback } from 'react';
import { WorkoutRewardData } from '../navigation/types';
import { calculateReward, RewardResult } from '../utils/currencyCalculator';
import { markWorkoutProcessed } from '../utils/workoutProcessor';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import { useWorkoutStore } from '../store/workoutStore';

export type RewardPhase =
  | 'header'       // header animates in
  | 'summary'      // 4 stat rows stagger in
  | 'divider'      // "Deine Belohnung" fades in
  | 'calculations' // calculation rows + counters
  | 'total'        // total summary scales in
  | 'ready'        // collect button active
  | 'collecting'   // fly-out + confetti
  | 'done';        // modal can close

interface UseWorkoutRewardReturn {
  phase: RewardPhase;
  reward: RewardResult;
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
  const { gameState, collectAll } = useEngineStore();
  const { addMuskelmasse, addProtein, addStreakTokens, setLastWorkoutDate, currentStreak } = useGameStore();
  const { patchGameStateCurrencies } = useEngineStore();

  const reward = calculateReward({
    durationMinutes: workout.durationMinutes,
    activeCalories: workout.activeCalories,
    steps: workout.steps,
    avgHeartRate: workout.avgHeartRate,
    minutesAbove70HRmax: workout.minutesAbove70HRmax,
  });

  // Advance through phases automatically
  useEffect(() => {
    const timings: [RewardPhase, number][] = [
      ['summary',      400],
      ['divider',      1200],
      ['calculations', 1800],
      ['total',        3200],  // nach 4 Calc-Rows (je ~600ms + buffer)
      ['ready',        3700],
    ];

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const collect = useCallback(async () => {
    setPhase('collecting');
    await markWorkoutProcessed(workout.id);
    // Mark as processed in workoutStore so recognition card hides
    useWorkoutStore.getState().markAsProcessed(workout.id);
    // Credit currencies to the currency store → CurrencyBar animates automatically
    addMuskelmasse(reward.totalMuskelmasse);
    if (reward.protein > 0) addProtein(reward.protein);
    if (reward.streakToken) addStreakTokens(1);
    setLastWorkoutDate(new Date());

    // Sync to engine store so RealmScreen / TopResourceBar also updates
    const cs = useGameStore.getState();
    patchGameStateCurrencies({
      muskelmasse: cs.muskelmasse + reward.totalMuskelmasse,
      protein: cs.protein + (reward.protein > 0 ? reward.protein : 0),
      streakTokens: cs.streakTokens + (reward.streakToken ? 1 : 0),
      currentStreak: cs.currentStreak,
    });

    // Give animation time to play before signalling done
    setTimeout(() => setPhase('done'), 900);
  }, [workout.id, reward, addMuskelmasse, addProtein, addStreakTokens, setLastWorkoutDate, patchGameStateCurrencies]);

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
