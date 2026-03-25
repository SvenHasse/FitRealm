// GameConfig.ts
// FitRealm - All game balance constants and configuration values.
// Ported 1:1 from GameConfig.swift

import { BuildingType, Building } from '../models/types';

// MARK: - ResourceCost
export interface ResourceCost {
  muskelmasse: number;
  protein: number;
  streakTokens: number;
  wood: number;
  stone: number;
  food: number;
}

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

// MARK: - Decay
export const Decay = {
  threshold1: 48 * 3600, // seconds
  threshold2: 72 * 3600,
  threshold3: 96 * 3600,

  productionMultiplier(lastWorkout: Date | null): number {
    if (!lastWorkout) return 1.0;
    const elapsed = (Date.now() - lastWorkout.getTime()) / 1000;
    if (elapsed < this.threshold1) return 1.0;
    if (elapsed < this.threshold2) return 0.5;
    if (elapsed < this.threshold3) return 0.25;
    return 0.0;
  },
};

// MARK: - Earn
export const Earn = {
  basePerMinute: 2.0,

  hrMultiplier(heartRate: number | null): number {
    if (heartRate == null) return 1.0;
    if (heartRate < 100) return 1.0;
    if (heartRate < 130) return 1.3;
    if (heartRate < 160) return 1.6;
    return 2.0;
  },

  stepsPerGram: 1000.0,
  maxStepBonus: 10.0,
  proteinMinHR: 150.0,
  proteinMinMinutes: 20.0,
};

// MARK: - Production
export const Production = {
  kornkammer: 10.0,
  proteinfarm: 1.0 / 24.0,
  holzfaeller: 20.0,
  steinbruch: 10.0,
  feld: 15.0,
  levelScale: 1.5,

  rate(base: number, level: number): number {
    return base * Math.pow(this.levelScale, level - 1);
  },
};

// MARK: - Storage
export const Storage = {
  kornkammer: 500.0,
  holzfaeller: 1000.0,
  steinbruch: 500.0,
  feld: 300.0,
  proteinfarm: 10.0,
  levelScale: 2.0,

  cap(base: number, level: number): number {
    return base * Math.pow(this.levelScale, level - 1);
  },
};

// MARK: - Global Storage Capacity (player inventory / wallet caps)
export interface StorageCapacity {
  muskelmasse: number;
  protein: number;
  wood: number;
  stone: number;
  food: number;
  streakTokens: number;
}

// Base storage caps — Muskelmasse and Protein are unlimited (earned through real sport)
export const BASE_STORAGE: StorageCapacity = {
  muskelmasse: Infinity, // never capped — earned through real sport
  protein:     Infinity, // never capped — too rare and valuable
  wood:        300,      // ~15h production at L1 Holzfäller
  stone:       200,      // ~20h production at L1 Steinbruch
  food:        250,      // ~30h production at L1 Feld
  streakTokens: Infinity,
};

// 🪵 Holzlager — Wood storage bonus per level
export const HOLZLAGER_STORAGE = [500, 1000, 2000, 4000, 8000];
// 🪨 Steinlager — Stone storage bonus per level
export const STEINLAGER_STORAGE = [400, 800, 1600, 3200, 6400];
// 🌾 Nahrungslager — Food storage bonus per level
export const NAHRUNGSLAGER_STORAGE = [450, 900, 1800, 3600, 7200];

