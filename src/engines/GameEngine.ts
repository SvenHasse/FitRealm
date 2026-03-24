// GameEngine.ts
// FitRealm - Core game logic: passive production, currencies, building management, workers, exploration
// Ported 1:1 from GameEngine.swift

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  GameState, Building, Worker, ExplorationZone, GridPosition,
  BuildingType, WorkerStatus, WorkoutRecord, HealthSnapshot,
  createDefaultGameState, gameStateRathausLevel, gameStateDecayMultiplier,
  findBuildingById, workerStatus,
} from '../models/types';
import {
  ResourceCost, createResourceCost, buildCost, upgradeCost, rathausRequirement,
  UNIQUE_BUILDINGS, maxInstances, sellValue,
  Production, Storage, Earn, Workers,
  zones as zoneConfigs, explorationDuration, explorationProteinReward,
  getTotalStorageCap,
} from '../config/GameConfig';

const STATE_KEY = 'fitrealmGameState';

// MARK: - Default Zones
export function makeDefaultZones(): ExplorationZone[] {
  return zoneConfigs.map((cfg, i) => ({
    id: i + 1,
    name: cfg.name,
    isUnlocked: false,
    explorationEndDate: null,
    hasReward: false,
  }));
}

// MARK: - Persistence
export async function loadGameState(): Promise<GameState> {
  try {
    const data = await AsyncStorage.getItem(STATE_KEY);
    if (data) {
      const decoded = JSON.parse(data) as GameState;
      console.log(`[GameEngine] State loaded: ${Math.floor(decoded.muskelmasse)}g Muskelmasse, ${decoded.protein} Protein, ${decoded.buildings.length} buildings`);
      return decoded;
    }
  } catch (e) {
    console.log('[GameEngine] Error loading state:', e);
  }
  console.log('[GameEngine] No saved state — starting fresh');
  return createDefaultGameState();
}

export async function saveGameState(state: GameState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log('[GameEngine] Error saving state:', e);
  }
}

// MARK: - Init (ensure rathaus + zones)
export function initializeState(state: GameState): GameState {
  const s = { ...state };
  if (s.zones.length === 0) {
    s.zones = makeDefaultZones();
  }
  if (!s.buildings.some(b => b.type === BuildingType.rathaus)) {
    s.buildings = [...s.buildings, {
      id: Crypto.randomUUID(),
      type: BuildingType.rathaus,
      level: 1,
      currentStorage: 0,
      assignedWorkerID: null,
      isDecayed: false,
      position: { row: 7, col: 7 },
    }];
  }
  return s;
}

// MARK: - Production Helpers
export function hourlyProductionRate(building: Building): number {
  const lv = building.level;
  switch (building.type) {
    case BuildingType.kornkammer: return Production.rate(Production.kornkammer, lv);
    case BuildingType.proteinfarm: return Production.rate(Production.proteinfarm, lv);
    case BuildingType.holzfaeller: return Production.rate(Production.holzfaeller, lv);
    case BuildingType.steinbruch: return Production.rate(Production.steinbruch, lv);
    case BuildingType.feld: return Production.rate(Production.feld, lv);
    default: return 0;
  }
}

export function buildingStorageCap(building: Building, allBuildings: Building[]): number {
  const lv = building.level;
  const lagerBonus = allBuildings
    .filter(b => b.type === BuildingType.lager)
    .reduce((sum, b) => sum + Storage.lagerBonusPerLevel * b.level, 0);

  switch (building.type) {
    case BuildingType.kornkammer: return Storage.cap(Storage.kornkammer, lv) + lagerBonus;
    case BuildingType.holzfaeller: return Storage.cap(Storage.holzfaeller, lv) + lagerBonus;
    case BuildingType.steinbruch: return Storage.cap(Storage.steinbruch, lv) + lagerBonus;
    case BuildingType.feld: return Storage.cap(Storage.feld, lv) + lagerBonus;
    case BuildingType.proteinfarm: return Storage.cap(Storage.proteinfarm, lv);
    default: return 0;
  }
}

