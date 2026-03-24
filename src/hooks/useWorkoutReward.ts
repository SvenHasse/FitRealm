// useWorkoutReward.ts
// Orchestrates the reward-screen animation phase machine.
// Phases advance automatically; the UI reads `phase` to decide what to show.

import { useState, useEffect, useCallback } from 'react';
import { WorkoutRewardData } from '../navigation/types';
import { calculateReward, RewardResult } from '../utils/currencyCalculator';
import { markWorkoutProcessed } from '../utils/workoutProcessor';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';

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
}

export function useWorkoutReward(workout: WorkoutRewardData): UseWorkoutRewardReturn {
  const [phase, setPhase] = useState<RewardPhase>('header');
  const { gameState, collectAll } = useEngineStore();
  const { addMuskelmasse, addProtein, addStreakTokens, setLastWorkoutDate } = useGameStore();

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
      ['summary',      400],   // after header
      ['divider',      1200],  // after 4 summary rows (4×150ms + buffer)
      ['calculations', 1800],  // after divider fade
      ['total',        5000],  // after 4 calc rows animate (~3200ms total)
      ['ready',        6000],
    ];

    const timers = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const collect = useCallback(async () => {
    setPhase('collecting');
    await markWorkoutProcessed(workout.id);
    // Credit currencies to the global store → CurrencyBar animates automatically
    addMuskelmasse(reward.totalMuskelmasse);
    if (reward.protein > 0) addProtein(reward.protein);
    if (reward.streakToken) addStreakTokens(1);
    setLastWorkoutDate(new Date());
    // Give animation time to play before signalling done
    setTimeout(() => setPhase('done'), 900);
  }, [workout.id, reward, addMuskelmasse, addProtein, addStreakTokens, setLastWorkoutDate]);

  return { phase, reward, collect };
}
