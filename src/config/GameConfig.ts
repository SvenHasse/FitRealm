// GameConfig.ts
// FitRealm — All game balance constants and configuration values.
// PURE DATA ONLY. No functions, no logic, no .find(), no .filter().
// All helper functions live in GameConfigHelpers.ts.

import {
  BuildingType,
  AnimalType, AnimalRarity, MonsterType, MonsterTier,
} from '../models/types';

// ════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════════════════

export interface ResourceCost {
  muskelmasse: number;
  protein: number;
  streakTokens: number;
  wood: number;
  stone: number;
  food: number;
}

export interface StorageCapacity {
  muskelmasse: number;
  protein: number;
  wood: number;
  stone: number;
  food: number;
  streakTokens: number;
}

export interface ZoneConfig {
  name: string;
  unlockCost: ResourceCost;
  rathausRequired: number;
  description: string;
  iconName: string;
}

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
  upgradeCost: BuildingCost | null;
  buildTimeMinutes: number;
  unlocks?: BuildingType[];
  productionPerHour?: number;
  maxStorage?: number;
  maxWorkers?: number;
  effectKey?: string;
}

export interface BuildingConfig {
  maxInstances: number;
  nameKey: string;
  descriptionKey: string;
  levels: BuildingLevelConfig[];
}

export interface AnimalConfig {
  type: AnimalType;
  name: string;
  emoji: string;
  rarity: AnimalRarity;
  buildingBonus: {
    targetBuilding: string;
    bonusType: 'production' | 'storage' | 'speed' | 'global';
    bonusPercent: number;
  };
  defenseVP: number;
  specialAbility: string | null;
  flavorText: string;
}

export interface EggHatchConfig {
  rarity: AnimalRarity;
  workoutsRequired: number;
  requiresConsecutive: boolean;
  requiresMinHRmax: number | null;
}

