// workoutProcessor.ts
// Deduplication guard: prevents a workout from being rewarded twice.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'processed_workout_ids';

async function loadIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function isWorkoutProcessed(id: string): Promise<boolean> {
  const ids = await loadIds();
  return ids.includes(id);
}

export async function markWorkoutProcessed(id: string): Promise<void> {
  const ids = await loadIds();
  if (!ids.includes(id)) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]));
  }
}

export async function clearProcessedWorkouts(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
