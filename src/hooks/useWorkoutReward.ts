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
import { getActiveBuffs, getTotalMmBoostPercent } from '../utils/buffUtils';
import { useFriendsStore } from '../store/useFriendsStore';

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
  mmBoostPercent: number;
  mmBoostSources: { label: string; percent: number }[];
  proteinAlreadyEarnedToday: number;
  proteinAfterCollect: number;
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
  const streakAchieved = isStreakGoalReached(effKcal);

  // Day-based protein delta calculation
  const today = new Date().toDateString();
  const currStore = useGameStore.getState();
  const currentDailyEffKcal = (currStore.lastEffKcalDate === today ? currStore.dailyEffKcal : 0);
  const alreadyEarnedToday = (currStore.lastEffKcalDate === today ? (currStore.dailyProteinEarned ?? 0) : 0);

  const newCumulativeEffKcal = currentDailyEffKcal + effKcal;
  const totalProteinAfterWorkout = Math.min(3, getProteinFromEffKcal(newCumulativeEffKcal));
  const proteinEarned = Math.max(0, totalProteinAfterWorkout - alreadyEarnedToday);
  const proteinAlreadyEarnedToday = alreadyEarnedToday;
  const proteinAfterCollect = totalProteinAfterWorkout;

  // Buff calculation
  const tribe = useFriendsStore.getState().tribe ?? null;
  const buffs = getActiveBuffs(null, tribe);
  const mmBoostPercent = getTotalMmBoostPercent(buffs);
  const mmBoostSources = buffs
    .filter(b => b.bonusType === 'mm' || b.bonusType === 'global')
    .map(b => ({ label: `${b.source} Lv.${tribe?.level ?? 1}`, percent: b.bonusPercent }));

  const mmEarned = Math.round(effKcal * (1 + mmBoostPercent / 100));

  const reward: EffKcalReward = { effKcal, mmEarned, proteinEarned, streakAchieved, mmBoostPercent, mmBoostSources, proteinAlreadyEarnedToday, proteinAfterCollect };

  // ── Phase advancement ─────────────────────────────────────────────────────
  useEffect(() => {
    const timings: [RewardPhase, number][] = [
      ['stats',    400],
      ['reward',   1200],
      ['counter',  1700],
      ['streak',   3100],
      ['protein',  3500],
      ['ready',    3900],
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

    // Credit MM
    addMuskelmasse(mmEarned);
    setLastWorkoutDate(new Date());

    // Update daily EffKcal total first (cumulative: existing daily + this workout)
    const today2 = new Date().toDateString();
    const csNow = useGameStore.getState();
    const currentDaily = csNow.lastEffKcalDate === today2 ? csNow.dailyEffKcal : 0;
    csNow.updateDailyEffKcal(currentDaily + effKcal);

    // Fresh protein delta calculation (avoids stale closure from render time)
    const csAfter = useGameStore.getState();
    const newCumulative = csAfter.dailyEffKcal;
    const alreadyEarned = csAfter.dailyProteinEarned ?? 0;
    const freshTotalProtein = Math.min(3, getProteinFromEffKcal(newCumulative));
    const freshProteinDelta = Math.max(0, freshTotalProtein - alreadyEarned);

    if (freshProteinDelta > 0) {
      addProtein(freshProteinDelta);
      csAfter.recordDailyProteinEarned(freshProteinDelta);
    }

    // Sync to engine store
    const cs = useGameStore.getState();
    patchGameStateCurrencies({
      muskelmasse:   cs.muskelmasse,
      protein:       cs.protein,
      streakTokens:  cs.streakTokens,
      currentStreak: cs.currentStreak,
    });

    setTimeout(() => setPhase('done'), 900);
  }, [workout.id, effKcal, mmEarned, addMuskelmasse, addProtein, setLastWorkoutDate, patchGameStateCurrencies]);

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
