// GameConfigHelpers.ts
// All lookup functions that access GameConfig data.
// GameConfig.ts itself imports NOTHING from this file.

import { BuildingType, Building } from '../models/types';
import {
  ResourceCost, BuildingCost, BuildingLevelConfig, StorageCapacity,
  BUILDINGS, UNIQUE_BUILDINGS, MULTI_BUILD_UNLOCK,
  BASE_STORAGE, HOLZLAGER_STORAGE, STEINLAGER_STORAGE, NAHRUNGSLAGER_STORAGE,
  DECAY_CONFIG, Decay, Earn, Production, Storage, WORKER_CONFIG,
} from './GameConfig';

// ─── ResourceCost creation ──────────────────────────────────────────────────

export function createResourceCost(partial: Partial<ResourceCost> = {}): ResourceCost {
  return {
    muskelmasse: partial.muskelmasse ?? 0,
    protein: partial.protein ?? 0,
    streakTokens: partial.streakTokens ?? 0,
    wood: partial.wood ?? 0,
    stone: partial.stone ?? 0,
    food: partial.food ?? 0,
  };
}

// ─── BuildingCost → ResourceCost conversion ─────────────────────────────────

function buildingCostToResourceCost(bc: BuildingCost | null | undefined): ResourceCost {
  if (!bc) return createResourceCost();
  return createResourceCost({
    muskelmasse:  bc.muskelmasse ?? 0,
    protein:      bc.protein ?? 0,
    streakTokens: bc.streakTokens ?? 0,
    wood:         bc.holz ?? 0,
    stone:        bc.stein ?? 0,
    food:         bc.nahrung ?? 0,
  });
}

// ─── Building level helpers ─────────────────────────────────────────────────

export function getBuildingLevelConfig(type: BuildingType, level: number): BuildingLevelConfig | undefined {
  return BUILDINGS[type]?.levels.find(l => l.level === level);
}

export function getBuildingUpgradeCost(type: BuildingType, targetLevel: number): BuildingCost | null {
  return getBuildingLevelConfig(type, targetLevel)?.upgradeCost ?? null;
}

export function getBuildingMaxInstances(type: BuildingType): number {
  return BUILDINGS[type]?.maxInstances ?? 1;
}

/** Build cost = BUILDINGS[type].levels[0].upgradeCost (level 1 = initial placement) */
export function buildCost(type: BuildingType): ResourceCost {
  const cfg = BUILDINGS[type];
  if (!cfg || cfg.levels.length === 0) return createResourceCost();
  return buildingCostToResourceCost(cfg.levels[0].upgradeCost);
}

/** Upgrade cost from currentLevel → currentLevel+1, read from BUILDINGS table */
export function upgradeCost(type: BuildingType, currentLevel: number): ResourceCost | null {
  if (currentLevel >= 5) return null;
  const targetLevel = currentLevel + 1;
  const levelCfg = BUILDINGS[type]?.levels.find(l => l.level === targetLevel);
  if (!levelCfg?.upgradeCost) return null;
  return buildingCostToResourceCost(levelCfg.upgradeCost);
}

/** Construction time in seconds for a building at a given target level */
export function constructionTime(type: BuildingType, targetLevel: number): number {
  const levelCfg = BUILDINGS[type]?.levels.find(l => l.level === targetLevel);
  if (!levelCfg) return 0;
  return levelCfg.buildTimeMinutes * 60;
}

/** Protein cost to instantly complete construction */
export function skipConstructionCost(_type: BuildingType, _targetLevel: number): number {
  return 1;
}

/** Sell value = 50% of build + all upgrade costs paid so far */
export function sellValue(type: BuildingType, currentLevel: number): ResourceCost {
  const total = { ...buildCost(type) };
  for (let lvl = 1; lvl < currentLevel; lvl++) {
    const up = upgradeCost(type, lvl);
    if (up) {
      total.muskelmasse  += up.muskelmasse;
      total.protein      += up.protein;
      total.wood         += up.wood;
      total.stone        += up.stone;
      total.food         += up.food;
      total.streakTokens += up.streakTokens;
    }
  }
  return {
    muskelmasse:  Math.floor(total.muskelmasse  * 0.5),
    protein:      Math.floor(total.protein      * 0.5),
    wood:         Math.floor(total.wood          * 0.5),
    stone:        Math.floor(total.stone         * 0.5),
    food:         Math.floor(total.food          * 0.5),
    streakTokens: Math.floor(total.streakTokens * 0.5),
  };
}

// ─── Rathaus & instance helpers ─────────────────────────────────────────────

