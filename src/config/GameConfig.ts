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
    if (b.level < 1) continue; // Skip buildings still under initial construction
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

// MARK: - Sell Value (50% of build + all upgrade costs paid so far)
// NOTE: buildCost() and upgradeCost() are defined after BUILDINGS table below.
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
    // Available from start (Rathaus L1)
    case BuildingType.rathaus:       return 1;
    case BuildingType.holzfaeller:   return 1;
    case BuildingType.feld:          return 1;
    case BuildingType.kornkammer:    return 1;
    case BuildingType.holzlager:     return 1;
    case BuildingType.nahrungslager: return 1;
    // Rathaus L2
    case BuildingType.kaserne:       return 2;
    case BuildingType.steinbruch:    return 2;
    case BuildingType.steinlager:    return 2;
    // Rathaus L3 — mid-game
    case BuildingType.tempel:        return 3;
    case BuildingType.bibliothek:    return 3;
    case BuildingType.marktplatz:    return 3;
    // Rathaus L4
    case BuildingType.proteinfarm:   return 4;
    // Rathaus L5 — endgame
    case BuildingType.stammeshaus:   return 5;
    // Rathaus L2 — Stall
    case BuildingType.stall:         return 1;
    // Phase 5: Wachturm und Mauer freigeschaltet
    case BuildingType.wachturm:      return 2;
    case BuildingType.mauer:         return 3;
    default:                         return 1;
  }
}

// MARK: - Unique Buildings
export const UNIQUE_BUILDINGS: Set<BuildingType> = new Set([
  BuildingType.rathaus,
  BuildingType.stammeshaus,
  BuildingType.marktplatz,
  BuildingType.bibliothek,
  BuildingType.tempel,
  BuildingType.stall,
  BuildingType.wachturm,
  BuildingType.mauer,
]);

// MARK: - Progressive Multi-Build Unlock (per Rathaus level)
// Each index = required Rathaus level to unlock that instance
// index 0 = 1st instance, index 1 = 2nd instance, index 2 = 3rd instance
export const MULTI_BUILD_UNLOCK: Partial<Record<BuildingType, number[]>> = {
  holzfaeller:   [1, 3],      // 1st free, 2nd at Rathaus L3
  feld:          [1, 2, 4],   // 1st free, 2nd at L2, 3rd at L4
  steinbruch:    [2, 4],      // 1st at L2, 2nd at L4
  proteinfarm:   [4, 5],      // 1st at L4, 2nd at L5
  kornkammer:    [1],         // only 1× ever
  holzlager:     [1, 3],      // 1st free, 2nd at L3
  nahrungslager: [1, 3],      // 1st free, 2nd at L3
  steinlager:    [2, 4],      // 1st at L2, 2nd at L4
};

// Returns how many instances of this building type the player may currently build
export function allowedInstances(type: BuildingType, rathausLevel: number): number {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (!unlocks) {
    // Default: 1 instance when rathausRequired is met, 0 otherwise
    return rathausLevel >= rathausRequirement(type) ? 1 : 0;
  }
  return unlocks.filter(req => rathausLevel >= req).length;
}

// Returns the Rathaus level required to unlock the NEXT instance (for UI hints)
export function nextInstanceUnlockLevel(type: BuildingType, currentInstances: number): number | null {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (!unlocks || currentInstances >= unlocks.length) return null;
  return unlocks[currentInstances];
}

// Total maximum instances ever possible (at max Rathaus)
export function maxInstances(type: BuildingType): number {
  const unlocks = MULTI_BUILD_UNLOCK[type];
  if (unlocks) return unlocks.length;
  return 1;
}

// MARK: - Construction Time (derived from BUILDINGS table)
/** Construction time in seconds for a building at a given target level */
export function constructionTime(type: BuildingType, targetLevel: number): number {
  const levelCfg = BUILDINGS[type]?.levels.find(l => l.level === targetLevel);
  if (!levelCfg) return 0;
  return levelCfg.buildTimeMinutes * 60; // convert minutes → seconds
}

