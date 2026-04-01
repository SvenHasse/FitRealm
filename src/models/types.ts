// types.ts
// FitRealm - Data models for workouts, health snapshots, goals, and the full game state.
// Ported 1:1 from Models.swift

// MARK: - WorkoutRecord
export interface WorkoutRecord {
  id: string; // UUID string (used to deduplicate)
  workoutType: string; // e.g. "Running", "Cycling"
  date: string; // ISO date string
  durationMinutes: number;
  caloriesBurned: number;
  averageHeartRate: number | null;
  vitacoinsEarned: number;
}

// Icon name based on workout type (Expo Vector Icons - Ionicons)
export function workoutIconName(workoutType: string): string {
  switch (workoutType.toLowerCase()) {
    case 'running': return 'walk';
    case 'cycling': return 'bicycle';
    case 'swimming': return 'water';
    case 'hiit': return 'flash';
    case 'functional strength training':
    case 'strength training': return 'barbell';
    case 'yoga': return 'body';
    case 'walking': return 'walk';
    case 'hiking': return 'trail-sign';
    case 'dance': return 'musical-notes';
    case 'pilates': return 'body';
    case 'rowing': return 'boat';
    case 'elliptical': return 'fitness';
    case 'stair climbing': return 'trending-up';
    case 'cross training': return 'fitness';
    case 'core training': return 'fitness';
    case 'flexibility': return 'body';
    case 'cooldown': return 'snow';
    case 'mindfulness': return 'leaf';
    default: return 'fitness';
  }
}

// MARK: - HealthSnapshot
export interface HealthSnapshot {
  restingHeartRateCurrent: number | null;
  restingHeartRate30DaysAgo: number | null;
  vo2MaxCurrent: number | null;
  vo2Max30DaysAgo: number | null;
  stepsToday: number;
  activeCaloriesToday: number;
  lastUpdated: string; // ISO date string
}

export function restingHRTrend(snapshot: HealthSnapshot): number | null {
  if (snapshot.restingHeartRateCurrent == null || snapshot.restingHeartRate30DaysAgo == null) return null;
  return snapshot.restingHeartRateCurrent - snapshot.restingHeartRate30DaysAgo;
}

export function vo2MaxTrend(snapshot: HealthSnapshot): number | null {
  if (snapshot.vo2MaxCurrent == null || snapshot.vo2Max30DaysAgo == null) return null;
  return snapshot.vo2MaxCurrent - snapshot.vo2Max30DaysAgo;
}

export const emptyHealthSnapshot: HealthSnapshot = {
  restingHeartRateCurrent: null,
  restingHeartRate30DaysAgo: null,
  vo2MaxCurrent: null,
  vo2Max30DaysAgo: null,
  stepsToday: 0,
  activeCaloriesToday: 0,
  lastUpdated: new Date().toISOString(),
};

// MARK: - Goal
export interface Goal {
  id: string;
  title: string;
  description: string;
  rewardVitacoins: number;
  currentValue: number;
  startValue: number;
  targetValue: number;
  isAchieved: boolean;
}

export function goalProgressFraction(goal: Goal): number {
  if (goal.targetValue === goal.startValue) return 0;
  const progress = (goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue);
  return Math.min(Math.max(progress, 0), 1);
}

export function goalProgressPercent(goal: Goal): number {
  return Math.floor(goalProgressFraction(goal) * 100);
}

// MARK: - ResourceType
export enum ResourceType {
  muskelmasse = 'muskelmasse',
  protein = 'protein',
  wood = 'wood',
  stone = 'stone',
  food = 'food',
  none = 'none',
}

// MARK: - BuildingType
export enum BuildingType {
  rathaus = 'rathaus',
  kornkammer = 'kornkammer',
  proteinfarm = 'proteinfarm',
  holzfaeller = 'holzfaeller',
  steinbruch = 'steinbruch',
  feld = 'feld',
  holzlager = 'holzlager',
  steinlager = 'steinlager',
  nahrungslager = 'nahrungslager',
  kaserne = 'kaserne',
  tempel = 'tempel',
  bibliothek = 'bibliothek',
  marktplatz = 'marktplatz',
  stammeshaus = 'stammeshaus',
  lager = 'lager',
  alchemist = 'alchemist',
  // --- Entity System (Phase 2+) ---
  stall = 'stall',
  wachturm = 'wachturm',
  mauer = 'mauer',
}

export const ALL_BUILDING_TYPES: BuildingType[] = Object.values(BuildingType);

