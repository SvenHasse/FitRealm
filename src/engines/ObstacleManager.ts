// ObstacleManager.ts
// FitRealm - Obstacle generation, persistence, and management
// Ported from ObstacleView.swift ObstacleManager

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Obstacle, ObstacleType } from '../models/types';
import { WorldConstants, OBSTACLE_CONFIG } from '../config/GameConfig';

const OBSTACLE_KEY = 'fitrealmObstacles';

// Seeded random number generator (deterministic)
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextBool(probability: number): boolean {
    return this.next() < probability;
  }
}

export async function loadObstacles(): Promise<Obstacle[]> {
  try {
    const data = await AsyncStorage.getItem(OBSTACLE_KEY);
    if (data) return JSON.parse(data) as Obstacle[];
  } catch {}
  return generateObstacles();
}

export async function saveObstacles(obstacles: Obstacle[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OBSTACLE_KEY, JSON.stringify(obstacles));
  } catch (e) {
    console.log('[ObstacleManager] Error saving:', e);
  }
}

export function generateObstacles(): Obstacle[] {
  const rng = new SeededRandom(7777);
  const result: Obstacle[] = [];
  const center = 7;
  const clearRadius = 2;

  for (let row = 0; row < WorldConstants.gridSize; row++) {
    for (let col = 0; col < WorldConstants.gridSize; col++) {
      if (Math.abs(row - center) <= clearRadius && Math.abs(col - center) <= clearRadius) continue;
      if (!rng.nextBool(0.25)) continue;

      const roll = rng.next();
      let type: ObstacleType;
      if (roll < 0.18) type = ObstacleType.branch;
      else if (roll < 0.33) type = ObstacleType.smallRock;
      else if (roll < 0.48) type = ObstacleType.mushrooms;
      else if (roll < 0.68) type = ObstacleType.largeTree;
      else if (roll < 0.84) type = ObstacleType.boulder;
      else type = ObstacleType.deadTree;

      result.push({
        id: Crypto.randomUUID(),
        type,
        row,
        col,
        isClearing: false,
        clearingEndDate: null,
        isCleared: false,
      });
    }
  }
  return result;
}

export function findObstacle(obstacles: Obstacle[], row: number, col: number): Obstacle | undefined {
  return obstacles.find(o => o.row === row && o.col === col && !o.isCleared);
}

export function hasObstacle(obstacles: Obstacle[], row: number, col: number): boolean {
  return findObstacle(obstacles, row, col) !== undefined;
}

export function removeSmallObstacle(obstacles: Obstacle[], id: string): Obstacle[] {
  return obstacles.map(o => o.id === id ? { ...o, isCleared: true } : o);
}

export function startClearingObstacle(obstacles: Obstacle[], id: string): Obstacle[] {
  return obstacles.map(o => {
    if (o.id !== id) return o;
    return {
      ...o,
      isClearing: true,
      clearingEndDate: new Date(Date.now() + (o.type === ObstacleType.branch || o.type === ObstacleType.smallRock || o.type === ObstacleType.mushrooms ? 0 : OBSTACLE_CONFIG.largeRemovalTimeSeconds * 1000)).toISOString(),
    };
  });
}

export function checkObstacleCompletion(obstacles: Obstacle[]): Obstacle[] {
  const now = Date.now();
  let changed = false;
  const result = obstacles.map(o => {
    if (o.isClearing && o.clearingEndDate && new Date(o.clearingEndDate).getTime() <= now) {
      changed = true;
      return { ...o, isCleared: true, isClearing: false };
    }
    return o;
  });
  return changed ? result : obstacles;
}