// MARK: - Resource Cap Enforcement
function capResourcesToStorage(state: GameState): GameState {
  const cap = getTotalStorageCap(state.buildings);
  return {
    ...state,
    muskelmasse:  Math.min(state.muskelmasse, cap.muskelmasse),
    protein:      Math.min(state.protein,     cap.protein),
    wood:         Math.min(state.wood,        cap.wood),
    stone:        Math.min(state.stone,       cap.stone),
    food:         Math.min(state.food,        cap.food),
  };
}

// MARK: - Production Tick
export function processTick(state: GameState): GameState {
  const now = new Date();
  const lastTick = new Date(state.lastProductionTick);
  const elapsed = (now.getTime() - lastTick.getTime()) / 1000;
  if (elapsed <= 1) return state;

  const s = { ...state, buildings: [...state.buildings], workers: [...state.workers], zones: [...state.zones] };
  const decayMult = gameStateDecayMultiplier(s);
  const isDecayed = decayMult < 1.0;

  // Passive building production
  for (let i = 0; i < s.buildings.length; i++) {
    const b = { ...s.buildings[i] };
    b.isDecayed = isDecayed;
    const rate = hourlyProductionRate(b);
    if (rate > 0) {
      const produced = rate * (elapsed / 3600.0) * decayMult;
      const cap = buildingStorageCap(b, s.buildings);
      b.currentStorage = Math.min(b.currentStorage + produced, cap);
    }
    s.buildings[i] = b;
  }

  // Worker auto-collection & hunger checks
  const foodAvailable = s.food > 0;
  for (let i = 0; i < s.workers.length; i++) {
    const w = { ...s.workers[i] };
    if (w.isTraining) { s.workers[i] = w; continue; }
    w.isActive = foodAvailable;
    if (w.isActive && w.assignedBuildingID) {
      const interval = Workers.collectionInterval(w.level);
      const lastCollection = new Date(w.lastCollectionDate);
      if ((now.getTime() - lastCollection.getTime()) / 1000 >= interval) {
        const bIdx = s.buildings.findIndex(b => b.id === w.assignedBuildingID);
        if (bIdx >= 0) {
          s.buildings[bIdx] = { ...s.buildings[bIdx] };
          collectFromBuilding(s, bIdx);
          w.lastCollectionDate = now.toISOString();
        }
      }
    }
    s.workers[i] = w;
  }

  // Training completion
  for (let i = 0; i < s.workers.length; i++) {
    const w = s.workers[i];
    if (w.isTraining && w.trainingEndDate && now >= new Date(w.trainingEndDate)) {
      s.workers[i] = { ...w, isTraining: false, isActive: true, trainingEndDate: null };
    }
  }

  // Exploration completion
  for (let i = 0; i < s.zones.length; i++) {
    const z = s.zones[i];
    if (z.explorationEndDate && new Date(z.explorationEndDate) <= now && !z.hasReward && z.isUnlocked) {
      s.zones[i] = { ...z, hasReward: true };
    }
  }

  s.lastProductionTick = now.toISOString();
  console.log(`[GameEngine] Tick: +${Math.floor(elapsed)}s, decayMult=${decayMult}`);
  return capResourcesToStorage(s);
}

// MARK: - Collect from building (mutates state in place)
function collectFromBuilding(state: GameState, index: number): void {
  const b = state.buildings[index];
  if (b.currentStorage <= 0) return;
  switch (b.type) {
    case BuildingType.kornkammer: state.muskelmasse += b.currentStorage; break;
    case BuildingType.proteinfarm: state.protein += Math.floor(b.currentStorage); break;
    case BuildingType.holzfaeller: state.wood += Math.floor(b.currentStorage); break;
    case BuildingType.steinbruch: state.stone += Math.floor(b.currentStorage); break;
    case BuildingType.feld: state.food += Math.floor(b.currentStorage); break;
    default: return;
  }
  state.buildings[index] = { ...b, currentStorage: 0 };
}

// MARK: - Resource Collection
export function collectResources(state: GameState, buildingID: string): GameState {
  const s = { ...state, buildings: [...state.buildings] };
  const idx = s.buildings.findIndex(b => b.id === buildingID);
  if (idx >= 0) {
    s.buildings[idx] = { ...s.buildings[idx] };
    collectFromBuilding(s, idx);
  }
  return s;
}