export function buildingDisplayName(type: BuildingType): string {
  const names: Record<BuildingType, string> = {
    [BuildingType.rathaus]: 'Rathaus',
    [BuildingType.kornkammer]: 'Kornkammer',
    [BuildingType.proteinfarm]: 'Proteinfarm',
    [BuildingType.holzfaeller]: 'Holzfäller',
    [BuildingType.steinbruch]: 'Steinbruch',
    [BuildingType.feld]: 'Feld',
    [BuildingType.holzlager]: 'Holzlager',
    [BuildingType.steinlager]: 'Steinlager',
    [BuildingType.nahrungslager]: 'Nahrungslager',
    [BuildingType.kaserne]: 'Kaserne',
    [BuildingType.tempel]: 'Tempel',
    [BuildingType.bibliothek]: 'Bibliothek',
    [BuildingType.marktplatz]: 'Marktplatz',
    [BuildingType.stammeshaus]: 'Stammeshaus',
    [BuildingType.lager]: 'Lager',
    [BuildingType.alchemist]: 'Alchemist',
    [BuildingType.stall]: 'Stall',
    [BuildingType.wachturm]: 'Wachturm',
    [BuildingType.mauer]: 'Mauer',
  };
  return names[type];
}

// Ionicons icon name for each building type
export function buildingIconName(type: BuildingType): string {
  const icons: Record<BuildingType, string> = {
    [BuildingType.rathaus]: 'home',
    [BuildingType.kornkammer]: 'archive',
    [BuildingType.proteinfarm]: 'medkit',
    [BuildingType.holzfaeller]: 'hammer',
    [BuildingType.steinbruch]: 'cube',
    [BuildingType.feld]: 'leaf',
    [BuildingType.holzlager]: 'cube-outline',
    [BuildingType.steinlager]: 'layers-outline',
    [BuildingType.nahrungslager]: 'basket-outline',
    [BuildingType.kaserne]: 'shield',
    [BuildingType.tempel]: 'sparkles',
    [BuildingType.bibliothek]: 'book',
    [BuildingType.marktplatz]: 'storefront',
    [BuildingType.stammeshaus]: 'people',
    [BuildingType.lager]: 'archive-outline',
    [BuildingType.alchemist]: 'flask',
    [BuildingType.stall]: 'paw',
    [BuildingType.wachturm]: 'eye',
    [BuildingType.mauer]: 'shield-half',
  };
  return icons[type];
}

export function buildingDescription(type: BuildingType): string {
  const descriptions: Record<BuildingType, string> = {
    [BuildingType.rathaus]: 'The heart of your settlement — upgrade it to unlock new buildings.',
    [BuildingType.kornkammer]: 'Passively stores Muskelmasse generated from your workouts.',
    [BuildingType.proteinfarm]: 'Slowly produces Protein, the rarest and most valuable resource.',
    [BuildingType.holzfaeller]: 'Chops timber continuously to keep your construction projects supplied.',
    [BuildingType.steinbruch]: 'Extracts stone from the earth for advanced building projects.',
    [BuildingType.feld]: 'Grows food to keep your workers fed and productive.',
    [BuildingType.holzlager]: 'Increases your maximum Wood storage capacity.',
    [BuildingType.steinlager]: 'Increases your maximum Stone storage capacity.',
    [BuildingType.nahrungslager]: 'Increases your maximum Food storage capacity.',
    [BuildingType.kaserne]: 'Trains new workers and houses your workforce.',
    [BuildingType.tempel]: 'Channels your workout streak into powerful production bonuses.',
    [BuildingType.bibliothek]: 'Unlocks research that improves every aspect of your realm.',
    [BuildingType.marktplatz]: 'Trade surplus resources with other tribes for what you need.',
    [BuildingType.stammeshaus]: 'The ultimate symbol of tribal prestige and endgame power.',
    [BuildingType.lager]: 'A general storage building for surplus resources.',
    [BuildingType.alchemist]: 'Transmutes resources into rare compounds and powerful boosts.',
    [BuildingType.stall]: 'Houses your animals and lets you assign them to buildings for production bonuses.',
    [BuildingType.wachturm]: 'Provides early warning of incoming monster waves and reduces attacker strength.',
    [BuildingType.mauer]: 'A stone wall that absorbs damage and protects your settlement from monster attacks.',
  };
  return descriptions[type];
}

export function buildingProducesResource(type: BuildingType): ResourceType {
  switch (type) {
    case BuildingType.kornkammer: return ResourceType.muskelmasse;
    case BuildingType.proteinfarm: return ResourceType.protein;
    case BuildingType.holzfaeller: return ResourceType.wood;
    case BuildingType.steinbruch: return ResourceType.stone;
    case BuildingType.feld: return ResourceType.food;
    default: return ResourceType.none;
  }
}