/** Protein cost to instantly complete construction */
export function skipConstructionCost(_type: BuildingType, _targetLevel: number): number {
  return 1;
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

// ════════════════════════════════════════════════════════════════════════════
// GAME CONFIG v2 — Table-driven building and game data
// ────────────────────────────────────────────────────────────────────────────
// All user-facing strings are i18n keys — never hardcoded text.
// Uses 'buildingConfig.*' namespace so existing flat 'buildings.*' keys keep working.
// Stufe 2 (vor Release): Diese Werte aus Supabase laden.
// ════════════════════════════════════════════════════════════════════════════

/** Resource cost using German-named optional fields (distinct from ResourceCost) */
export interface BuildingCost {
  muskelmasse?: number;
  holz?: number;
  nahrung?: number;
  stein?: number;
  protein?: number;
  streakTokens?: number;
}

export interface BuildingLevelConfig {
  level: number;
  /** null = starter building (rathaus L1, costs nothing) */
  upgradeCost: BuildingCost | null;
  buildTimeMinutes: number;
  /** buildings first unlocked when rathaus reaches this level (rathaus only) */
  unlocks?: BuildingType[];
  /** rounded hourly output for production buildings */
  productionPerHour?: number;
  /** building-internal storage cap (production bldgs) or storage bonus added to inventory (lager bldgs) */
  maxStorage?: number;
  /** max workers allowed at this kaserne level */
  maxWorkers?: number;
  /** i18n key for the level-specific effect description */
  effectKey?: string;
}

export interface BuildingConfig {
  maxInstances: number;
  nameKey: string;        // e.g. 'buildingConfig.rathaus.name'
  descriptionKey: string; // e.g. 'buildingConfig.rathaus.description'
  levels: BuildingLevelConfig[];
}

// ─── BUILDINGS ───────────────────────────────────────────────────────────────
// upgradeCost at level 1 = initial build cost; level N = upgrade from N-1→N.
// All numeric values taken from existing GameConfig functions (code is authoritative).
export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  rathaus: {
    maxInstances: 1,
    nameKey: 'buildingConfig.rathaus.name',
    descriptionKey: 'buildingConfig.rathaus.description',
    levels: [
      { level: 1, upgradeCost: null, buildTimeMinutes: 2,
        unlocks: [BuildingType.holzfaeller, BuildingType.feld, BuildingType.kornkammer,
                  BuildingType.holzlager, BuildingType.nahrungslager, BuildingType.stall] },
      { level: 2, upgradeCost: { muskelmasse: 500, protein: 5 }, buildTimeMinutes: 5,
        unlocks: [BuildingType.kaserne, BuildingType.steinbruch, BuildingType.steinlager, BuildingType.wachturm],
        effectKey: 'buildingConfig.rathaus.levels.2.effect' },
      { level: 3, upgradeCost: { muskelmasse: 1000, protein: 10 }, buildTimeMinutes: 10,
        unlocks: [BuildingType.tempel, BuildingType.bibliothek, BuildingType.marktplatz, BuildingType.mauer],
        effectKey: 'buildingConfig.rathaus.levels.3.effect' },
      { level: 4, upgradeCost: { muskelmasse: 2000, protein: 20 }, buildTimeMinutes: 20,
        unlocks: [BuildingType.proteinfarm],
        effectKey: 'buildingConfig.rathaus.levels.4.effect' },
      { level: 5, upgradeCost: { muskelmasse: 4000, protein: 40 }, buildTimeMinutes: 40,
        unlocks: [BuildingType.stammeshaus],
        effectKey: 'buildingConfig.rathaus.levels.5.effect' },
    ],
  },

  holzfaeller: {
    maxInstances: 2,
    nameKey: 'buildingConfig.holzfaeller.name',
    descriptionKey: 'buildingConfig.holzfaeller.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 40 },         buildTimeMinutes: 1,  productionPerHour: 20,    maxStorage: 1000 },
      { level: 2, upgradeCost: { muskelmasse: 80 },         buildTimeMinutes: 2,  productionPerHour: 30,    maxStorage: 2000 },
      { level: 3, upgradeCost: { muskelmasse: 160 },        buildTimeMinutes: 4,  productionPerHour: 45,    maxStorage: 4000 },
      { level: 4, upgradeCost: { muskelmasse: 240 },        buildTimeMinutes: 8,  productionPerHour: 67.5,  maxStorage: 8000 },
      { level: 5, upgradeCost: { muskelmasse: 320 },        buildTimeMinutes: 16, productionPerHour: 101.3, maxStorage: 16000 },
    ],
  },

  kornkammer: {
    maxInstances: 1,
    nameKey: 'buildingConfig.kornkammer.name',
    descriptionKey: 'buildingConfig.kornkammer.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 50, holz: 30 },  buildTimeMinutes: 1,  productionPerHour: 10,   maxStorage: 500 },
      { level: 2, upgradeCost: { muskelmasse: 100, holz: 10 }, buildTimeMinutes: 2,  productionPerHour: 15,   maxStorage: 1000 },
      { level: 3, upgradeCost: { muskelmasse: 200, holz: 20 }, buildTimeMinutes: 4,  productionPerHour: 22.5, maxStorage: 2000 },
      { level: 4, upgradeCost: { muskelmasse: 300, holz: 30 }, buildTimeMinutes: 8,  productionPerHour: 33.8, maxStorage: 4000 },
      { level: 5, upgradeCost: { muskelmasse: 400, holz: 40 }, buildTimeMinutes: 16, productionPerHour: 50.6, maxStorage: 8000 },
    ],
  },

  steinbruch: {
    maxInstances: 2,
    nameKey: 'buildingConfig.steinbruch.name',
    descriptionKey: 'buildingConfig.steinbruch.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 80, holz: 20 },  buildTimeMinutes: 1.5, productionPerHour: 10,   maxStorage: 500 },
      { level: 2, upgradeCost: { muskelmasse: 150, holz: 10 }, buildTimeMinutes: 3,   productionPerHour: 15,   maxStorage: 1000 },
      { level: 3, upgradeCost: { muskelmasse: 300, holz: 20 }, buildTimeMinutes: 6,   productionPerHour: 22.5, maxStorage: 2000 },
      { level: 4, upgradeCost: { muskelmasse: 450, holz: 30 }, buildTimeMinutes: 12,  productionPerHour: 33.8, maxStorage: 4000 },
      { level: 5, upgradeCost: { muskelmasse: 600, holz: 40 }, buildTimeMinutes: 24,  productionPerHour: 50.6, maxStorage: 8000 },
    ],
  },

  proteinfarm: {
    maxInstances: 2,
    nameKey: 'buildingConfig.proteinfarm.name',
    descriptionKey: 'buildingConfig.proteinfarm.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 100, protein: 1 }, buildTimeMinutes: 2,  productionPerHour: 0.042, maxStorage: 10 },
      { level: 2, upgradeCost: { muskelmasse: 50, protein: 2 },  buildTimeMinutes: 4,  productionPerHour: 0.063, maxStorage: 20 },
      { level: 3, upgradeCost: { muskelmasse: 100, protein: 4 }, buildTimeMinutes: 8,  productionPerHour: 0.094, maxStorage: 40 },
      { level: 4, upgradeCost: { muskelmasse: 150, protein: 6 }, buildTimeMinutes: 16, productionPerHour: 0.141, maxStorage: 80 },
      { level: 5, upgradeCost: { muskelmasse: 200, protein: 8 }, buildTimeMinutes: 32, productionPerHour: 0.211, maxStorage: 160 },
    ],
  },

  feld: {
    maxInstances: 3,
    nameKey: 'buildingConfig.feld.name',
    descriptionKey: 'buildingConfig.feld.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 30 },               buildTimeMinutes: 1,  productionPerHour: 15,   maxStorage: 300 },
      { level: 2, upgradeCost: { muskelmasse: 60, holz: 5 },      buildTimeMinutes: 2,  productionPerHour: 22.5, maxStorage: 600 },
      { level: 3, upgradeCost: { muskelmasse: 120, holz: 10 },    buildTimeMinutes: 4,  productionPerHour: 33.8, maxStorage: 1200 },
      { level: 4, upgradeCost: { muskelmasse: 180, holz: 15 },    buildTimeMinutes: 8,  productionPerHour: 50.6, maxStorage: 2400 },
      { level: 5, upgradeCost: { muskelmasse: 240, holz: 20 },    buildTimeMinutes: 16, productionPerHour: 75.9, maxStorage: 4800 },
    ],
  },

  holzlager: {
    maxInstances: 2,
    nameKey: 'buildingConfig.holzlager.name',
    descriptionKey: 'buildingConfig.holzlager.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 40, holz: 20 },    buildTimeMinutes: 1,  maxStorage: 500 },
      { level: 2, upgradeCost: { muskelmasse: 120, holz: 60 },   buildTimeMinutes: 2,  maxStorage: 1000 },
      { level: 3, upgradeCost: { muskelmasse: 350, holz: 150 },  buildTimeMinutes: 4,  maxStorage: 2000 },
      { level: 4, upgradeCost: { muskelmasse: 900, holz: 350 },  buildTimeMinutes: 8,  maxStorage: 4000 },
      { level: 5, upgradeCost: { muskelmasse: 2200, holz: 800 }, buildTimeMinutes: 16, maxStorage: 8000 },
    ],
  },

  steinlager: {
    maxInstances: 2,
    nameKey: 'buildingConfig.steinlager.name',
    descriptionKey: 'buildingConfig.steinlager.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 60, holz: 30 },     buildTimeMinutes: 1.5, maxStorage: 400 },
      { level: 2, upgradeCost: { muskelmasse: 180, holz: 80 },    buildTimeMinutes: 3,   maxStorage: 800 },
      { level: 3, upgradeCost: { muskelmasse: 500, holz: 200 },   buildTimeMinutes: 6,   maxStorage: 1600 },
      { level: 4, upgradeCost: { muskelmasse: 1200, holz: 450 },  buildTimeMinutes: 12,  maxStorage: 3200 },
      { level: 5, upgradeCost: { muskelmasse: 3000, holz: 1000 }, buildTimeMinutes: 24,  maxStorage: 6400 },
    ],
  },

  nahrungslager: {
    maxInstances: 2,
    nameKey: 'buildingConfig.nahrungslager.name',
    descriptionKey: 'buildingConfig.nahrungslager.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 30, holz: 15 },    buildTimeMinutes: 1,  maxStorage: 450 },
      { level: 2, upgradeCost: { muskelmasse: 100, holz: 50 },   buildTimeMinutes: 2,  maxStorage: 900 },
      { level: 3, upgradeCost: { muskelmasse: 300, holz: 120 },  buildTimeMinutes: 4,  maxStorage: 1800 },
      { level: 4, upgradeCost: { muskelmasse: 750, holz: 300 },  buildTimeMinutes: 8,  maxStorage: 3600 },
      { level: 5, upgradeCost: { muskelmasse: 1800, holz: 700 }, buildTimeMinutes: 16, maxStorage: 7200 },
    ],
  },

  kaserne: {
    maxInstances: 1,
    nameKey: 'buildingConfig.kaserne.name',
    descriptionKey: 'buildingConfig.kaserne.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 120, holz: 40, stein: 10 },  buildTimeMinutes: 2,  maxWorkers: 1, effectKey: 'buildingConfig.kaserne.levels.1.effect' },
      { level: 2, upgradeCost: { muskelmasse: 200, holz: 30, stein: 10 },  buildTimeMinutes: 4,  maxWorkers: 2, effectKey: 'buildingConfig.kaserne.levels.2.effect' },
      { level: 3, upgradeCost: { muskelmasse: 400, holz: 60, stein: 20 },  buildTimeMinutes: 8,  maxWorkers: 3, effectKey: 'buildingConfig.kaserne.levels.3.effect' },
      { level: 4, upgradeCost: { muskelmasse: 600, holz: 90, stein: 30 },  buildTimeMinutes: 16, maxWorkers: 4, effectKey: 'buildingConfig.kaserne.levels.4.effect' },
      { level: 5, upgradeCost: { muskelmasse: 800, holz: 120, stein: 40 }, buildTimeMinutes: 32, maxWorkers: 5, effectKey: 'buildingConfig.kaserne.levels.5.effect' },
    ],
  },

  tempel: {
    maxInstances: 1,
    nameKey: 'buildingConfig.tempel.name',
    descriptionKey: 'buildingConfig.tempel.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 200, protein: 2, stein: 20 }, buildTimeMinutes: 5,  effectKey: 'buildingConfig.tempel.levels.1.effect' },
      { level: 2, upgradeCost: { muskelmasse: 200, protein: 3 },            buildTimeMinutes: 10, effectKey: 'buildingConfig.tempel.levels.2.effect' },
      { level: 3, upgradeCost: { muskelmasse: 400, protein: 6 },            buildTimeMinutes: 20, effectKey: 'buildingConfig.tempel.levels.3.effect' },
      { level: 4, upgradeCost: { muskelmasse: 600, protein: 9 },            buildTimeMinutes: 40, effectKey: 'buildingConfig.tempel.levels.4.effect' },
      { level: 5, upgradeCost: { muskelmasse: 800, protein: 12 },           buildTimeMinutes: 80, effectKey: 'buildingConfig.tempel.levels.5.effect' },
    ],
  },

  bibliothek: {
    maxInstances: 1,
    nameKey: 'buildingConfig.bibliothek.name',
    descriptionKey: 'buildingConfig.bibliothek.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 300, holz: 30, stein: 15 },  buildTimeMinutes: 5 },
      { level: 2, upgradeCost: { muskelmasse: 300, holz: 20, stein: 10 },  buildTimeMinutes: 10 },
      { level: 3, upgradeCost: { muskelmasse: 600, holz: 40, stein: 20 },  buildTimeMinutes: 20 },
      { level: 4, upgradeCost: { muskelmasse: 900, holz: 60, stein: 30 },  buildTimeMinutes: 40 },
      { level: 5, upgradeCost: { muskelmasse: 1200, holz: 80, stein: 40 }, buildTimeMinutes: 80 },
    ],
  },

  marktplatz: {
    maxInstances: 1,
    nameKey: 'buildingConfig.marktplatz.name',
    descriptionKey: 'buildingConfig.marktplatz.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 150, holz: 25, stein: 10 }, buildTimeMinutes: 4 },
      { level: 2, upgradeCost: { muskelmasse: 200, holz: 15, stein: 10 }, buildTimeMinutes: 8 },
      { level: 3, upgradeCost: { muskelmasse: 400, holz: 30, stein: 20 }, buildTimeMinutes: 16 },
      { level: 4, upgradeCost: { muskelmasse: 600, holz: 45, stein: 30 }, buildTimeMinutes: 32 },
      { level: 5, upgradeCost: { muskelmasse: 800, holz: 60, stein: 40 }, buildTimeMinutes: 64 },
    ],
  },

  stammeshaus: {
    maxInstances: 1,
    nameKey: 'buildingConfig.stammeshaus.name',
    descriptionKey: 'buildingConfig.stammeshaus.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 500, protein: 5, streakTokens: 10 },  buildTimeMinutes: 10 },
      { level: 2, upgradeCost: { muskelmasse: 400, protein: 5, streakTokens: 10 },  buildTimeMinutes: 20 },
      { level: 3, upgradeCost: { muskelmasse: 800, protein: 10, streakTokens: 20 }, buildTimeMinutes: 40 },
      { level: 4, upgradeCost: { muskelmasse: 1200, protein: 15, streakTokens: 30 }, buildTimeMinutes: 80 },
      { level: 5, upgradeCost: { muskelmasse: 1600, protein: 20, streakTokens: 40 }, buildTimeMinutes: 160 },
    ],
  },

  stall: {
    maxInstances: 1,
    nameKey: 'buildingConfig.stall.name',
    descriptionKey: 'buildingConfig.stall.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 30, holz: 15 },   buildTimeMinutes: 10 },
      { level: 2, upgradeCost: { muskelmasse: 60, holz: 30 },   buildTimeMinutes: 30 },
      { level: 3, upgradeCost: { muskelmasse: 120, holz: 60 },  buildTimeMinutes: 60 },
      { level: 4, upgradeCost: { muskelmasse: 200, holz: 100 }, buildTimeMinutes: 90 },
      { level: 5, upgradeCost: { muskelmasse: 350, holz: 175 }, buildTimeMinutes: 120 },
    ],
  },

  wachturm: {
    maxInstances: 1,
    nameKey: 'buildingConfig.wachturm.name',
    descriptionKey: 'buildingConfig.wachturm.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 150, stein: 30 },  buildTimeMinutes: 20 },
      { level: 2, upgradeCost: { muskelmasse: 150, holz: 75 },   buildTimeMinutes: 45 },
      { level: 3, upgradeCost: { muskelmasse: 250, holz: 125 },  buildTimeMinutes: 90 },
      { level: 4, upgradeCost: { muskelmasse: 400, holz: 200 },  buildTimeMinutes: 180 },
      { level: 5, upgradeCost: { muskelmasse: 600, holz: 300 },  buildTimeMinutes: 240 },
    ],
  },

  mauer: {
    maxInstances: 1,
    nameKey: 'buildingConfig.mauer.name',
    descriptionKey: 'buildingConfig.mauer.description',
    levels: [
      { level: 1, upgradeCost: { muskelmasse: 100, stein: 50 },  buildTimeMinutes: 30 },
      { level: 2, upgradeCost: { muskelmasse: 200, holz: 120 },  buildTimeMinutes: 60 },
      { level: 3, upgradeCost: { muskelmasse: 350, holz: 200 },  buildTimeMinutes: 120 },
      { level: 4, upgradeCost: { muskelmasse: 550, holz: 300 },  buildTimeMinutes: 240 },
      { level: 5, upgradeCost: { muskelmasse: 800, holz: 450 },  buildTimeMinutes: 360 },
    ],
  },
};