export function collectAll(state: GameState): GameState {
  const s = { ...state, buildings: [...state.buildings] };
  for (let i = 0; i < s.buildings.length; i++) {
    if (s.buildings[i].currentStorage > 0) {
      s.buildings[i] = { ...s.buildings[i] };
      collectFromBuilding(s, i);
    }
  }
  return s;
}

// MARK: - Sell Consequence Types
export type SellWarningType =
  | 'storage_cap_reduced'
  | 'workers_dismissed'
  | 'food_production_lost'
  | 'production_lost'
  | 'bonus_lost'
  | 'worker_unassigned'
  | 'pending_collected';

export interface SellWarning {
  type: SellWarningType;
  severity: 'info' | 'warning' | 'danger';
  messageKey: string;
  values?: Record<string, string | number>;
}

export interface SellConsequences {
  refund: ResourceCost;
  pendingStorage: ResourceCost;
  workerUnassigned: import('../models/types').Worker | null;
  workersLost: import('../models/types').Worker[];
  resourcesLost: ResourceCost;
  warnings: SellWarning[];
}

// MARK: - Calculate Sell Consequences (pure — does not mutate state)
export function calculateSellConsequences(
  state: GameState,
  buildingID: string,
): SellConsequences | null {
  const building = state.buildings.find(b => b.id === buildingID);
  if (!building || building.type === BuildingType.rathaus) return null;

  const warnings: SellWarning[] = [];
  const refund       = sellValue(building.type, building.level);
  const pendingStorage = createResourceCost();
  const resourcesLost  = createResourceCost();
  let workerUnassigned: import('../models/types').Worker | null = null;
  let workersLost:      import('../models/types').Worker[]      = [];

  // --- Pending storage: paid out automatically on sell ---
  if (building.currentStorage > 0) {
    const amt = Math.floor(building.currentStorage);
    switch (building.type) {
      case BuildingType.kornkammer:  pendingStorage.muskelmasse = amt; break;
      case BuildingType.proteinfarm: pendingStorage.protein     = Math.floor(building.currentStorage); break;
      case BuildingType.holzfaeller: pendingStorage.wood        = amt; break;
      case BuildingType.steinbruch:  pendingStorage.stone       = amt; break;
      case BuildingType.feld:        pendingStorage.food        = amt; break;
    }
    const hasPending = Object.values(pendingStorage).some(v => v > 0);
    if (hasPending) {
      warnings.push({ type: 'pending_collected', severity: 'info', messageKey: 'sell.warning.pending_collected' });
    }
  }

  // --- Assigned worker ---
  if (building.assignedWorkerID) {
    const w = state.workers.find(w => w.id === building.assignedWorkerID) ?? null;
    if (w) {
      workerUnassigned = w;
      warnings.push({ type: 'worker_unassigned', severity: 'info', messageKey: 'sell.warning.worker_unassigned' });
    }
  }

  // --- Lager: storage cap reduction → overflow lost ---
  if (building.type === BuildingType.lager) {
    const remainingBuildings = state.buildings.filter(b => b.id !== buildingID);
    for (const b of state.buildings) {
      if (b.id === buildingID || b.currentStorage <= 0) continue;
      const newCap = buildingStorageCap(b, remainingBuildings);
      if (newCap <= 0) continue;
      const overflow = Math.max(0, b.currentStorage - newCap);
      if (overflow <= 0) continue;
      switch (b.type) {
        case BuildingType.kornkammer:  resourcesLost.muskelmasse += Math.floor(overflow); break;
        case BuildingType.holzfaeller: resourcesLost.wood        += Math.floor(overflow); break;
        case BuildingType.steinbruch:  resourcesLost.stone       += Math.floor(overflow); break;
        case BuildingType.feld:        resourcesLost.food        += Math.floor(overflow); break;
        case BuildingType.proteinfarm: resourcesLost.protein     += Math.floor(overflow); break;
      }
    }
    const totalLost = resourcesLost.muskelmasse + resourcesLost.protein +
                      resourcesLost.wood + resourcesLost.stone + resourcesLost.food;
    if (totalLost > 0) {
      warnings.push({
        type: 'storage_cap_reduced', severity: 'danger',
        messageKey: 'sell.warning.storage_cap_reduced',
        values: { amount: totalLost },
      });
    }
  }

  // --- Kaserne: all workers dismissed ---
  if (building.type === BuildingType.kaserne) {
    workersLost = [...state.workers];
    if (workersLost.length > 0) {
      warnings.push({
        type: 'workers_dismissed', severity: 'danger',
        messageKey: 'sell.warning.workers_dismissed',
        values: { count: workersLost.length },
      });
    }
  }

  // --- Feld: food production lost (workers at risk if any) ---
  if (building.type === BuildingType.feld) {
    const hasWorkers = state.workers.length > 0;
    warnings.push({
      type: hasWorkers ? 'food_production_lost' : 'production_lost',
      severity: hasWorkers ? 'warning' : 'info',
      messageKey: hasWorkers ? 'sell.warning.food_production_lost' : 'sell.warning.production_lost',
      values: hasWorkers ? undefined : { resource: 'Nahrung' },
    });
  }

  // --- Other producers: generic production_lost ---
  if ([BuildingType.holzfaeller, BuildingType.steinbruch,
       BuildingType.proteinfarm, BuildingType.kornkammer].includes(building.type)) {
    const resourceName: Record<string, string> = {
      [BuildingType.holzfaeller]:  'Holz',
      [BuildingType.steinbruch]:   'Stein',
      [BuildingType.proteinfarm]:  'Protein',
      [BuildingType.kornkammer]:   'Muskelmasse',
    };
    warnings.push({
      type: 'production_lost', severity: 'info',
      messageKey: 'sell.warning.production_lost',
      values: { resource: resourceName[building.type] ?? building.type },
    });
  }

  // --- Tempel / Bibliothek: bonus lost ---
  if (building.type === BuildingType.tempel || building.type === BuildingType.bibliothek) {
    warnings.push({
      type: 'bonus_lost', severity: 'warning',
      messageKey: 'sell.warning.bonus_lost',
      values: { building: building.type },
    });
  }

  return { refund, pendingStorage, workerUnassigned, workersLost, resourcesLost, warnings };
}