export interface MonsterConfig {
  type: MonsterType;
  name: string;
  emoji: string;
  tier: MonsterTier;
  requiredRathausLevel: number;
  baseAttackPower: [number, number];
  baseHP: number;
  target: string;
  countRange: [number, number];
  damageOnLoss: {
    effectType: 'productionStop' | 'resourceLoss' | 'disabled';
    durationHours: number;
    details: string;
  };
  lootTable: {
    resources: { min: number; max: number };
    eggChance: number;
    eggRarity: AnimalRarity | null;
    proteinChance: number;
    cosmeticChance: number;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// DECAY
// ════════════════════════════════════════════════════════════════════════════

export const Decay = {
  threshold1: 48 * 3600,
  threshold2: 72 * 3600,
  threshold3: 96 * 3600,
} as const;

export const DECAY_CONFIG = {
  resetAfterHours: 48,
  thresholds: [
    { hoursWithoutWorkout: 48, productionMultiplier: 0.50 },
    { hoursWithoutWorkout: 72, productionMultiplier: 0.25 },
    { hoursWithoutWorkout: 96, productionMultiplier: 0.00 },
  ],
} as const;

// ════════════════════════════════════════════════════════════════════════════
// EARN (deprecated — superseded by Progress Point system in progressPoints.ts)
// ════════════════════════════════════════════════════════════════════════════

export const Earn = {
  /** @deprecated Use PP_REWARDS.muskelmassePerPP instead */
  basePerMinute: 2.0,
  /** @deprecated Replaced by DAILY_TARGETS.steps in progressPoints.ts */
  stepsPerGram: 1000.0,
  /** @deprecated Replaced by PP steps metric */
  maxStepBonus: 10.0,
  /** @deprecated Replaced by PP_REWARDS.proteinThreshold */
  proteinMinHR: 150.0,
  /** @deprecated Replaced by PP_REWARDS.proteinThreshold */
  proteinMinMinutes: 20.0,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// PRODUCTION & STORAGE (legacy v1 base rates)
// ════════════════════════════════════════════════════════════════════════════

export const Production = {
  kornkammer: 10.0,
  proteinfarm: 1.0 / 24.0,
  holzfaeller: 20.0,
  steinbruch: 10.0,
  feld: 15.0,
  levelScale: 1.5,
} as const;

export const Storage = {
  kornkammer: 500.0,
  holzfaeller: 1000.0,
  steinbruch: 500.0,
  feld: 300.0,
  proteinfarm: 10.0,
  levelScale: 2.0,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL STORAGE CAPS
// ════════════════════════════════════════════════════════════════════════════

export const BASE_STORAGE: StorageCapacity = {
  muskelmasse: Infinity,
  protein:     Infinity,
  wood:        300,
  stone:       200,
  food:        250,
  streakTokens: Infinity,
};

export const HOLZLAGER_STORAGE = [500, 1000, 2000, 4000, 8000];
export const STEINLAGER_STORAGE = [400, 800, 1600, 3200, 6400];
export const NAHRUNGSLAGER_STORAGE = [450, 900, 1800, 3600, 7200];

// ════════════════════════════════════════════════════════════════════════════
// UNIQUE BUILDINGS & MULTI-BUILD UNLOCK
// ════════════════════════════════════════════════════════════════════════════

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

export const MULTI_BUILD_UNLOCK: Partial<Record<BuildingType, number[]>> = {
  holzfaeller:   [1, 3],
  feld:          [1, 2, 4],
  steinbruch:    [2, 4],
  proteinfarm:   [4, 5],
  kornkammer:    [1],
  holzlager:     [1, 3],
  nahrungslager: [1, 3],
  steinlager:    [2, 4],
};

// ════════════════════════════════════════════════════════════════════════════
// ZONES
// ════════════════════════════════════════════════════════════════════════════

export const zones: ZoneConfig[] = [
  {
    name: 'Der Wald',
    unlockCost: { muskelmasse: 50, protein: 0, streakTokens: 0, wood: 5, stone: 0, food: 0 },
    rathausRequired: 1,
    description: 'A dense forest full of resources waiting to be gathered.',
    iconName: 'leaf',
  },
  {
    name: 'Die Berge',
    unlockCost: { muskelmasse: 200, protein: 2, streakTokens: 0, wood: 0, stone: 0, food: 0 },
    rathausRequired: 2,
    description: 'Rugged mountain terrain rich with stone and rare minerals.',
    iconName: 'triangle',
  },
  {
    name: 'Die Ruinen',
    unlockCost: { muskelmasse: 0, protein: 5, streakTokens: 10, wood: 0, stone: 0, food: 0 },
    rathausRequired: 3,
    description: 'Ancient ruins hiding forgotten treasures and artefacts.',
    iconName: 'business',
  },
  {
    name: 'Der Sumpf',
    unlockCost: { muskelmasse: 0, protein: 10, streakTokens: 0, wood: 0, stone: 0, food: 0 },
    rathausRequired: 3,
    description: 'A murky swamp teeming with hidden dangers and rare finds.',
    iconName: 'water',
  },
  {
    name: 'Die Eiswüste',
    unlockCost: { muskelmasse: 0, protein: 20, streakTokens: 20, wood: 0, stone: 0, food: 0 },
    rathausRequired: 4,
    description: 'A frozen wasteland that only the most dedicated athletes can endure.',
    iconName: 'snow',
  },
  {
    name: 'Der Gipfel',
    unlockCost: { muskelmasse: 0, protein: 30, streakTokens: 0, wood: 0, stone: 0, food: 0 },
    rathausRequired: 5,
    description: 'The ultimate summit — conquer it to prove your dominance.',
    iconName: 'arrow-up-circle',
  },
];

export const explorationDuration = 4 * 3600; // seconds
export const explorationProteinReward = 2;

// ════════════════════════════════════════════════════════════════════════════
// WORLD CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

export const WorldConstants = {
  gridSize: 15,
  cellSize: 80,
  waterPadding: 160,
  totalSize: 15 * 80 + 2 * 160, // 1520
} as const;

// ════════════════════════════════════════════════════════════════════════════
// BUILDINGS TABLE (v2 — single source of truth)
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// WORKER CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const WORKER_CONFIG = {
  trainingCost: { muskelmasse: 50, protein: 0, streakTokens: 1, wood: 0, stone: 0, food: 5 },
  upgradeCost: { muskelmasse: 100, protein: 0, streakTokens: 0, wood: 0, stone: 0, food: 10 },
  trainingTimeSeconds: 30 * 60,
  nahrungVerbrauchProStundeProWorker: 1,
  collectionIntervals: [
    { level: 1, intervalSeconds: 4 * 3600 },
    { level: 2, intervalSeconds: 2 * 3600 },
    { level: 3, intervalSeconds: 1 * 3600 },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// STREAK CONFIG
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// EXPLORATION ZONES (v2)
// ════════════════════════════════════════════════════════════════════════════

export const EXPLORATION_ZONES = [
  { id: 1, nameKey: 'zones.1.name', requiredRathausLevel: 1, cost: { muskelmasse: 50, holz: 5 },         timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 2, nameKey: 'zones.2.name', requiredRathausLevel: 2, cost: { muskelmasse: 200, protein: 2 },      timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 3, nameKey: 'zones.3.name', requiredRathausLevel: 3, cost: { protein: 5, streakTokens: 10 },      timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 4, nameKey: 'zones.4.name', requiredRathausLevel: 3, cost: { protein: 10 },                       timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 5, nameKey: 'zones.5.name', requiredRathausLevel: 4, cost: { protein: 20, streakTokens: 20 },     timerHours: 4, reward: { protein: explorationProteinReward } },
  { id: 6, nameKey: 'zones.6.name', requiredRathausLevel: 5, cost: { protein: 30 },                       timerHours: 4, reward: { protein: explorationProteinReward } },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// MARKTPLATZ CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const MARKTPLATZ_CONFIG = {
  rates: { muskelmasse: 1, holz: 0.5, nahrung: 0.625, stein: 0.5 },
  dailyLimitByLevel: [0, 200, 350, 500, 1000, 1500],
} as const;

// ════════════════════════════════════════════════════════════════════════════
// ADJACENCY BONUSES
// ════════════════════════════════════════════════════════════════════════════

export const ADJACENCY_BONUSES = [
  { buildings: ['holzfaeller', 'holzlager'],  bonusKey: 'adjacency.holzfaeller_holzlager',  bonusPercent: 15 },
  { buildings: ['kaserne', 'tempel'],         bonusKey: 'adjacency.kaserne_tempel',          bonusPercent: 10 },
  { buildings: ['bibliothek'],                bonusKey: 'adjacency.bibliothek_any',           bonusPercent: 5  },
  { buildings: ['feld', 'kornkammer'],        bonusKey: 'adjacency.feld_kornkammer',          bonusPercent: 10 },
  { buildings: ['steinbruch', 'steinlager'],  bonusKey: 'adjacency.steinbruch_steinlager',    bonusPercent: 10 },
] as const;

// ════════════════════════════════════════════════════════════════════════════
// EXPLORATION REWARD RANGES
// ════════════════════════════════════════════════════════════════════════════

export const EXPLORATION_REWARD_RANGES = {
  muskelmasse: { min: 50, randomRange: 150 },
  wood:        { min: 20, randomRange: 60 },
  stone:       { min: 5,  randomRange: 25 },
} as const;

// ════════════════════════════════════════════════════════════════════════════
// INTENSIVE WORKOUT TRACKER
// ════════════════════════════════════════════════════════════════════════════

export const INTENSIVE_TRACKER = {
  weekWindowMs:       7 * 24 * 60 * 60 * 1000,
  biweekWindowMs:     14 * 24 * 60 * 60 * 1000,
  weeklyThreshold:    5,
  biweeklyThreshold:  10,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// STREAK ENGINE REWARDS
// ════════════════════════════════════════════════════════════════════════════

export const STREAK_ENGINE_REWARDS: Record<number, { streakTokens?: number; protein?: number }> = {
  3:  { streakTokens: 2 },
  7:  { streakTokens: 5, protein: 3 },
};

// ════════════════════════════════════════════════════════════════════════════
// BOSS WAVE SCALING
// ════════════════════════════════════════════════════════════════════════════

export const BOSS_SCALING = {
  base: 3,
  perRathausLevel: 0.5,
  extraWarningHours: 12,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// WAVE TIER CHANCES
// ════════════════════════════════════════════════════════════════════════════

export const WAVE_TIER_CHANCES = {
  tier3: 0.30,
  tier4: 0.20,
  tier5: 0.10,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// WAVE WARNING BONUSES
// ════════════════════════════════════════════════════════════════════════════

export const WAVE_WARNING_BONUSES = {
  watchtowerHoursPerLevel: 3,
  scoutFalconHours: 6,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// STREAK COUNTDOWN THRESHOLDS
// ════════════════════════════════════════════════════════════════════════════

export const STREAK_COUNTDOWN_THRESHOLDS = {
  safeAboveMs:    24 * 3_600_000,
  warningAboveMs: 12 * 3_600_000,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// WALL
// ════════════════════════════════════════════════════════════════════════════

export const WALL_HP_PER_LEVEL = 50;
export const WALL_REPAIR_COST_FACTOR = 20;

// ════════════════════════════════════════════════════════════════════════════
// OBSTACLE CONFIG
// ════════════════════════════════════════════════════════════════════════════

export const OBSTACLE_CONFIG = {
  smallRemovalCost: 15,
  largeRemovalTimeSeconds: 30 * 60,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// ANIMAL CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const ANIMAL_CONFIGS: Record<AnimalType, AnimalConfig> = {
  erntehuhn: {
    type: 'erntehuhn',
    name: 'Erntehuhn',
    emoji: '🐔',
    rarity: 'common',
    buildingBonus: { targetBuilding: 'feld', bonusType: 'production', bonusPercent: 8 },
    defenseVP: 0,
    specialAbility: null,
    flavorText: 'Pickt eifrig die Körner auf, die neben dem Feld liegen. Unermüdlich und ein bisschen dumm.',
  },
  lastesel: {
    type: 'lastesel',
    name: 'Lastesel',
    emoji: '🫏',
    rarity: 'common',
    buildingBonus: { targetBuilding: 'lager', bonusType: 'storage', bonusPercent: 12 },
    defenseVP: 0,
    specialAbility: null,
    flavorText: 'Trägt geduldig alles, was man ihm auflädt. Beschwert sich nie — zumindest nicht hörbar.',
  },
  holzbaer: {
    type: 'holzbaer',
    name: 'Holzbär',
    emoji: '🐻',
    rarity: 'uncommon',
    buildingBonus: { targetBuilding: 'holzfaeller', bonusType: 'production', bonusPercent: 15 },
    defenseVP: 20,
    specialAbility: null,
    flavorText: 'Reißt mit seinen Pranken ganze Baumstämme aus der Erde. Erstaunlich sanftmütig — solange man ihn füttert.',
  },
  spaehfalke: {
    type: 'spaehfalke',
    name: 'Spähfalke',
    emoji: '🦅',
    rarity: 'uncommon',
    buildingBonus: { targetBuilding: 'wachturm', bonusType: 'production', bonusPercent: 0 },
    defenseVP: 10,
    specialAbility: 'Frühwarnung +6h, Angreifer -10% Angriffskraft',
    flavorText: 'Kreist hoch über dem Dorf und sieht alles. Sein durchdringender Schrei warnt vor nahender Gefahr.',
  },
  steinbock: {
    type: 'steinbock',
    name: 'Steinbock',
    emoji: '🐐',
    rarity: 'rare',
    buildingBonus: { targetBuilding: 'steinbruch', bonusType: 'production', bonusPercent: 15 },
    defenseVP: 15,
    specialAbility: 'Mauer hält +20% mehr aus',
    flavorText: 'Klettert auf Felsen, die kein Mensch besteigen könnte. Sein Fell ist so hart wie der Stein selbst.',
  },
  mystischerHirsch: {
    type: 'mystischerHirsch',
    name: 'Mystischer Hirsch',
    emoji: '🦌',
    rarity: 'rare',
    buildingBonus: { targetBuilding: 'tempel', bonusType: 'production', bonusPercent: 10 },
    defenseVP: 25,
    specialAbility: 'Heilaura: Repariert 5% Gebäudeschaden nach Angriff',
    flavorText: 'Sein Geweih leuchtet in der Dämmerung silbern. Wo er steht, wächst das Gras schneller.',
  },
  kriegswolf: {
    type: 'kriegswolf',
    name: 'Kriegswolf',
    emoji: '🐺',
    rarity: 'epic',
    buildingBonus: { targetBuilding: 'kaserne', bonusType: 'speed', bonusPercent: 20 },
    defenseVP: 40,
    specialAbility: 'Rudel-Taktik: Alle Tiere in Verteidigung +10% VP',
    flavorText: 'Seine gelben Augen mustern jeden Fremden. Er folgt nur dem Stärksten — und das bist du.',
  },
  gluecksphoenixt: {
    type: 'gluecksphoenixt',
    name: 'Glücksphönix',
    emoji: '🔥',
    rarity: 'epic',
    buildingBonus: { targetBuilding: 'bibliothek', bonusType: 'production', bonusPercent: 20 },
    defenseVP: 30,
    specialAbility: 'Wiedergeburt: 1× pro Welle ein zerstörtes Gebäude sofort repariert',
    flavorText: 'Aus der Asche geboren, in Flammen getaucht. Sein Feuer zerstört nicht — es erneuert.',
  },
  uralterDrache: {
    type: 'uralterDrache',
    name: 'Uralter Drache',
    emoji: '🐲',
    rarity: 'legendary',
    buildingBonus: { targetBuilding: '*', bonusType: 'global', bonusPercent: 25 },
    defenseVP: 100,
    specialAbility: 'Drachenatem: Vernichtet 30% der Monsterwelle sofort',
    flavorText: 'Die Legenden sprachen von ihm. Jahrhunderte schlief er unter dem Berg. Dein Kampfgeist hat ihn geweckt.',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// EGG HATCH CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const EGG_HATCH_CONFIGS: Record<AnimalRarity, EggHatchConfig> = {
  common:    { rarity: 'common',    workoutsRequired: 3,  requiresConsecutive: false, requiresMinHRmax: null },
  uncommon:  { rarity: 'uncommon',  workoutsRequired: 5,  requiresConsecutive: false, requiresMinHRmax: null },
  rare:      { rarity: 'rare',      workoutsRequired: 7,  requiresConsecutive: true,  requiresMinHRmax: null },
  epic:      { rarity: 'epic',      workoutsRequired: 10, requiresConsecutive: false, requiresMinHRmax: 60 },
  legendary: { rarity: 'legendary', workoutsRequired: 14, requiresConsecutive: true,  requiresMinHRmax: 70 },
};

// ════════════════════════════════════════════════════════════════════════════
// MONSTER CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  sumpfgoblin: {
    type: 'sumpfgoblin', name: 'Sumpfgoblin', emoji: '👺', tier: 1,
    requiredRathausLevel: 1,
    baseAttackPower: [10, 20], baseHP: 30,
    target: 'fields', countRange: [3, 6],
    damageOnLoss: { effectType: 'productionStop', durationHours: 4, details: '-15% Nahrungsproduktion' },
    lootTable: { resources: { min: 20, max: 50 }, eggChance: 0.05, eggRarity: 'common', proteinChance: 0, cosmeticChance: 0 },
  },
  schattenratte: {
    type: 'schattenratte', name: 'Schattenratte', emoji: '🐀', tier: 1,
    requiredRathausLevel: 1,
    baseAttackPower: [5, 10], baseHP: 15,
    target: 'storage', countRange: [1, 3],
    damageOnLoss: { effectType: 'resourceLoss', durationHours: 0, details: '5-10% der gelagerten Ressourcen' },
    lootTable: { resources: { min: 10, max: 30 }, eggChance: 0, eggRarity: null, proteinChance: 0, cosmeticChance: 0 },
  },
  skelettkrieger: {
    type: 'skelettkrieger', name: 'Skelettkrieger', emoji: '💀', tier: 2,
    requiredRathausLevel: 2,
    baseAttackPower: [25, 40], baseHP: 60,
    target: 'production', countRange: [2, 4],
    damageOnLoss: { effectType: 'productionStop', durationHours: 6, details: 'Gebäude stoppt Produktion' },
    lootTable: { resources: { min: 40, max: 80 }, eggChance: 0.10, eggRarity: 'uncommon', proteinChance: 0, cosmeticChance: 0 },
  },
  giftwurm: {
    type: 'giftwurm', name: 'Giftwurm', emoji: '🪱', tier: 2,
    requiredRathausLevel: 2,
    baseAttackPower: [15, 25], baseHP: 40,
    target: 'fields', countRange: [2, 4],
    damageOnLoss: { effectType: 'productionStop', durationHours: 8, details: 'Alle Felder -50% Produktion' },
    lootTable: { resources: { min: 30, max: 60 }, eggChance: 0.05, eggRarity: 'uncommon', proteinChance: 0, cosmeticChance: 0 },
  },
  dunkelork: {
    type: 'dunkelork', name: 'Dunkelork', emoji: '👹', tier: 3,
    requiredRathausLevel: 3,
    baseAttackPower: [50, 80], baseHP: 120,
    target: 'production', countRange: [2, 3],
    damageOnLoss: { effectType: 'productionStop', durationHours: 8, details: '2 Gebäude stoppen + Ressourcenverlust' },
    lootTable: { resources: { min: 80, max: 150 }, eggChance: 0.15, eggRarity: 'rare', proteinChance: 0.10, cosmeticChance: 0.05 },
  },
  nebelgeist: {
    type: 'nebelgeist', name: 'Nebelgeist', emoji: '👻', tier: 3,
    requiredRathausLevel: 3,
    baseAttackPower: [30, 30], baseHP: 80,
    target: 'magic', countRange: [1, 2],
    damageOnLoss: { effectType: 'disabled', durationHours: 12, details: 'Gebäude deaktiviert, Tempel kann reinigen (4h)' },
    lootTable: { resources: { min: 50, max: 100 }, eggChance: 0.10, eggRarity: 'rare', proteinChance: 0.20, cosmeticChance: 0 },
  },
  frostdrache: {
    type: 'frostdrache', name: 'Frostdrache', emoji: '🐉', tier: 4,
    requiredRathausLevel: 4,
    baseAttackPower: [100, 150], baseHP: 250,
    target: 'all', countRange: [1, 1],
    damageOnLoss: { effectType: 'productionStop', durationHours: 4, details: 'Globaler Produktionsstopp' },
    lootTable: { resources: { min: 150, max: 300 }, eggChance: 0.20, eggRarity: 'epic', proteinChance: 0.30, cosmeticChance: 0.10 },
  },
  schattenmagier: {
    type: 'schattenmagier', name: 'Schattenmagier', emoji: '🧙', tier: 4,
    requiredRathausLevel: 4,
    baseAttackPower: [80, 120], baseHP: 180,
    target: 'protein', countRange: [1, 1],
    damageOnLoss: { effectType: 'resourceLoss', durationHours: 12, details: '2-5 Protein + Proteinfarm stoppt' },
    lootTable: { resources: { min: 100, max: 200 }, eggChance: 0.15, eggRarity: 'epic', proteinChance: 0.40, cosmeticChance: 0.10 },
  },
  uralterGolem: {
    type: 'uralterGolem', name: 'Uralter Golem', emoji: '🗿', tier: 5,
    requiredRathausLevel: 5,
    baseAttackPower: [300, 300], baseHP: 800,
    target: 'rathaus', countRange: [1, 1],
    damageOnLoss: { effectType: 'disabled', durationHours: 24, details: 'Rathaus deaktiviert' },
    lootTable: { resources: { min: 500, max: 800 }, eggChance: 1.0, eggRarity: 'epic', proteinChance: 0.50, cosmeticChance: 0.30 },
  },
  verderbnisHydra: {
    type: 'verderbnisHydra', name: 'Verderbnis-Hydra', emoji: '🐍', tier: 5,
    requiredRathausLevel: 5,
    baseAttackPower: [120, 120], baseHP: 600,
    target: 'all', countRange: [1, 1],
    damageOnLoss: { effectType: 'productionStop', durationHours: 12, details: 'Alle Ressourcen-Typen -50%' },
    lootTable: { resources: { min: 600, max: 1000 }, eggChance: 1.0, eggRarity: 'legendary', proteinChance: 0.80, cosmeticChance: 0.50 },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// WAVE CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const WAVE_CONFIG = {
  minIntervalMs: 48 * 60 * 60 * 1000,
  maxIntervalMs: 72 * 60 * 60 * 1000,
  baseWarningMs: 12 * 60 * 60 * 1000,
  difficultyPerRathausLevel: 50,
  inactivityMultipliers: {
    48:  1.2,
    72:  1.4,
    120: 1.8,
  } as Record<number, number>,
  difficultyVariation: 0.15,
  bloodWaveIntervalDays: 7,
  bloodWaveMultiplier: 1.5,
  bossEventIntervalDays: 14,
};

// ════════════════════════════════════════════════════════════════════════════
// DEFENSE CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const DEFENSE_CONFIG = {
  buildingVP: {
    rathaus: 10,
    kaserne: 15,
    wachturm: 20,
    mauer: 30,
  } as Record<string, number>,
  vpPerWorkoutMinute: 2,
  vpPerIntenseMinute: 4,
  streakBonusPerDay: 0.05,
  vpPerWorker: 15,
  watchtowerWarningPerLevel: 3 * 60 * 60 * 1000,
  wallHPPerLevel: [0, 50, 100, 150, 225, 300],
  perfectThreshold: 1.5,
  defendedThreshold: 1.0,
  partialThreshold: 0.5,
};

// ════════════════════════════════════════════════════════════════════════════
// STALL CONFIG (moved from EntityConfig.ts)
// ════════════════════════════════════════════════════════════════════════════

export const STALL_CONFIG = {
  slotsPerLevel: [0, 1, 2, 3, 4, 5],
  buildTimeMinutes: [0, 10, 30, 60, 90, 120],
  costs: {
    1: { muskelmasse: 30,  holz: 15 },
    2: { muskelmasse: 60,  holz: 30 },
    3: { muskelmasse: 120, holz: 60 },
    4: { muskelmasse: 200, holz: 100 },
    5: { muskelmasse: 350, holz: 175 },
  } as Record<number, Record<string, number>>,
  adjacencyBonus: {
    targetBuilding: 'feld',
    bonusPercent: 10,
    description: 'Neben Feld → Tiere produzieren +10% Nahrung passiv',
  },
};