export function rathausRequirement(type: BuildingType): number {
  switch (type) {
    case BuildingType.rathaus:       return 1;
    case BuildingType.holzfaeller:   return 1;
    case BuildingType.feld:          return 1;

    case BuildingType.holzlager:     return 1;
    case BuildingType.nahrungslager: return 1;
    case BuildingType.stall:         return 1;
    case BuildingType.kaserne:       return 2;
    case BuildingType.steinbruch:    return 2;
    case BuildingType.steinlager:    return 2;
    case BuildingType.wachturm:      return 2;
    case BuildingType.tempel:        return 3;
    case BuildingType.bibliothek:    return 3;
    case BuildingType.marktplatz:    return 3;
    case BuildingType.mauer:         return 3;
    case BuildingType.proteinfarm:   return 4;
    case BuildingType.stammeshaus:   return 5;
    default:                         return 1;
  }
}

export function allowedInstances(type: BuildingType, rathausLevel: number): number {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (!unlocks) {
    return rathausLevel >= rathausRequirement(type) ? 1 : 0;
  }
  return unlocks.filter(req => rathausLevel >= req).length;
}

export function nextInstanceUnlockLevel(type: BuildingType, currentInstances: number): number | null {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (!unlocks || currentInstances >= unlocks.length) return null;
  return unlocks[currentInstances];
}

export function maxInstances(type: BuildingType): number {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (unlocks) return unlocks.length;
  return 1;
}

// ─── Storage helpers ────────────────────────────────────────────────────────

export function getTotalStorageCap(buildings: Building[]): StorageCapacity {
  const cap: StorageCapacity = { ...BASE_STORAGE };
  for (const b of buildings) {
    if (b.level < 1) continue;
    if (b.type === BuildingType.holzlager) {
      cap.wood  += HOLZLAGER_STORAGE[Math.min(b.level - 1, HOLZLAGER_STORAGE.length - 1)];
    } else if (b.type === BuildingType.steinlager) {
      cap.stone += STEINLAGER_STORAGE[Math.min(b.level - 1, STEINLAGER_STORAGE.length - 1)];
    } else if (b.type === BuildingType.nahrungslager) {
      cap.food  += NAHRUNGSLAGER_STORAGE[Math.min(b.level - 1, NAHRUNGSLAGER_STORAGE.length - 1)];
    }
  }
  return cap;
}

export function getStorageBonusArray(type: BuildingType): number[] | null {
  switch (type) {
    case BuildingType.holzlager:    return HOLZLAGER_STORAGE;
    case BuildingType.steinlager:   return STEINLAGER_STORAGE;
    case BuildingType.nahrungslager: return NAHRUNGSLAGER_STORAGE;
    default: return null;
  }
}

export function storageBuildingResource(type: BuildingType): 'wood' | 'stone' | 'food' | null {
  switch (type) {
    case BuildingType.holzlager:    return 'wood';
    case BuildingType.steinlager:   return 'stone';
    case BuildingType.nahrungslager: return 'food';
    default: return null;
  }
}

// ─── Decay helpers ──────────────────────────────────────────────────────────

export function getDecayMultiplier(hoursSinceLastWorkout: number): number {
  const threshold = [...DECAY_CONFIG.thresholds]
    .reverse()
    .find(t => hoursSinceLastWorkout >= t.hoursWithoutWorkout);
  return threshold?.productionMultiplier ?? 1.0;
}

/** @deprecated Use getDecayMultiplier instead */
export function decayProductionMultiplier(lastWorkout: Date | null): number {
  if (!lastWorkout) return 1.0;
  const elapsed = (Date.now() - lastWorkout.getTime()) / 1000;
  if (elapsed < Decay.threshold1) return 1.0;
  if (elapsed < Decay.threshold2) return 0.5;
  if (elapsed < Decay.threshold3) return 0.25;
  return 0.0;
}

// ─── Earn helpers (deprecated — superseded by PP system) ────────────────────

/** @deprecated HR intensity is now folded into PP focus weights */
export function earnHrMultiplier(heartRate: number | null): number {
  if (heartRate == null) return 1.0;
  if (heartRate < 100) return 1.0;
  if (heartRate < 130) return 1.3;
  if (heartRate < 160) return 1.6;
  return 2.0;
}

// ─── Production / Storage rate helpers (legacy v1) ──────────────────────────

export function productionRate(base: number, level: number): number {
  return base * Math.pow(Production.levelScale, level - 1);
}

export function storageCap(base: number, level: number): number {
  return base * Math.pow(Storage.levelScale, level - 1);
}

// ─── Worker helpers ─────────────────────────────────────────────────────────

export function workerCollectionInterval(level: number): number {
  const entry = WORKER_CONFIG.collectionIntervals.find(e => e.level === level);
  return entry ? entry.intervalSeconds : 4 * 3600;
}

/** Backward-compat Workers object — use WORKER_CONFIG for data access */
export const Workers = {
  trainingCost: WORKER_CONFIG.trainingCost as ResourceCost,
  trainingTime: WORKER_CONFIG.trainingTimeSeconds,
  upgradeCost: WORKER_CONFIG.upgradeCost as ResourceCost,
  collectionInterval(level: number): number {
    return workerCollectionInterval(level);
  },
};