// MARK: - Sell Building
export interface SellResult {
  refund: ResourceCost;
}

export function sellBuilding(
  state: GameState,
  buildingID: string,
): { newState: GameState; refund: ResourceCost } | null {
  const bIdx = state.buildings.findIndex(b => b.id === buildingID);
  if (bIdx < 0) return null;

  const building = state.buildings[bIdx];
  if (building.type === BuildingType.rathaus) return null; // Rathaus is unsellable

  // Clone mutable parts
  let s: GameState = {
    ...state,
    buildings: [...state.buildings],
    workers:   [...state.workers],
  };

  // 1. Pay out pending storage into player resources first
  if (building.currentStorage > 0) {
    s.buildings[bIdx] = { ...s.buildings[bIdx] };
    collectFromBuilding(s, bIdx);
  }

  // 2. Unassign worker attached to this building
  if (building.assignedWorkerID) {
    const wIdx = s.workers.findIndex(w => w.id === building.assignedWorkerID);
    if (wIdx >= 0) {
      s.workers[wIdx] = { ...s.workers[wIdx], assignedBuildingID: null };
    }
  }

  // 3. Kaserne: dismiss all workers
  if (building.type === BuildingType.kaserne) {
    s.workers = [];
  }

  // 4. Remove building from grid
  s.buildings = s.buildings.filter(b => b.id !== buildingID);

  // 5. Lager: cap remaining buildings' resources to their new (reduced) storage cap
  if (building.type === BuildingType.lager) {
    for (let i = 0; i < s.buildings.length; i++) {
      const b = s.buildings[i];
      if (b.currentStorage <= 0) continue;
      const newCap = buildingStorageCap(b, s.buildings);
      if (b.currentStorage > newCap) {
        s.buildings[i] = { ...b, currentStorage: newCap };
      }
    }
  }

  // 6. Compute 50% refund and credit resources
  const refund = sellValue(building.type, building.level);
  s = {
    ...s,
    muskelmasse:  s.muskelmasse  + refund.muskelmasse,
    protein:      s.protein      + refund.protein,
    wood:         s.wood         + refund.wood,
    stone:        s.stone        + refund.stone,
    food:         s.food         + refund.food,
    streakTokens: s.streakTokens + refund.streakTokens,
  };

  return { newState: s, refund };
}

