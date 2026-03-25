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
      return '#8B5CF6'; // purple — infrastructure
    case BuildingType.tempel:
    case BuildingType.bibliothek:
    case BuildingType.marktplatz:
    case BuildingType.stammeshaus:
      return '#EC4899'; // pink — special
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
  level: number; // 1–5
  currentStorage: number;
  assignedWorkerID: string | null;
  isDecayed: boolean;
  position: GridPosition;
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
}

export function workerStatus(worker: Worker): WorkerStatus {
  if (worker.isTraining) return WorkerStatus.training;
  if (!worker.isActive && !worker.isTraining) return WorkerStatus.hungry;
  if (worker.isActive && worker.assignedBuildingID != null) return WorkerStatus.active;
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
  };
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
