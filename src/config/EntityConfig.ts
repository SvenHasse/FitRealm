// EntityConfig.ts
// FitRealm — All configuration values for the Entity System (Animals, Eggs, Monsters, Waves, Defense).

import { AnimalType, AnimalRarity, MonsterType, MonsterTier } from '../models/types';

// ============================================
// TIER-KONFIGURATION
// ============================================

export interface AnimalConfig {
  type: AnimalType;
  name: string;
  emoji: string;
  rarity: AnimalRarity;
  buildingBonus: {
    targetBuilding: string;         // BuildingType das den Bonus bekommt
    bonusType: 'production' | 'storage' | 'speed' | 'global';
    bonusPercent: number;
  };
  defenseVP: number;                // Verteidigungspunkte wenn in Defense zugewiesen
  specialAbility: string | null;    // Beschreibung der Spezialfähigkeit
  flavorText: string;
}

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

// ============================================
// EI-KONFIGURATION
// ============================================

export interface EggHatchConfig {
  rarity: AnimalRarity;
  workoutsRequired: number;
  requiresConsecutive: boolean;
  requiresMinHRmax: number | null;  // Prozent, null = egal
}

export const EGG_HATCH_CONFIGS: Record<AnimalRarity, EggHatchConfig> = {
  common:    { rarity: 'common',    workoutsRequired: 3,  requiresConsecutive: false, requiresMinHRmax: null },
  uncommon:  { rarity: 'uncommon',  workoutsRequired: 5,  requiresConsecutive: false, requiresMinHRmax: null },
  rare:      { rarity: 'rare',      workoutsRequired: 7,  requiresConsecutive: true,  requiresMinHRmax: null },
  epic:      { rarity: 'epic',      workoutsRequired: 10, requiresConsecutive: false, requiresMinHRmax: 60 },
  legendary: { rarity: 'legendary', workoutsRequired: 14, requiresConsecutive: true,  requiresMinHRmax: 70 },
};

// ============================================
// MONSTER-KONFIGURATION
// ============================================

export interface MonsterConfig {
  type: MonsterType;
  name: string;
  emoji: string;
  tier: MonsterTier;
  requiredRathausLevel: number;
  baseAttackPower: [number, number];  // [min, max]
  baseHP: number;
  target: string;                     // MonsterTarget
  countRange: [number, number];       // [min, max] Anzahl pro Welle
  damageOnLoss: {
    effectType: 'productionStop' | 'resourceLoss' | 'disabled';
    durationHours: number;
    details: string;
  };
  lootTable: {
    resources: { min: number; max: number };  // Ressourcen-Menge
    eggChance: number;                        // 0-1 Wahrscheinlichkeit
    eggRarity: AnimalRarity | null;
    proteinChance: number;
    cosmeticChance: number;
  };
}

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

// ============================================
// WELLEN-KONFIGURATION
// ============================================

export const WAVE_CONFIG = {
  /** Basis-Intervall zwischen Wellen in Millisekunden (48-72h) */
  minIntervalMs: 48 * 60 * 60 * 1000,
  maxIntervalMs: 72 * 60 * 60 * 1000,

  /** Vorwarnzeit in Millisekunden (12-24h) */
  baseWarningMs: 12 * 60 * 60 * 1000,

  /** Basis-Schwierigkeit pro Rathaus-Level */
  difficultyPerRathausLevel: 50,

  /** Inaktivitäts-Multiplikatoren */
  inactivityMultipliers: {
    48:  1.2,   // +20%
    72:  1.4,   // +40%
    120: 1.8,   // +80%
  } as Record<number, number>,

  /** Zufällige Schwierigkeits-Variation */
  difficultyVariation: 0.15,  // ±15%

  /** Blutwelle alle X Tage (stärker, bessere Drops) */
  bloodWaveIntervalDays: 7,
  bloodWaveMultiplier: 1.5,

  /** Boss-Event Intervall in Tagen */
  bossEventIntervalDays: 14,
};

// ============================================
// VERTEIDIGUNGS-KONFIGURATION
// ============================================

export const DEFENSE_CONFIG = {
  /** VP pro Gebäude-Level */
  buildingVP: {
    rathaus: 10,
    kaserne: 15,
    wachturm: 20,
    mauer: 30,
  } as Record<string, number>,

  /** Workout-VP */
  vpPerWorkoutMinute: 2,
  vpPerIntenseMinute: 4,        // ≥70% HRmax (~140bpm)
  streakBonusPerDay: 0.05,      // 5% pro Streak-Tag

  /** Worker-VP */
  vpPerWorker: 15,

  /** Wachturm Vorwarnzeit-Bonus pro Level (in ms) */
  watchtowerWarningPerLevel: 3 * 60 * 60 * 1000,  // +3h pro Level (L1=+3h bis L5=+15h)

  /** Mauer HP pro Level */
  wallHPPerLevel: [0, 50, 100, 150, 225, 300],  // Index = Level

  /** Ergebnis-Schwellenwerte */
  perfectThreshold: 1.5,   // VP ≥ 1.5× AK
  defendedThreshold: 1.0,  // VP ≥ AK
  partialThreshold: 0.5,   // VP ≥ 0.5× AK
};

// ============================================
// STALL-KONFIGURATION
// ============================================

export const STALL_CONFIG = {
  slotsPerLevel: [0, 1, 2, 3, 4, 5],  // Index = Level
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