// MARK: - Collect Result (returned by collectAllWithResult)
export interface CollectResult {
  muskelmasse: number;
  protein:     number;
  wood:        number;
  stone:       number;
  food:        number;
  totalBuildings: number; // producing buildings that had storage > 0
}

const PRODUCING_TYPES = new Set([
  BuildingType.kornkammer, BuildingType.proteinfarm,
  BuildingType.holzfaeller, BuildingType.steinbruch, BuildingType.feld,
]);

export function collectAllWithResult(state: GameState): { newState: GameState; result: CollectResult } {
  const before = {
    muskelmasse: state.muskelmasse,
    protein:     state.protein,
    wood:        state.wood,
    stone:       state.stone,
    food:        state.food,
  };
  const totalBuildings = state.buildings.filter(
    b => b.currentStorage > 0 && PRODUCING_TYPES.has(b.type),
  ).length;
  const newState = collectAll(state);
  return {
    newState,
    result: {
      muskelmasse:   Math.max(0, newState.muskelmasse - before.muskelmasse),
      protein:       Math.max(0, newState.protein     - before.protein),
      wood:          Math.max(0, newState.wood         - before.wood),
      stone:         Math.max(0, newState.stone        - before.stone),
      food:          Math.max(0, newState.food         - before.food),
      totalBuildings,
    },
  };
}

// MARK: - Workout Processing
export function processWorkouts(state: GameState, workouts: WorkoutRecord[], snapshot: HealthSnapshot): GameState {
  const newWorkouts = workouts.filter(w => !state.processedGameWorkoutIDs.includes(w.id));
  if (newWorkouts.length === 0) return state;

  const s = { ...state, processedGameWorkoutIDs: [...state.processedGameWorkoutIDs] };

  for (const workout of newWorkouts) {
    const hrMult = Earn.hrMultiplier(workout.averageHeartRate);
    const muskel = workout.durationMinutes * Earn.basePerMinute * hrMult;
    s.muskelmasse += muskel;

    // Protein for sustained high-HR workouts
    if (workout.averageHeartRate != null && workout.averageHeartRate > Earn.proteinMinHR && workout.durationMinutes >= Earn.proteinMinMinutes) {
      s.protein += 1;
    }

    updateStreak(s, new Date(workout.date));
    awardDailyToken(s, new Date(workout.date));
    s.processedGameWorkoutIDs.push(workout.id);
  }

  // Step bonus
  const stepBonus = Math.min(Math.floor(snapshot.stepsToday / Earn.stepsPerGram), Earn.maxStepBonus);
  if (stepBonus > 0) s.muskelmasse += stepBonus;

  // VO2 Max improvement → +5 Protein
  const vo2Trend = snapshot.vo2MaxCurrent != null && snapshot.vo2Max30DaysAgo != null
    ? snapshot.vo2MaxCurrent - snapshot.vo2Max30DaysAgo : null;
  if (vo2Trend != null && vo2Trend > 0) s.protein += 5;

  // RHR improvement ≥ 2 bpm → +5 Protein
  const rhrTrend = snapshot.restingHeartRateCurrent != null && snapshot.restingHeartRate30DaysAgo != null
    ? snapshot.restingHeartRateCurrent - snapshot.restingHeartRate30DaysAgo : null;
  if (rhrTrend != null && rhrTrend <= -2) s.protein += 5;

  return capResourcesToStorage(s);
}

