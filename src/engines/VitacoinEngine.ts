// VitacoinEngine.ts
// FitRealm - Converts HealthKit data into Vitacoins and persists the state
// Ported 1:1 from VitacoinEngine.swift

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutRecord, HealthSnapshot, emptyHealthSnapshot } from '../models/types';
import { MockDataProvider } from '../mock/MockDataProvider';

// MARK: - Persistence keys
const Keys = {
  totalVitacoins: 'fitrealmTotalVitacoins',
  processedWorkoutIDs: 'fitrealmProcessedWorkoutIDs',
  lastDailyBonusDate: 'fitrealmLastDailyBonusDate',
  recentWorkouts: 'fitrealmRecentWorkouts',
  vitacoinsEarnedToday: 'fitrealmVitacoinsEarnedToday',
  todayDateString: 'fitrealmTodayDateString',
};

// MARK: - VitacoinEngine State
export interface VitacoinState {
  totalVitacoins: number;
  recentWorkouts: WorkoutRecord[];
  healthSnapshot: HealthSnapshot;
  workoutsToday: number;
  vitacoinsEarnedToday: number;
  workoutsThisMonth: number;
  isSyncing: boolean;
}

export function createDefaultVitacoinState(): VitacoinState {
  return {
    totalVitacoins: 0,
    recentWorkouts: [],
    healthSnapshot: emptyHealthSnapshot,
    workoutsToday: 0,
    vitacoinsEarnedToday: 0,
    workoutsThisMonth: 0,
    isSyncing: false,
  };
}

// MARK: - Persistence
export async function loadVitacoinState(): Promise<Partial<VitacoinState>> {
  try {
    const totalStr = await AsyncStorage.getItem(Keys.totalVitacoins);
    const total = totalStr ? parseFloat(totalStr) : 0;

    const workoutsData = await AsyncStorage.getItem(Keys.recentWorkouts);
    const recentWorkouts = workoutsData ? JSON.parse(workoutsData) as WorkoutRecord[] : [];

    const todayStr = todayDateString();
    const savedDate = await AsyncStorage.getItem(Keys.todayDateString);
    let vitacoinsEarnedToday = 0;
    if (savedDate === todayStr) {
      const earnedStr = await AsyncStorage.getItem(Keys.vitacoinsEarnedToday);
      vitacoinsEarnedToday = earnedStr ? parseFloat(earnedStr) : 0;
    } else {
      await AsyncStorage.setItem(Keys.vitacoinsEarnedToday, '0');
      await AsyncStorage.setItem(Keys.todayDateString, todayStr);
    }

    return { totalVitacoins: total, recentWorkouts, vitacoinsEarnedToday };
  } catch (e) {
    console.log('[VitacoinEngine] Error loading state:', e);
    return {};
  }
}

export async function saveVitacoinState(state: VitacoinState, processedIDs: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(Keys.totalVitacoins, state.totalVitacoins.toString());
    await AsyncStorage.setItem(Keys.processedWorkoutIDs, JSON.stringify([...processedIDs]));
    await AsyncStorage.setItem(Keys.vitacoinsEarnedToday, state.vitacoinsEarnedToday.toString());
    await AsyncStorage.setItem(Keys.todayDateString, todayDateString());
    await AsyncStorage.setItem(Keys.recentWorkouts, JSON.stringify(state.recentWorkouts));
  } catch (e) {
    console.log('[VitacoinEngine] Error saving state:', e);
  }
}

export async function loadProcessedIDs(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(Keys.processedWorkoutIDs);
    if (data) return new Set(JSON.parse(data));
  } catch {}
  return new Set();
}

// MARK: - Vitacoin Calculation
export function calculateCoins(
  typeName: string,
  durationMinutes: number,
  calories: number,
  averageHR: number | null
): number {
  const baseFromDuration = durationMinutes * 2.0;
  const baseFromCalories = calories * 0.1;
  let total = baseFromDuration + baseFromCalories;

  total *= workoutTypeMultiplier(typeName);

  if (averageHR != null && averageHR > 140) {
    total *= 1.2;
  }

  return total;
}

function workoutTypeMultiplier(typeName: string): number {
  const name = typeName.toLowerCase();
  switch (name) {
    case 'running':
    case 'cycling':
    case 'swimming':
      return 1.5;
    case 'hiit':
    case 'functional strength training':
      return 1.3;
    default:
      return 1.0;
  }
}

// MARK: - Daily Bonuses
export async function applyDailyBonuses(
  snapshot: HealthSnapshot,
  currentState: VitacoinState
): Promise<{ bonusCoins: number }> {
  let dailyBonus = 0;

  // Step bonus: 5 coins per 1000 steps, max 50
  const stepBonus = Math.min(Math.floor(snapshot.stepsToday / 1000) * 5, 50);
  dailyBonus += stepBonus;

  // Health improvement bonuses (once per day)
  const today = todayDateString();
  const lastBonusDate = await AsyncStorage.getItem(Keys.lastDailyBonusDate);

  if (lastBonusDate !== today) {
    // RHR improvement
    if (snapshot.restingHeartRateCurrent != null && snapshot.restingHeartRate30DaysAgo != null) {
      const trend = snapshot.restingHeartRateCurrent - snapshot.restingHeartRate30DaysAgo;
      if (trend <= -2.0) dailyBonus += 50;
    }
    // VO2 Max improvement
    if (snapshot.vo2MaxCurrent != null && snapshot.vo2Max30DaysAgo != null) {
      const trend = snapshot.vo2MaxCurrent - snapshot.vo2Max30DaysAgo;
      if (trend > 0) dailyBonus += 100;
    }
    await AsyncStorage.setItem(Keys.lastDailyBonusDate, today);
  }

  return { bonusCoins: dailyBonus };
}

// MARK: - Mock Data Sync
export function syncMockData(): VitacoinState {
  const bundle = MockDataProvider.generate();
  return {
    totalVitacoins: bundle.totalCoins,
    recentWorkouts: bundle.workouts,
    healthSnapshot: bundle.snapshot,
    workoutsToday: bundle.workoutsToday,
    vitacoinsEarnedToday: bundle.vitacoinsEarnedToday,
    workoutsThisMonth: bundle.workoutsThisMonth,
    isSyncing: false,
  };
}

// MARK: - Debug
export async function resetAllVitacoinData(): Promise<VitacoinState> {
  const keysToRemove = [
    Keys.totalVitacoins,
    Keys.processedWorkoutIDs,
    Keys.lastDailyBonusDate,
    Keys.recentWorkouts,
    Keys.vitacoinsEarnedToday,
    Keys.todayDateString,
  ];
  for (const key of keysToRemove) {
    await AsyncStorage.removeItem(key);
  }
  return createDefaultVitacoinState();
}

// MARK: - Helpers
function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
