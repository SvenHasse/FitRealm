// HealthKitManager.ts
// FitRealm - HealthKit integration (iOS) via react-native-health
// Prepared for Android Health Connect in the future.
// Ported from HealthKitManager.swift
//
// NOTE: react-native-health requires bare workflow or an Expo config plugin.
// For managed Expo workflow, this module falls back to mock data gracefully.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { HealthSnapshot, emptyHealthSnapshot, WorkoutRecord } from '../models/types';
import { calculateCoins } from './VitacoinEngine';

const MOCK_DATA_KEY = 'fitrealmUseMockData';

// MARK: - Permission status
export interface PermissionStatus {
  [key: string]: boolean;
}

// MARK: - HealthKit availability check
export function isHealthKitAvailable(): boolean {
  // Only available on iOS with the native module installed
  return Platform.OS === 'ios';
}

// MARK: - Mock mode persistence
export async function getUseMockData(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(MOCK_DATA_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setUseMockData(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(MOCK_DATA_KEY, enabled ? 'true' : 'false');
}

// MARK: - Request Permissions (stub for managed workflow)
export async function requestPermissions(): Promise<PermissionStatus> {
  if (!isHealthKitAvailable()) {
    console.log('[HealthKit] HealthKit not available on this device.');
    return {};
  }

  // In bare workflow with react-native-health installed:
  // const permissions = { ... };
  // await AppleHealthKit.initHealthKit(permissions);
  // For now, return empty status

  console.log('[HealthKit] Permission request (stub - requires bare workflow)');
  return {
    'Workouts': false,
    'Heart Rate': false,
    'Resting Heart Rate': false,
    'VO2 Max': false,
    'Step Count': false,
    'Active Energy Burned': false,
  };
}

// MARK: - Fetch Health Snapshot (stub)
export async function fetchHealthSnapshot(): Promise<HealthSnapshot> {
  // In bare workflow, this would use react-native-health to query HealthKit
  console.log('[HealthKit] fetchHealthSnapshot (stub - returns empty)');
  return emptyHealthSnapshot;
}

// MARK: - Fetch Workouts (stub)
export async function fetchWorkouts(): Promise<WorkoutRecord[]> {
  // In bare workflow, this would use react-native-health to query HKWorkout samples
  console.log('[HealthKit] fetchWorkouts (stub - returns empty)');
  return [];
}

// MARK: - Fetch Workouts This Month (stub)
export async function fetchWorkoutsThisMonth(): Promise<number> {
  console.log('[HealthKit] fetchWorkoutsThisMonth (stub - returns 0)');
  return 0;
}

// MARK: - Workout type name mapping
export function workoutTypeName(activityType: string): string {
  // When integrated with react-native-health, the activity type string
  // can be mapped here. For now, pass through.
  return activityType;
}