export function buildingAccentColor(type: BuildingType): string {
  switch (type) {
    case BuildingType.rathaus:
      return '#F5A623'; // gold
    case BuildingType.kornkammer:
    case BuildingType.proteinfarm:
    case BuildingType.holzfaeller:
    case BuildingType.steinbruch:
    case BuildingType.feld:
      return '#00B4D8'; // teal — production
    case BuildingType.holzlager:
    case BuildingType.steinlager:
    case BuildingType.nahrungslager:
    case BuildingType.kaserne:
    case BuildingType.stall:
    case BuildingType.wachturm:
    case BuildingType.mauer:
      return '#8B5CF6'; // purple — infrastructure
    case BuildingType.tempel:
    case BuildingType.bibliothek:
    case BuildingType.marktplatz:
    case BuildingType.stammeshaus:
      return '#EC4899'; // pink — special
    case BuildingType.lager:
      return '#A0522D'; // brown — storage
    case BuildingType.alchemist:
      return '#22C55E'; // green — alchemy
  }
}

// MARK: - GridPosition
export interface GridPosition {
  row: number;
  col: number;
}

// MARK: - Building
export interface Building {
  id: string;
  type: BuildingType;
  level: number; // 0 while under initial construction, 1–5 when active
  currentStorage: number;
  assignedWorkerID: string | null;
  isDecayed: boolean;
  position: GridPosition;
  // Construction state
  isUnderConstruction: boolean;
  constructionEndsAt: number | null; // Unix timestamp ms
  constructionWorkerID: string | null; // Worker ID speeding up construction
  targetLevel: number; // level when done (1 for new, currentLevel+1 for upgrade)
}

export function buildingStorageFraction(building: Building, maxStorage: number): number {
  if (maxStorage <= 0) return 0;
  return Math.min(building.currentStorage / maxStorage, 1.0);
}

// MARK: - Worker
export enum WorkerStatus {
  active = 'active',
  idle = 'idle',
  training = 'training',
  hungry = 'hungry',
  constructing = 'constructing', // Worker is assigned to a building site
}

export interface Worker {
  id: string;
  name: string;
  level: number; // 1–3
  assignedBuildingID: string | null;
  isActive: boolean;
  isTraining: boolean;
  trainingEndDate: string | null; // ISO date string
  lastCollectionDate: string; // ISO date string
  isConstructing: boolean; // Worker is on a construction site
}

export function workerStatus(worker: Worker): WorkerStatus {
  if (worker.isTraining) return WorkerStatus.training;
  if (worker.isConstructing) return WorkerStatus.constructing;
  if (!worker.isActive) return WorkerStatus.hungry;
  if (worker.assignedBuildingID != null) return WorkerStatus.active;
  return WorkerStatus.idle;
}

// MARK: - ExplorationZone
export interface ExplorationZone {
  id: number; // 1–6
  name: string;
  isUnlocked: boolean;
  explorationEndDate: string | null; // ISO date string
  hasReward: boolean;
}

export function zoneIsExploring(zone: ExplorationZone): boolean {
  if (!zone.explorationEndDate) return false;
  return !zone.hasReward && new Date(zone.explorationEndDate) > new Date();
}

export function zoneExplorationComplete(zone: ExplorationZone): boolean {
  if (!zone.explorationEndDate) return false;
  return new Date(zone.explorationEndDate) <= new Date() && !zone.hasReward && zone.isUnlocked;
}

// MARK: - ObstacleType
export enum ObstacleType {
  branch = 'branch',
  smallRock = 'smallRock',
  mushrooms = 'mushrooms',
  largeTree = 'largeTree',
  boulder = 'boulder',
  deadTree = 'deadTree',
}

export function obstacleIsSmall(type: ObstacleType): boolean {
  return type === ObstacleType.branch || type === ObstacleType.smallRock || type === ObstacleType.mushrooms;
}

export function obstacleDisplayName(type: ObstacleType): string {
  const names: Record<ObstacleType, string> = {
    [ObstacleType.branch]: 'Ast',
    [ObstacleType.smallRock]: 'Kleiner Stein',
    [ObstacleType.mushrooms]: 'Pilze',
    [ObstacleType.largeTree]: 'Großer Baum',
    [ObstacleType.boulder]: 'Felsbrocken',
    [ObstacleType.deadTree]: 'Toter Baum',
  };
  return names[type];
}