// Helper: calculate total storage cap given current buildings
export function getTotalStorageCap(buildings: Building[]): StorageCapacity {
  const cap: StorageCapacity = { ...BASE_STORAGE };
  for (const b of buildings) {
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

// Helper: get the storage bonus array for a specific storage building type
export function getStorageBonusArray(type: BuildingType): number[] | null {
  switch (type) {
    case BuildingType.holzlager:    return HOLZLAGER_STORAGE;
    case BuildingType.steinlager:   return STEINLAGER_STORAGE;
    case BuildingType.nahrungslager: return NAHRUNGSLAGER_STORAGE;
    default: return null;
  }
}

// Helper: which resource does a storage building cap?
export function storageBuildingResource(type: BuildingType): 'wood' | 'stone' | 'food' | null {
  switch (type) {
    case BuildingType.holzlager:    return 'wood';
    case BuildingType.steinlager:   return 'stone';
    case BuildingType.nahrungslager: return 'food';
    default: return null;
  }
}

// MARK: - Build Costs
export function buildCost(type: BuildingType): ResourceCost {
  switch (type) {
    case BuildingType.rathaus:
      return createResourceCost();
    case BuildingType.kornkammer:
      return createResourceCost({ muskelmasse: 50, wood: 30 });
    case BuildingType.proteinfarm:
      return createResourceCost({ muskelmasse: 100, protein: 1 });
    case BuildingType.holzfaeller:
      return createResourceCost({ muskelmasse: 40 });
    case BuildingType.steinbruch:
      return createResourceCost({ muskelmasse: 80, wood: 20 });
    case BuildingType.feld:
      return createResourceCost({ muskelmasse: 30 });
    case BuildingType.holzlager:
      return createResourceCost({ muskelmasse: 40, wood: 20 });
    case BuildingType.steinlager:
      return createResourceCost({ muskelmasse: 60, wood: 30 });
    case BuildingType.nahrungslager:
      return createResourceCost({ muskelmasse: 30, wood: 15 });
    case BuildingType.kaserne:
      return createResourceCost({ muskelmasse: 120, wood: 40, stone: 10 });
    case BuildingType.tempel:
      return createResourceCost({ muskelmasse: 200, protein: 2, stone: 20 });
    case BuildingType.bibliothek:
      return createResourceCost({ muskelmasse: 300, wood: 30, stone: 15 });
    case BuildingType.marktplatz:
      return createResourceCost({ muskelmasse: 150, wood: 25, stone: 10 });
    case BuildingType.stammeshaus:
      return createResourceCost({ muskelmasse: 500, protein: 5, streakTokens: 10 });
  }
}

// MARK: - Upgrade Costs
export function upgradeCost(type: BuildingType, currentLevel: number): ResourceCost | null {
  if (currentLevel >= 5) return null;

  if (type === BuildingType.rathaus) {
    switch (currentLevel) {
      case 1: return createResourceCost({ muskelmasse: 500, protein: 5, streakTokens: 10 });
      case 2: return createResourceCost({ muskelmasse: 1000, protein: 10, streakTokens: 20 });
      case 3: return createResourceCost({ muskelmasse: 2000, protein: 20, streakTokens: 40 });
      case 4: return createResourceCost({ muskelmasse: 4000, protein: 40, streakTokens: 80 });
      default: return null;
    }
  }

  const s = currentLevel;

  switch (type) {
    case BuildingType.kornkammer:
      return createResourceCost({ muskelmasse: 100 * s, wood: Math.floor(10 * s) });
    case BuildingType.proteinfarm:
      return createResourceCost({ muskelmasse: 50 * s, protein: Math.floor(2 * s) });
    case BuildingType.holzfaeller:
      return createResourceCost({ muskelmasse: 80 * s });
    case BuildingType.steinbruch:
      return createResourceCost({ muskelmasse: 150 * s, wood: Math.floor(10 * s) });
    case BuildingType.feld:
      return createResourceCost({ muskelmasse: 60 * s, wood: Math.floor(5 * s) });
    case BuildingType.holzlager: {
      const holzCosts = [
        createResourceCost({ muskelmasse: 120, wood: 60 }),
        createResourceCost({ muskelmasse: 350, wood: 150 }),
        createResourceCost({ muskelmasse: 900, wood: 350 }),
        createResourceCost({ muskelmasse: 2200, wood: 800 }),
      ];
      return holzCosts[s - 1] ?? null;
    }
    case BuildingType.steinlager: {
      const steinCosts = [
        createResourceCost({ muskelmasse: 180, wood: 80 }),
        createResourceCost({ muskelmasse: 500, wood: 200 }),
        createResourceCost({ muskelmasse: 1200, wood: 450 }),
        createResourceCost({ muskelmasse: 3000, wood: 1000 }),
      ];
      return steinCosts[s - 1] ?? null;
    }
    case BuildingType.nahrungslager: {
      const nahrCosts = [
        createResourceCost({ muskelmasse: 100, wood: 50 }),
        createResourceCost({ muskelmasse: 300, wood: 120 }),
        createResourceCost({ muskelmasse: 750, wood: 300 }),
        createResourceCost({ muskelmasse: 1800, wood: 700 }),
      ];
      return nahrCosts[s - 1] ?? null;
    }
    case BuildingType.kaserne:
      return createResourceCost({ muskelmasse: 200 * s, wood: Math.floor(30 * s), stone: Math.floor(10 * s) });
    case BuildingType.tempel:
      return createResourceCost({ muskelmasse: 200 * s, protein: Math.floor(3 * s) });
    case BuildingType.bibliothek:
      return createResourceCost({ muskelmasse: 300 * s, wood: Math.floor(20 * s), stone: Math.floor(10 * s) });
    case BuildingType.marktplatz:
      return createResourceCost({ muskelmasse: 200 * s, wood: Math.floor(15 * s), stone: Math.floor(10 * s) });
    case BuildingType.stammeshaus:
      return createResourceCost({ muskelmasse: 400 * s, protein: Math.floor(5 * s), streakTokens: Math.floor(10 * s) });
    default:
      return null;
  }
}

// MARK: - Sell Value (50% of build + all upgrade costs paid so far)
export function sellValue(type: BuildingType, currentLevel: number): ResourceCost {
  const total = { ...buildCost(type) };
  // Add every upgrade cost from level 1 up to (currentLevel - 1)
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

// MARK: - Rathaus Requirements
export function rathausRequirement(type: BuildingType): number {
  switch (type) {
    case BuildingType.rathaus: return 1;
    case BuildingType.kornkammer: return 1;
    case BuildingType.holzfaeller: return 1;
    case BuildingType.feld: return 1;
    case BuildingType.holzlager: return 1;
    case BuildingType.nahrungslager: return 1;
    case BuildingType.steinbruch: return 2;
    case BuildingType.steinlager: return 2;
    case BuildingType.proteinfarm: return 2;
    case BuildingType.kaserne: return 2;
    case BuildingType.tempel: return 3;
    case BuildingType.bibliothek: return 3;
    case BuildingType.marktplatz: return 3;
    case BuildingType.stammeshaus: return 5;
  }
}

// MARK: - Unique Buildings
export const UNIQUE_BUILDINGS: Set<BuildingType> = new Set([
  BuildingType.rathaus,
  BuildingType.stammeshaus,
  BuildingType.marktplatz,
  BuildingType.bibliothek,
  BuildingType.tempel,
]);

// MARK: - Max Instances per Building Type
// Mehrfachbau: Feld ≤ 3, Holzfäller ≤ 2, all others ≤ 1
export function maxInstances(type: BuildingType): number {
  switch (type) {
    case BuildingType.feld:           return 3;
    case BuildingType.holzfaeller:    return 2;
    case BuildingType.holzlager:      return 2;
    case BuildingType.steinlager:     return 2;
    case BuildingType.nahrungslager:  return 2;
    default:                          return 1;
  }
}

// MARK: - Workers
export const Workers = {
  trainingCost: createResourceCost({ muskelmasse: 50, streakTokens: 1, food: 5 }),
  trainingTime: 30 * 60, // seconds
  upgradeCost: createResourceCost({ muskelmasse: 100, food: 10 }),

  collectionInterval(level: number): number {
    switch (level) {
      case 1: return 4 * 3600;
      case 2: return 2 * 3600;
      case 3: return 1 * 3600;
      default: return 4 * 3600;
    }
  },
};

// MARK: - Zones
export interface ZoneConfig {
  name: string;
  unlockCost: ResourceCost;
  rathausRequired: number;
  description: string;
  iconName: string; // Ionicons name
}

export const zones: ZoneConfig[] = [
  {
    name: 'Der Wald',
    unlockCost: createResourceCost({ muskelmasse: 50, wood: 5 }),
    rathausRequired: 1,
    description: 'A dense forest full of resources waiting to be gathered.',
    iconName: 'leaf',
  },
  {
    name: 'Die Berge',
    unlockCost: createResourceCost({ muskelmasse: 200, protein: 2 }),
    rathausRequired: 2,
    description: 'Rugged mountain terrain rich with stone and rare minerals.',
    iconName: 'triangle',
  },
  {
    name: 'Die Ruinen',
    unlockCost: createResourceCost({ protein: 5, streakTokens: 10 }),
    rathausRequired: 3,
    description: 'Ancient ruins hiding forgotten treasures and artefacts.',
    iconName: 'business',
  },
  {
    name: 'Der Sumpf',
    unlockCost: createResourceCost({ protein: 10 }),
    rathausRequired: 3,
    description: 'A murky swamp teeming with hidden dangers and rare finds.',
    iconName: 'water',
  },
  {
    name: 'Die Eiswüste',
    unlockCost: createResourceCost({ protein: 20, streakTokens: 20 }),
    rathausRequired: 4,
    description: 'A frozen wasteland that only the most dedicated athletes can endure.',
    iconName: 'snow',
  },
  {
    name: 'Der Gipfel',
    unlockCost: createResourceCost({ protein: 30 }),
    rathausRequired: 5,
    description: 'The ultimate summit — conquer it to prove your dominance.',
    iconName: 'arrow-up-circle',
  },
];

// MARK: - Exploration Timing
export const explorationDuration = 4 * 3600; // seconds
export const explorationProteinReward = 2;

// MARK: - World Constants
export const WorldConstants = {
  gridSize: 15,
  cellSize: 80,
  waterPadding: 160,
  get totalSize() { return this.gridSize * this.cellSize + 2 * this.waterPadding; },
};
