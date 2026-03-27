// types.ts – React Navigation root stack param list

export interface WorkoutRewardData {
  id: string;
  type: string;
  dateISO: string; // ISO string (Date is not JSON-serializable in nav params)
  durationMinutes: number;
  activeCalories: number;
  steps: number;
  avgHeartRate: number;
  minutesAbove70HRmax: number;
}

export type RootStackParamList = {
  Main: undefined;
  WorkoutReward: {
    workout: WorkoutRewardData;
    queueLength?: number;
    queueIndex?: number;
  };
  Minigame: undefined;
  GLBTest: undefined;
  RealmScreen3D: undefined;
};

// Mock workout used when tapping "Auswerten" on Dashboard
export const MOCK_WORKOUT: WorkoutRewardData = {
  id: 'mock-workout-001',
  type: 'Laufen',
  dateISO: new Date().toISOString(),
  durationMinutes: 42,
  activeCalories: 400,
  steps: 7500,
  avgHeartRate: 155,
  minutesAbove70HRmax: 35,
};