// ─── WORKER CONFIG ────────────────────────────────────────────────────────────
// Source of truth: Workers object above + GameEngine worker capacity check.
export const WORKER_CONFIG = {
  trainingCost: { muskelmasse: 50, nahrung: 5, streakTokens: 1 },
  upgradeCost: { muskelmasse: 100, nahrung: 10 },
  trainingTimeMinutes: 30,
  /** Passive food drain per worker per hour */
  nahrungVerbrauchProStundeProWorker: 1,
  collectionIntervals: [
    { level: 1, intervalMinutes: 240 },
    { level: 2, intervalMinutes: 120 },
    { level: 3, intervalMinutes: 60 },
  ],
} as const;

// ─── DECAY CONFIG ─────────────────────────────────────────────────────────────
// Must match gameStateDecayMultiplier() in types.ts and Decay.productionMultiplier() above.
export const DECAY_CONFIG = {
  resetAfterHours: 48,
  thresholds: [
    { hoursWithoutWorkout: 48, productionMultiplier: 0.50 },
    { hoursWithoutWorkout: 72, productionMultiplier: 0.25 },
    { hoursWithoutWorkout: 96, productionMultiplier: 0.00 },
  ],
} as const;

// ─── STREAK CONFIG ────────────────────────────────────────────────────────────
// Reward numeric values must match STREAK_MILESTONES in streakUtils.ts.
export const STREAK_CONFIG = {
  resetAfterHours: 48,
  milestones: [
    { days: 3,   emoji: '🌱', nameKey: 'streak.milestones.3.name',   rewardDescKey: 'streak.milestones.3.reward',   reward: { muskelmasse: 50,  holz: 100 } },
    { days: 7,   emoji: '🔥', nameKey: 'streak.milestones.7.name',   rewardDescKey: 'streak.milestones.7.reward',   reward: { protein: 3, streakShield: true } },
    { days: 14,  emoji: '💪', nameKey: 'streak.milestones.14.name',  rewardDescKey: 'streak.milestones.14.reward',  reward: { muskelmasse: 100, holz: 200, kalorienBoost7d: true } },
    { days: 21,  emoji: '⚡', nameKey: 'streak.milestones.21.name',  rewardDescKey: 'streak.milestones.21.reward',  reward: { protein: 5, holz: 300, profileFrame: 'Eisenkrieger' } },
    { days: 30,  emoji: '🏅', nameKey: 'streak.milestones.30.name',  rewardDescKey: 'streak.milestones.30.reward',  reward: { muskelmasse: 200, protein: 5, holz: 500, productionBoost7d: true } },
    { days: 50,  emoji: '💎', nameKey: 'streak.milestones.50.name',  rewardDescKey: 'streak.milestones.50.reward',  reward: { protein: 10, holz: 1000, permanentKalorienBonus: true } },
    { days: 100, emoji: '🏆', nameKey: 'streak.milestones.100.name', rewardDescKey: 'streak.milestones.100.reward', reward: { protein: 20, holz: 2000, skin: 'Titan', permanentMuskelmasse: true } },
    { days: 365, emoji: '👑', nameKey: 'streak.milestones.365.name', rewardDescKey: 'streak.milestones.365.reward', reward: { protein: 50, allSkins: true, permanentProduction: true } },
  ],
} as const;