function updateStreak(state: GameState, date: Date): void {
  if (state.lastWorkoutDate) {
    const last = new Date(state.lastWorkoutDate);
    const startOfLast = new Date(last.getFullYear(), last.getMonth(), last.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysDiff = Math.round((startOfDate.getTime() - startOfLast.getTime()) / (24 * 3600 * 1000));

    if (daysDiff === 0) { /* same day */ }
    else if (daysDiff === 1) state.currentStreak += 1;
    else if (daysDiff <= 2) state.currentStreak = Math.max(state.currentStreak, 1);
    else state.currentStreak = 1;
  } else {
    state.currentStreak = 1;
  }
  state.lastWorkoutDate = date.toISOString();

  // 3-day milestone
  if (state.currentStreak >= 3 && state.lastStreakMilestone < 3) {
    state.streakTokens += 2;
    state.lastStreakMilestone = 3;
  }
  // 7-day milestone
  if (state.currentStreak >= 7 && state.lastStreakMilestone < 7) {
    state.streakTokens += 5;
    state.protein += 3;
    state.lastStreakMilestone = 7;
  }
}

function awardDailyToken(state: GameState, date: Date): void {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const lastDay = state.lastStreakTokenDate
    ? new Date(new Date(state.lastStreakTokenDate).getFullYear(), new Date(state.lastStreakTokenDate).getMonth(), new Date(state.lastStreakTokenDate).getDate()).toISOString()
    : null;
  if (lastDay === today) return;

  state.streakTokens += 1;
  state.lastStreakTokenDate = date.toISOString();
  // Tempel bonus
  if (state.buildings.some(b => b.type === BuildingType.tempel)) {
    state.streakTokens += 1;
  }
}

// MARK: - Building Management
export function canBuild(state: GameState, type: BuildingType, position: GridPosition): [boolean, string] {
  if (state.buildings.some(b => b.position.row === position.row && b.position.col === position.col)) {
    return [false, 'Slot is occupied.'];
  }
  const req = rathausRequirement(type);
  if (gameStateRathausLevel(state) < req) {
    return [false, `Rathaus level ${req} required.`];
  }
  const existingCount = state.buildings.filter(b => b.type === type).length;
  const max = maxInstances(type);
  if (existingCount >= max) {
    return [false, `Maximum ${max} of this building already placed.`];
  }
  if (!canAfford(state, buildCost(type))) {
    return [false, 'Not enough resources.'];
  }
  return [true, ''];
}

export function buildBuilding(state: GameState, type: BuildingType, position: GridPosition): GameState | null {
  const [ok] = canBuild(state, type, position);
  if (!ok) return null;

  const s = deductCost({ ...state, buildings: [...state.buildings] }, buildCost(type));
  s.buildings.push({
    id: Crypto.randomUUID(),
    type,
    level: 1,
    currentStorage: 0,
    assignedWorkerID: null,
    isDecayed: false,
    position,
  });
  return s;
}

export function canUpgrade(state: GameState, buildingID: string): [boolean, string] {
  const b = findBuildingById(state, buildingID);
  if (!b) return [false, 'Building not found.'];
  if (b.level >= 5) return [false, 'Already max level.'];
  const cost = upgradeCost(b.type, b.level);
  if (!cost) return [false, 'No upgrade path.'];
  if (!canAfford(state, cost)) return [false, 'Not enough resources.'];
  return [true, ''];
}

export function upgradeBuilding(state: GameState, buildingID: string): GameState | null {
  const [ok] = canUpgrade(state, buildingID);
  if (!ok) return null;

  const s = { ...state, buildings: [...state.buildings] };
  const idx = s.buildings.findIndex(b => b.id === buildingID);
  if (idx < 0) return null;

  const cost = upgradeCost(s.buildings[idx].type, s.buildings[idx].level);
  if (!cost) return null;

  const deducted = deductCost(s, cost);
  deducted.buildings[idx] = { ...deducted.buildings[idx], level: deducted.buildings[idx].level + 1 };
  return deducted;
}

// MARK: - Worker Management
export function trainWorker(state: GameState): GameState | null {
  const kaserne = state.buildings.find(b => b.type === BuildingType.kaserne);
  if (!kaserne) return null;
  if (state.workers.length >= kaserne.level) return null;
  if (!canAfford(state, Workers.trainingCost)) return null;

  const s = deductCost({ ...state, workers: [...state.workers] }, Workers.trainingCost);
  s.workers.push({
    id: Crypto.randomUUID(),
    name: `Worker ${s.workers.length + 1}`,
    level: 1,
    assignedBuildingID: null,
    isActive: false,
    isTraining: true,
    trainingEndDate: new Date(Date.now() + Workers.trainingTime * 1000).toISOString(),
    lastCollectionDate: new Date().toISOString(),
  });
  return s;
}

export function assignWorker(state: GameState, workerID: string, buildingID: string): GameState {
  const s = { ...state, buildings: [...state.buildings], workers: [...state.workers] };

  // Clear old assignments from this building
  for (let i = 0; i < s.buildings.length; i++) {
    if (s.buildings[i].assignedWorkerID) {
      s.buildings[i] = { ...s.buildings[i], assignedWorkerID: null };
    }
  }

  for (let i = 0; i < s.workers.length; i++) {
    if (s.workers[i].id === workerID) {
      s.workers[i] = { ...s.workers[i], assignedBuildingID: buildingID };
    }
  }
  for (let i = 0; i < s.buildings.length; i++) {
    if (s.buildings[i].id === buildingID) {
      s.buildings[i] = { ...s.buildings[i], assignedWorkerID: workerID };
    }
  }
  return s;
}

export function unassignWorker(state: GameState, workerID: string): GameState {
  const s = { ...state, buildings: [...state.buildings], workers: [...state.workers] };
  const worker = s.workers.find(w => w.id === workerID);
  if (worker?.assignedBuildingID) {
    const bIdx = s.buildings.findIndex(b => b.id === worker.assignedBuildingID);
    if (bIdx >= 0) {
      s.buildings[bIdx] = { ...s.buildings[bIdx], assignedWorkerID: null };
    }
  }
  const wIdx = s.workers.findIndex(w => w.id === workerID);
  if (wIdx >= 0) {
    s.workers[wIdx] = { ...s.workers[wIdx], assignedBuildingID: null };
  }
  return s;
}

// MARK: - Exploration
export function canUnlockZone(state: GameState, zoneID: number): [boolean, string] {
  const idx = zoneID - 1;
  if (idx < 0 || idx >= state.zones.length) return [false, 'Invalid zone.'];
  if (state.zones[idx].isUnlocked) return [false, 'Already unlocked.'];
  const cfg = zoneConfigs[idx];
  if (gameStateRathausLevel(state) < cfg.rathausRequired) {
    return [false, `Requires Rathaus level ${cfg.rathausRequired}.`];
  }
  if (!canAfford(state, cfg.unlockCost)) return [false, 'Not enough resources.'];
  return [true, ''];
}

export function unlockZone(state: GameState, zoneID: number): GameState | null {
  const [ok] = canUnlockZone(state, zoneID);
  if (!ok) return null;

  const idx = zoneID - 1;
  const s = deductCost({ ...state, zones: [...state.zones] }, zoneConfigs[idx].unlockCost);
  s.zones[idx] = { ...s.zones[idx], isUnlocked: true };
  return s;
}

export function startExploration(state: GameState, zoneID: number): GameState | null {
  const idx = zoneID - 1;
  if (idx < 0 || idx >= state.zones.length) return null;
  if (!state.zones[idx].isUnlocked) return null;
  const z = state.zones[idx];
  if (z.explorationEndDate && !z.hasReward && new Date(z.explorationEndDate) > new Date()) return null;
  if (state.zones.some(zone => zone.explorationEndDate && !zone.hasReward && new Date(zone.explorationEndDate) > new Date())) return null;

  const s = { ...state, zones: [...state.zones] };
  s.zones[idx] = {
    ...s.zones[idx],
    explorationEndDate: new Date(Date.now() + explorationDuration * 1000).toISOString(),
    hasReward: false,
  };
  return s;
}

export function claimExplorationReward(state: GameState, zoneID: number): GameState | null {
  const idx = zoneID - 1;
  if (idx < 0 || idx >= state.zones.length) return null;
  const z = state.zones[idx];

  const isComplete = z.explorationEndDate && new Date(z.explorationEndDate) <= new Date() && !z.hasReward && z.isUnlocked;
  const hasRewardReady = z.isUnlocked && z.hasReward;
  if (!isComplete && !hasRewardReady) return null;

  const s = { ...state, zones: [...state.zones] };
  const muskel = 50 + Math.random() * 150;
  const wood = 20 + Math.floor(Math.random() * 60);
  const stone = 5 + Math.floor(Math.random() * 25);

  s.muskelmasse += muskel;
  s.wood += wood;
  s.stone += stone;
  s.protein += explorationProteinReward;

  s.zones[idx] = { ...s.zones[idx], explorationEndDate: null, hasReward: false };
  return s;
}

// MARK: - Mock & Debug
export function loadMockGameState(): GameState {
  const mock = createDefaultGameState();
  mock.muskelmasse = 850;
  mock.protein = 12;
  mock.streakTokens = 8;
  mock.wood = 200;
  mock.stone = 50;
  mock.food = 120;
  mock.currentStreak = 5;
  mock.lastWorkoutDate = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  mock.lastProductionTick = new Date(Date.now() - 3600 * 1000).toISOString();

  const rhId = Crypto.randomUUID();
  const kkId = Crypto.randomUUID();
  const workerId = Crypto.randomUUID();

  mock.buildings = [
    { id: rhId, type: BuildingType.rathaus, level: 2, currentStorage: 0, assignedWorkerID: null, isDecayed: false, position: { row: 7, col: 7 } },
    { id: kkId, type: BuildingType.kornkammer, level: 2, currentStorage: 45, assignedWorkerID: workerId, isDecayed: false, position: { row: 6, col: 6 } },
    { id: Crypto.randomUUID(), type: BuildingType.holzfaeller, level: 1, currentStorage: 120, assignedWorkerID: null, isDecayed: false, position: { row: 6, col: 7 } },
    { id: Crypto.randomUUID(), type: BuildingType.feld, level: 1, currentStorage: 60, assignedWorkerID: null, isDecayed: false, position: { row: 7, col: 6 } },
    { id: Crypto.randomUUID(), type: BuildingType.lager, level: 1, currentStorage: 0, assignedWorkerID: null, isDecayed: false, position: { row: 7, col: 8 } },
    { id: Crypto.randomUUID(), type: BuildingType.kaserne, level: 1, currentStorage: 0, assignedWorkerID: null, isDecayed: false, position: { row: 8, col: 7 } },
  ];

  mock.workers = [{
    id: workerId,
    name: 'Worker 1',
    level: 1,
    assignedBuildingID: kkId,
    isActive: true,
    isTraining: false,
    trainingEndDate: null,
    lastCollectionDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  }];

  mock.zones = makeDefaultZones();
  mock.zones[0] = { ...mock.zones[0], isUnlocked: true };

  return mock;
}

export function debugAddResources(state: GameState): GameState {
  return {
    ...state,
    muskelmasse: state.muskelmasse + 500,
    protein: state.protein + 10,
    streakTokens: state.streakTokens + 5,
    wood: state.wood + 200,
    stone: state.stone + 100,
    food: state.food + 100,
  };
}

// MARK: - Internal Helpers
export function canAfford(state: GameState, cost: ResourceCost): boolean {
  return (
    state.muskelmasse >= cost.muskelmasse &&
    state.protein >= cost.protein &&
    state.streakTokens >= cost.streakTokens &&
    state.wood >= cost.wood &&
    state.stone >= cost.stone &&
    state.food >= cost.food
  );
}

function deductCost(state: GameState, cost: ResourceCost): GameState {
  return {
    ...state,
    muskelmasse: Math.max(0, state.muskelmasse - cost.muskelmasse),
    protein: Math.max(0, state.protein - cost.protein),
    streakTokens: Math.max(0, state.streakTokens - cost.streakTokens),
    wood: Math.max(0, state.wood - cost.wood),
    stone: Math.max(0, state.stone - cost.stone),
    food: Math.max(0, state.food - cost.food),
  };
}

export function costString(c: ResourceCost): string {
  const parts: string[] = [];
  if (c.muskelmasse > 0) parts.push(`${Math.floor(c.muskelmasse)}g`);
  if (c.protein > 0) parts.push(`${c.protein} Protein`);
  if (c.streakTokens > 0) parts.push(`${c.streakTokens} Token`);
  if (c.wood > 0) parts.push(`${c.wood} Holz`);
  if (c.stone > 0) parts.push(`${c.stone} Stein`);
  if (c.food > 0) parts.push(`${c.food} Nahrung`);
  return parts.length === 0 ? 'Kostenlos' : parts.join(' · ');
}