export function obstacleRemovalCost(type: ObstacleType): number {
  return obstacleIsSmall(type) ? 15 : 0;
}

export function obstacleRemovalTime(type: ObstacleType): number {
  return obstacleIsSmall(type) ? 0 : 30 * 60; // seconds
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  row: number;
  col: number;
  isClearing: boolean;
  clearingEndDate: string | null;
  isCleared: boolean;
}

// ============================================
// TROPHIES
// ============================================

export type TrophyType = 'golemHerz' | 'hydraSchuppe';

export interface Trophy {
  id: string;
  type: TrophyType;
  name: string;
  emoji: string;
  obtainedAt: number;
  gridPosition: { x: number; y: number } | null;
}

// Boss-Phase-Ergebnis für 3-Phasen-Kämpfe
export interface BossPhaseResult {
  phase: 1 | 2 | 3;
  passed: boolean;
  vpUsed: number;
  akFaced: number;
}

// MARK: - GameState
export interface GameState {
  // Resources
  muskelmasse: number;
  protein: number;
  streakTokens: number;
  wood: number;
  stone: number;
  food: number;

  // Game Objects
  buildings: Building[];
  workers: Worker[];
  zones: ExplorationZone[];

  // Streak & Workout Tracking
  currentStreak: number;
  lastWorkoutDate: string | null;
  lastStreakTokenDate: string | null;
  lastStreakMilestone: number;

  // Production Engine
  lastProductionTick: string; // ISO date string
  processedGameWorkoutIDs: string[];

  // Entity System
  animals: Animal[];
  eggs: AnimalEgg[];
  waves: MonsterWave[];
  activeWave: MonsterWave | null;
  nextWaveAt: number | null;           // Unix timestamp ms
  damageEffects: DamageEffect[];       // Aktive Schadenseffekte auf Gebäuden

  // HRmax Intensity Tracking
  intensiveWorkoutTracker: {
    weeklyCount: number;
    weekStart: number;
    biweeklyCount: number;
    biweeklyStart: number;
  };

  // Mauer HP
  wallHP: {
    current: number;
    max: number;
  } | null;

  // Pending hatch result (for animation)
  pendingHatchResult: {
    animalType: AnimalType;
    rarity: AnimalRarity;
  } | null;

  // Phase 6: Trophies & Boss-Events
  trophies: Trophy[];
  lastBloodWaveAt: number | null;
  lastBossEventAt: number | null;
  pendingDragonUnlock: boolean;
}

export function gameStateRathausLevel(state: GameState): number {
  const rathaus = state.buildings.find(b => b.type === BuildingType.rathaus);
  return rathaus?.level ?? 1;
}

export function gameStateIsDecayActive(state: GameState): boolean {
  if (!state.lastWorkoutDate) return false;
  return (Date.now() - new Date(state.lastWorkoutDate).getTime()) >= 48 * 3600 * 1000;
}

export function gameStateDecayMultiplier(state: GameState): number {
  if (!state.lastWorkoutDate) return 1.0;
  const elapsed = (Date.now() - new Date(state.lastWorkoutDate).getTime()) / 1000;
  if (elapsed < 48 * 3600) return 1.0;
  if (elapsed < 72 * 3600) return 0.5;
  if (elapsed < 96 * 3600) return 0.25;
  return 0.0;
}

export function findBuilding(state: GameState, position: GridPosition): Building | undefined {
  return state.buildings.find(b => b.position.row === position.row && b.position.col === position.col);
}

export function findBuildingById(state: GameState, id: string): Building | undefined {
  return state.buildings.find(b => b.id === id);
}

export function createDefaultGameState(): GameState {
  return {
    muskelmasse: 0,
    protein: 0,
    streakTokens: 0,
    wood: 0,
    stone: 0,
    food: 0,
    buildings: [],
    workers: [],
    zones: [],
    currentStreak: 0,
    lastWorkoutDate: null,
    lastStreakTokenDate: null,
    lastStreakMilestone: 0,
    lastProductionTick: new Date().toISOString(),
    processedGameWorkoutIDs: [],
    animals: [],
    eggs: [],
    waves: [],
    activeWave: null,
    nextWaveAt: null,
    damageEffects: [],
    intensiveWorkoutTracker: {
      weeklyCount: 0,
      weekStart: Date.now(),
      biweeklyCount: 0,
      biweeklyStart: Date.now(),
    },
    wallHP: null,
    pendingHatchResult: null,
    trophies: [],
    lastBloodWaveAt: null,
    lastBossEventAt: null,
    pendingDragonUnlock: false,
  };
}