// ─── EXPLORATION ZONES ───────────────────────────────────────────────────────
// timerHours and reward are fixed constants from explorationDuration / explorationProteinReward.
export const EXPLORATION_ZONES = [
  { id: 1, nameKey: 'zones.1.name', requiredRathausLevel: 1, cost: { muskelmasse: 50, holz: 5 },         timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 2, nameKey: 'zones.2.name', requiredRathausLevel: 2, cost: { muskelmasse: 200, protein: 2 },      timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 3, nameKey: 'zones.3.name', requiredRathausLevel: 3, cost: { protein: 5, streakTokens: 10 },      timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 4, nameKey: 'zones.4.name', requiredRathausLevel: 3, cost: { protein: 10 },                       timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 5, nameKey: 'zones.5.name', requiredRathausLevel: 4, cost: { protein: 20, streakTokens: 20 },     timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 6, nameKey: 'zones.6.name', requiredRathausLevel: 5, cost: { protein: 30 },                       timerHours: 4, reward: { protein: explorationProteinReward } },
] as const;

// ─── MARKTPLATZ CONFIG ────────────────────────────────────────────────────────
// Exchange rates: 1 Muskelmasse = base unit; others priced relative to it.
export const MARKTPLATZ_CONFIG = {
  rates: { muskelmasse: 1, holz: 0.5, nahrung: 0.625, stein: 0.5 },
  dailyLimitByLevel: [0, 200, 350, 500, 1000, 1500],
} as const;

