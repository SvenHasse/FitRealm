// MockDataProvider.ts
// FitRealm - Generates realistic fake 2-week workout history for development
// Ported 1:1 from MockDataProvider.swift

import { WorkoutRecord, HealthSnapshot } from '../models/types';
import { calculateCoins } from '../engines/VitacoinEngine';

// MARK: - MockDataBundle
export interface MockDataBundle {
  workouts: WorkoutRecord[];
  snapshot: HealthSnapshot;
  workoutsThisMonth: number;
  totalCoins: number;
  dailyBonusCoins: number;
  vitacoinsEarnedToday: number;
  workoutsToday: number;
}

function computeDailyBonusCoins(snapshot: HealthSnapshot): number {
  let bonus = 0;
  // Steps: floor(steps/1000) * 5, max 50
  bonus += Math.min(Math.floor(snapshot.stepsToday / 1000) * 5, 50);
  // RHR improved ≥2 bpm → +50
  if (snapshot.restingHeartRateCurrent != null && snapshot.restingHeartRate30DaysAgo != null) {
    const trend = snapshot.restingHeartRateCurrent - snapshot.restingHeartRate30DaysAgo;
    if (trend <= -2) bonus += 50;
  }
  // VO2 Max improved → +100
  if (snapshot.vo2MaxCurrent != null && snapshot.vo2Max30DaysAgo != null) {
    const trend = snapshot.vo2MaxCurrent - snapshot.vo2Max30DaysAgo;
    if (trend > 0) bonus += 100;
  }
  return bonus;
}

// MARK: - MockDataProvider
export const MockDataProvider = {
  generate(): MockDataBundle {
    const workouts = generateWorkouts();
    const snapshot = generateHealthSnapshot();
    const dailyBonusCoins = computeDailyBonusCoins(snapshot);
    const workoutCoins = workouts.reduce((sum, w) => sum + w.vitacoinsEarned, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayWorkoutCoins = workouts
      .filter(w => new Date(w.date) >= todayStart)
      .reduce((sum, w) => sum + w.vitacoinsEarned, 0);

    const workoutsToday = workouts.filter(w => new Date(w.date) >= todayStart).length;

    return {
      workouts,
      snapshot,
      workoutsThisMonth: workouts.length,
      totalCoins: workoutCoins + dailyBonusCoins,
      dailyBonusCoins,
      vitacoinsEarnedToday: todayWorkoutCoins + dailyBonusCoins,
      workoutsToday,
    };
  },
};

// Helper: date N days ago at given hour
function dateAgo(daysAgo: number, hour: number, minute: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Helper: compute coins matching VitacoinEngine formula
function coins(type: string, mins: number, kcal: number, hr: number | null): number {
  return calculateCoins(type, mins, kcal, hr);
}

function generateWorkouts(): WorkoutRecord[] {
  const workouts: WorkoutRecord[] = [
    {
      id: 'MOCK0000-0000-0000-0000-000000000001',
      workoutType: 'Running',
      date: dateAgo(14, 7, 15),
      durationMinutes: 35,
      caloriesBurned: 380,
      averageHeartRate: 152,
      vitacoinsEarned: coins('Running', 35, 380, 152),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000002',
      workoutType: 'Cycling',
      date: dateAgo(12, 18, 30),
      durationMinutes: 45,
      caloriesBurned: 420,
      averageHeartRate: 138,
      vitacoinsEarned: coins('Cycling', 45, 420, 138),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000003',
      workoutType: 'Strength Training',
      date: dateAgo(11, 12, 0),
      durationMinutes: 50,
      caloriesBurned: 320,
      averageHeartRate: 128,
      vitacoinsEarned: coins('Strength Training', 50, 320, 128),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000004',
      workoutType: 'Running',
      date: dateAgo(9, 8, 0),
      durationMinutes: 28,
      caloriesBurned: 310,
      averageHeartRate: 158,
      vitacoinsEarned: coins('Running', 28, 310, 158),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000005',
      workoutType: 'HIIT',
      date: dateAgo(8, 9, 0),
      durationMinutes: 25,
      caloriesBurned: 280,
      averageHeartRate: 162,
      vitacoinsEarned: coins('HIIT', 25, 280, 162),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000006',
      workoutType: 'Cycling',
      date: dateAgo(6, 17, 45),
      durationMinutes: 60,
      caloriesBurned: 540,
      averageHeartRate: 142,
      vitacoinsEarned: coins('Cycling', 60, 540, 142),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000007',
      workoutType: 'Strength Training',
      date: dateAgo(5, 12, 30),
      durationMinutes: 45,
      caloriesBurned: 290,
      averageHeartRate: 125,
      vitacoinsEarned: coins('Strength Training', 45, 290, 125),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000008',
      workoutType: 'Running',
      date: dateAgo(3, 7, 0),
      durationMinutes: 42,
      caloriesBurned: 450,
      averageHeartRate: 155,
      vitacoinsEarned: coins('Running', 42, 450, 155),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000009',
      workoutType: 'Yoga',
      date: dateAgo(2, 10, 0),
      durationMinutes: 30,
      caloriesBurned: 110,
      averageHeartRate: 95,
      vitacoinsEarned: coins('Yoga', 30, 110, 95),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000010',
      workoutType: 'Strength Training',
      date: dateAgo(1, 11, 15),
      durationMinutes: 55,
      caloriesBurned: 350,
      averageHeartRate: 132,
      vitacoinsEarned: coins('Strength Training', 55, 350, 132),
    },
    {
      id: 'MOCK0000-0000-0000-0000-000000000011',
      workoutType: 'Cycling',
      date: dateAgo(0, 7, 30),
      durationMinutes: 40,
      caloriesBurned: 380,
      averageHeartRate: 145,
      vitacoinsEarned: coins('Cycling', 40, 380, 145),
    },
  ];

  // Sort newest first
  return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateHealthSnapshot(): HealthSnapshot {
  return {
    restingHeartRateCurrent: 58,
    restingHeartRate30DaysAgo: 63,
    vo2MaxCurrent: 44.2,
    vo2Max30DaysAgo: 42.8,
    stepsToday: 8234,
    activeCaloriesToday: 380,
    lastUpdated: new Date().toISOString(),
  };
}