// ============================================
// ENTITY SYSTEM — Types
// ============================================

// --- Tiere ---

export type AnimalRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AnimalType =
  | 'erntehuhn'
  | 'lastesel'
  | 'holzbaer'
  | 'spaehfalke'
  | 'steinbock'
  | 'mystischerHirsch'
  | 'kriegswolf'
  | 'gluecksphoenixt'
  | 'uralterDrache';

export type AnimalAssignment =
  | { type: 'building'; buildingId: string }   // Einem Gebäude zugewiesen (Produktionsbonus)
  | { type: 'defense' }                         // Der Verteidigung zugewiesen
  | { type: 'idle' };                           // Im Stall, nicht zugewiesen

export interface Animal {
  id: string;
  type: AnimalType;
  name: string;                    // Anzeigename (z.B. "Holzbär")
  rarity: AnimalRarity;
  assignment: AnimalAssignment;
  obtainedAt: number;              // Timestamp wann erhalten
}

// --- Tier-Eier ---

export type EggRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AnimalEgg {
  id: string;
  rarity: EggRarity;
  hatchesInto: AnimalType;          // Welches Tier schlüpft
  workoutsRequired: number;         // Wie viele Workouts zum Ausbrüten
  workoutsCompleted: number;        // Bisheriger Fortschritt
  requiresConsecutive: boolean;     // Müssen Workouts aufeinanderfolgend sein?
  requiresMinHRmax: number | null;  // Mindest-HRmax-Prozent (null = egal)
  obtainedAt: number;
}

// --- Monster ---

export type MonsterTier = 1 | 2 | 3 | 4 | 5;

export type MonsterType =
  | 'sumpfgoblin'
  | 'schattenratte'
  | 'skelettkrieger'
  | 'giftwurm'
  | 'dunkelork'
  | 'nebelgeist'
  | 'frostdrache'
  | 'schattenmagier'
  | 'uralterGolem'
  | 'verderbnisHydra';

export interface Monster {
  type: MonsterType;
  count: number;                    // Anzahl in dieser Welle
  attackPower: number;              // Angriffskraft (berechnet)
  hp: number;                       // HP (berechnet)
  target: MonsterTarget;
}

export type MonsterTarget =
  | 'fields'          // Felder/Nahrung
  | 'storage'         // Lager
  | 'production'      // Zufälliges Produktionsgebäude
  | 'magic'           // Tempel/Bibliothek
  | 'protein'         // Proteinfarm/Tempel
  | 'all'             // Flächenangriff
  | 'rathaus';        // Boss: Rathaus

// --- Monsterwellen ---

export type WaveStatus = 'approaching' | 'active' | 'resolved';

export interface MonsterWave {
  id: string;
  monsters: Monster[];
  totalAttackPower: number;
  status: WaveStatus;
  announcedAt: number;              // Wann die Warnung kam
  arrivesAt: number;                // Wann der Angriff startet
  resolvedAt: number | null;        // Wann der Kampf beendet wurde
  result: WaveResult | null;
}

export type WaveResult = {
  outcome: 'perfect' | 'defended' | 'partial' | 'overrun';
  damageDealt: DamageEffect[];
  loot: LootDrop[];
  playerVP: number;
  monsterAP: number;
  // Phase 6: Boss & Blutwellen-Felder
  isBossWave: boolean;
  isBloodWave: boolean;
  bossPhases?: BossPhaseResult[];
  wallHPUsed: number;
};

export interface DamageEffect {
  buildingId: string;
  effectType: 'productionStop' | 'resourceLoss' | 'disabled';
  duration: number;                 // Dauer in Millisekunden
  startsAt: number;
  endsAt: number;
}

export interface LootDrop {
  type: 'muskelmasse' | 'holz' | 'nahrung' | 'protein' | 'stein' | 'egg' | 'cosmetic' | 'trophy';
  amount: number;
  eggRarity?: EggRarity;           // Nur bei type === 'egg'
}

// --- Verteidigung ---

export interface DefenseBreakdown {
  basisVP: number;        // Aus Gebäuden (Rathaus, Kaserne, Wachturm, Mauer)
  workoutVP: number;      // Aus Workouts der letzten 24h
  workerVP: number;       // Aus Workern in Verteidigung
  animalVP: number;       // Aus Tieren in Verteidigung
  streakBonus: number;    // Prozentbonus aus Streak
  totalVP: number;
}

// MARK: - AppColors
export const AppColors = {
  background: '#1A1A2E',
  cardBackground: '#252547',
  gold: '#F5A623',
  teal: '#00B4D8',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
} as const;