// ─── ADJACENCY BONUSES ────────────────────────────────────────────────────────
export const ADJACENCY_BONUSES = [
  { buildings: ['holzfaeller', 'holzlager'],  bonusKey: 'adjacency.holzfaeller_holzlager',  bonusPercent: 15 },
  { buildings: ['kaserne', 'tempel'],         bonusKey: 'adjacency.kaserne_tempel',          bonusPercent: 10 },
  { buildings: ['bibliothek'],                bonusKey: 'adjacency.bibliothek_any',           bonusPercent: 5  },
  { buildings: ['feld', 'kornkammer'],        bonusKey: 'adjacency.feld_kornkammer',          bonusPercent: 10 },
  { buildings: ['steinbruch', 'steinlager'],  bonusKey: 'adjacency.steinbruch_steinlager',    bonusPercent: 10 },
] as const;

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function getBuildingLevelConfig(type: BuildingType, level: number): BuildingLevelConfig | undefined {
  return BUILDINGS[type]?.levels.find(l => l.level === level);
}

export function getBuildingUpgradeCost(type: BuildingType, targetLevel: number): BuildingCost | null {
  return getBuildingLevelConfig(type, targetLevel)?.upgradeCost ?? null;
}

export function getBuildingMaxInstances(type: BuildingType): number {
  return BUILDINGS[type]?.maxInstances ?? 1;
}

export function getDecayMultiplier(hoursSinceLastWorkout: number): number {
  const threshold = [...DECAY_CONFIG.thresholds]
    .reverse()
    .find(t => hoursSinceLastWorkout >= t.hoursWithoutWorkout);
  return threshold?.productionMultiplier ?? 1.0;
}

// ─── EXPLORATION REWARD RANGES ───────────────────────────────────────────────
// Random reward ranges for claimExplorationReward() in GameEngine.
export const EXPLORATION_REWARD_RANGES = {
  muskelmasse: { min: 50, randomRange: 150 },   // 50 + random * 150
  wood:        { min: 20, randomRange: 60 },     // 20 + random * 60
  stone:       { min: 5,  randomRange: 25 },     // 5  + random * 25
} as const;

// ─── INTENSIVE WORKOUT TRACKER ───────────────────────────────────────────────
// Windows and thresholds for unlocking Spähfalke / Mystischer Hirsch.
export const INTENSIVE_TRACKER = {
  weekWindowMs:       7 * 24 * 60 * 60 * 1000,
  biweekWindowMs:     14 * 24 * 60 * 60 * 1000,
  weeklyThreshold:    5,   // 5× ≥70% HRmax in 7 days  → Spähfalke
  biweeklyThreshold:  10,  // 10× ≥70% HRmax in 14 days → Mystischer Hirsch
} as const;

// ─── STREAK ENGINE REWARDS ───────────────────────────────────────────────────
// Streak-token / protein amounts granted directly by GameEngine on milestone.
export const STREAK_ENGINE_REWARDS: Record<number, { streakTokens?: number; protein?: number }> = {
  3:  { streakTokens: 2 },
  7:  { streakTokens: 5, protein: 3 },
};

// ─── BOSS WAVE SCALING ───────────────────────────────────────────────────────
export const BOSS_SCALING = {
  base: 3,
  perRathausLevel: 0.5,
  extraWarningHours: 12,
} as const;

// ─── WAVE TIER CHANCES ───────────────────────────────────────────────────────
// Probability of higher tiers appearing when rathaus level qualifies.
export const WAVE_TIER_CHANCES = {
  tier3: 0.30,
  tier4: 0.20,
  tier5: 0.10,
} as const;

// ─── WAVE WARNING BONUSES ────────────────────────────────────────────────────
// Extra warning time for Wachturm levels and Spähfalke.
export const WAVE_WARNING_BONUSES = {
  watchtowerHoursPerLevel: 3,
  scoutFalconHours: 6,
} as const;

// ─── STREAK COUNTDOWN THRESHOLDS ─────────────────────────────────────────────
// UI thresholds for the streak countdown display (safe / warning / danger).
export const STREAK_COUNTDOWN_THRESHOLDS = {
  safeAboveMs:    24 * 3_600_000,
  warningAboveMs: 12 * 3_600_000,
} as const;

// ─── WALL HP ─────────────────────────────────────────────────────────────────
// HP per Mauer level (also in DEFENSE_CONFIG in EntityConfig, kept in sync).
export const WALL_HP_PER_LEVEL = 50;

// ─── WALL REPAIR ─────────────────────────────────────────────────────────────
export const WALL_REPAIR_COST_FACTOR = 20;

// ─── OBSTACLE CONFIG ─────────────────────────────────────────────────────────
export const OBSTACLE_CONFIG = {
  smallRemovalCost: 15,       // Muskelmasse to remove a small obstacle
  largeRemovalTimeSeconds: 30 * 60,  // 30 minutes
} as const;

// ════════════════════════════════════════════════════════════════════════════
// DERIVED v1 FUNCTIONS — read from BUILDINGS table (single source of truth)
// ════════════════════════════════════════════════════════════════════════════

/** Convert BuildingCost (German optional fields) → ResourceCost (English required fields) */
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
