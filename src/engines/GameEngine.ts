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
  Animal, AnimalEgg, AnimalType,
} from '../models/types';
import {
  ResourceCost, createResourceCost, buildCost, upgradeCost, rathausRequirement,
  UNIQUE_BUILDINGS, allowedInstances, nextInstanceUnlockLevel, sellValue,
  Production, Storage, Earn, Workers,
  zones as zoneConfigs, explorationDuration, explorationProteinReward,
  getTotalStorageCap, storageBuildingResource, getStorageBonusArray,
  constructionTime, skipConstructionCost,
} from '../config/GameConfig';
import { ANIMAL_CONFIGS } from '../config/EntityConfig';

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

// MARK: - Init (ensure rathaus + zones + migrate construction fields)
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
      isUnderConstruction: false,
      constructionEndsAt: null,
      constructionWorkerID: null,
      targetLevel: 1,
    }];
  }
  // Migrate existing buildings loaded from storage (add missing construction fields)
  s.buildings = s.buildings.map(b => ({
    ...b,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isUnderConstruction: (b as any).isUnderConstruction ?? false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructionEndsAt: (b as any).constructionEndsAt ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructionWorkerID: (b as any).constructionWorkerID ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetLevel: (b as any).targetLevel ?? (b.level || 1),
  }));
  // Migrate existing workers (add missing isConstructing field)
  s.workers = s.workers.map(w => ({
    ...w,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    isConstructing: (w as any).isConstructing ?? false,
  }));
  // Migrate: add intensiveWorkoutTracker if missing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(s as any).intensiveWorkoutTracker) {
    s.intensiveWorkoutTracker = {
      weeklyCount: 0,
      weekStart: Date.now(),
      biweeklyCount: 0,
      biweeklyStart: Date.now(),
    };
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

export function buildingStorageCap(building: Building, _allBuildings: Building[]): number {
  const lv = building.level;
  switch (building.type) {
    case BuildingType.kornkammer:  return Storage.cap(Storage.kornkammer, lv);
    case BuildingType.holzfaeller: return Storage.cap(Storage.holzfaeller, lv);
    case BuildingType.steinbruch:  return Storage.cap(Storage.steinbruch, lv);
    case BuildingType.feld:        return Storage.cap(Storage.feld, lv);
    case BuildingType.proteinfarm: return Storage.cap(Storage.proteinfarm, lv);
    default: return 0;
  }
}

// MARK: - Resource Cap Enforcement
function capResourcesToStorage(state: GameState): GameState {
  const cap = getTotalStorageCap(state.buildings);
  return {
    ...state,
    // muskelmasse and protein: Infinity cap — never capped
    wood:  cap.wood  === Infinity ? state.wood  : Math.min(state.wood,  cap.wood),
    stone: cap.stone === Infinity ? state.stone : Math.min(state.stone, cap.stone),
    food:  cap.food  === Infinity ? state.food  : Math.min(state.food,  cap.food),
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

  // Passive building production (skip buildings under construction)
  for (let i = 0; i < s.buildings.length; i++) {
    const b = { ...s.buildings[i] };
    if (b.isUnderConstruction) { s.buildings[i] = b; continue; }
    b.isDecayed = isDecayed;
    const rate = hourlyProductionRate(b);
    if (rate > 0) {
      // Animal production bonus
      let animalMult = 1.0;
      const assignedAnimal = s.animals.find(a => {
        if (a.assignment.type !== 'building') return false;
        return (a.assignment as { type: 'building'; buildingId: string }).buildingId === b.id;
      });
      if (assignedAnimal) {
        const animalCfg = ANIMAL_CONFIGS[assignedAnimal.type];
        if (animalCfg.buildingBonus.bonusType === 'production' || animalCfg.buildingBonus.bonusType === 'global') {
          animalMult = 1.0 + animalCfg.buildingBonus.bonusPercent / 100;
        }
      }
      const produced = rate * (elapsed / 3600.0) * decayMult * animalMult;
      const cap = buildingStorageCap(b, s.buildings);
      b.currentStorage = Math.min(b.currentStorage + produced, cap);
    }
    s.buildings[i] = b;
  }

  // Construction completion
  for (let i = 0; i < s.buildings.length; i++) {
    const b = s.buildings[i];
    if (b.isUnderConstruction && b.constructionEndsAt && now.getTime() >= b.constructionEndsAt) {
      s.buildings[i] = {
        ...b,
        level: b.targetLevel,
        isUnderConstruction: false,
        constructionEndsAt: null,
        constructionWorkerID: null,
      };
      // Free the construction worker
      if (b.constructionWorkerID) {
        const wIdx = s.workers.findIndex(w => w.id === b.constructionWorkerID);
        if (wIdx >= 0) {
          s.workers[wIdx] = { ...s.workers[wIdx], isConstructing: false };
        }
      }
    }
  }

  // Worker auto-collection & hunger checks (skip training and constructing workers)
  const foodAvailable = s.food > 0;
  for (let i = 0; i < s.workers.length; i++) {
    const w = { ...s.workers[i] };
    if (w.isTraining || w.isConstructing) { s.workers[i] = w; continue; }
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

  // --- Storage buildings: specific resource cap reduced ---
  // --- Storage buildings: specific resource cap reduced ---
  const storedResource = storageBuildingResource(building.type);
  if (storedResource !== null) {
    const bonusArr = getStorageBonusArray(building.type);
    const bonusLost = bonusArr ? bonusArr[Math.min(building.level - 1, bonusArr.length - 1)] : 0;
    // Calculate how much of the current resource exceeds the new cap
    const newCap = getTotalStorageCap(state.buildings.filter(b => b.id !== buildingID));
    const currentAmt = state[storedResource as keyof typeof state] as number;
    const overflow = Math.max(0, currentAmt - (newCap[storedResource as keyof typeof newCap] as number));
    if (overflow > 0) {
      resourcesLost[storedResource] = Math.floor(overflow);
    }
    if (bonusLost > 0) {
      warnings.push({
        type: 'storage_cap_reduced', severity: overflow > 0 ? 'danger' : 'warning',
        messageKey: 'sell.warning.storage_cap_reduced',
        values: { amount: bonusLost },
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

  // 5. Storage buildings: cap the affected resource wallet to the new (lower) cap
  const soldStoredResource = storageBuildingResource(building.type);
  if (soldStoredResource !== null) {
    const newCap = getTotalStorageCap(s.buildings);
    const capVal = newCap[soldStoredResource as keyof typeof newCap] as number;
    if (capVal !== Infinity) {
      (s as any)[soldStoredResource] = Math.min((s as any)[soldStoredResource], capVal);
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

    // HRmax-Tracking: ≥140bpm gilt als ≥70% HRmax
    const isIntensive = (workout.averageHeartRate ?? 0) >= 140;
    if (isIntensive) {
      _updateIntensiveTracker(s);
    }
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

  // 3-day milestone — Lastesel
  if (state.currentStreak >= 3 && state.lastStreakMilestone < 3) {
    state.streakTokens += 2;
    state.lastStreakMilestone = 3;
    _grantStreakAnimal(state, 'lastesel');
  }
  // 7-day milestone — Holzbär
  if (state.currentStreak >= 7 && state.lastStreakMilestone < 7) {
    state.streakTokens += 5;
    state.protein += 3;
    state.lastStreakMilestone = 7;
    _grantStreakAnimal(state, 'holzbaer');
  }
  // 14-day milestone — Steinbock
  if (state.currentStreak >= 14 && state.lastStreakMilestone < 14) {
    state.lastStreakMilestone = 14;
    _grantStreakAnimal(state, 'steinbock');
  }
  // 21-day milestone — Kriegswolf (nur wenn Rathaus >= L3)
  if (state.currentStreak >= 21 && state.lastStreakMilestone < 21) {
    state.lastStreakMilestone = 21;
    const rathausLevel = gameStateRathausLevel(state);
    if (rathausLevel >= 3) {
      _grantStreakAnimal(state, 'kriegswolf');
    }
    // If rathaus < 3: no wolf, player sees nothing here — hint shown in UI
  }
  // 30-day milestone — Legendäres Ei
  if (state.currentStreak >= 30 && state.lastStreakMilestone < 30) {
    state.lastStreakMilestone = 30;
    const legendaryEgg: AnimalEgg = {
      id: `egg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
      rarity: 'legendary',
      hatchesInto: 'uralterDrache',
      workoutsRequired: 14,
      workoutsCompleted: 0,
      requiresConsecutive: true,
      requiresMinHRmax: 70,
      obtainedAt: Date.now(),
    };
    state.eggs = [...(state.eggs ?? []), legendaryEgg];
  }
}

/** Helper: grant a streak animal reward. If player already has it → bonus resources instead. */
function _grantStreakAnimal(state: GameState, animalType: AnimalType): void {
  const config = ANIMAL_CONFIGS[animalType];
  // Already owns this type?
  if (state.animals.some(a => a.type === animalType)) {
    // Bonus resources instead of duplicate
    state.wood = (state.wood ?? 0) + 50;
    state.stone = (state.stone ?? 0) + 30;
    return;
  }
  const animal: Animal = {
    id: `animal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
    type: animalType,
    name: config.name,
    rarity: config.rarity,
    assignment: { type: 'idle' },
    obtainedAt: Date.now(),
  };
  // Add regardless of stall capacity (assignment: idle, user gets hint in UI)
  state.animals = [...(state.animals ?? []), animal];
}

/** HRmax-Tracking: Zählt intensive Workouts (≥70% HRmax) und schaltet Tiere frei. */
function _updateIntensiveTracker(state: GameState): void {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const biweekMs = 14 * 24 * 60 * 60 * 1000;

  // Initialisiere tracker falls noch nicht vorhanden (Migration alter States)
  if (!state.intensiveWorkoutTracker) {
    state.intensiveWorkoutTracker = {
      weeklyCount: 0,
      weekStart: now,
      biweeklyCount: 0,
      biweeklyStart: now,
    };
  }

  const tracker = state.intensiveWorkoutTracker;

  let weeklyCount = tracker.weeklyCount + 1;
  let weekStart = tracker.weekStart;
  let biweeklyCount = tracker.biweeklyCount + 1;
  let biweeklyStart = tracker.biweeklyStart;

  if (now - weekStart > weekMs) {
    weeklyCount = 1;
    weekStart = now;
  }
  if (now - biweeklyStart > biweekMs) {
    biweeklyCount = 1;
    biweeklyStart = now;
  }

  state.intensiveWorkoutTracker = { weeklyCount, weekStart, biweeklyCount, biweeklyStart };

  // Spähfalke: 5× ≥70% HRmax in einer Woche
  if (weeklyCount >= 5 && !state.animals.some(a => a.type === 'spaehfalke')) {
    _grantStreakAnimal(state, 'spaehfalke');
  }

  // Mystischer Hirsch: 10× ≥70% HRmax in 14 Tagen
  if (biweeklyCount >= 10 && !state.animals.some(a => a.type === 'mystischerHirsch')) {
    _grantStreakAnimal(state, 'mystischerHirsch');
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
  const rathausLevel = gameStateRathausLevel(state);
  const existing = state.buildings.filter(b => b.type === type).length;
  const allowed = allowedInstances(type, rathausLevel);

  if (existing >= allowed) {
    const nextLevel = nextInstanceUnlockLevel(type, existing);
    if (nextLevel !== null) {
      return [false, `Requires Rathaus level ${nextLevel} to build another.`];
    }
    return [false, 'Maximum instances already built.'];
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
  const duration = constructionTime(type, 1);
  s.buildings.push({
    id: Crypto.randomUUID(),
    type,
    level: 0, // will become 1 when construction completes
    currentStorage: 0,
    assignedWorkerID: null,
    isDecayed: false,
    position,
    isUnderConstruction: true,
    constructionEndsAt: duration > 0 ? Date.now() + duration * 1000 : null,
    constructionWorkerID: null,
    targetLevel: 1,
  });
  return s;
}

export function canUpgrade(state: GameState, buildingID: string): [boolean, string] {
  const b = findBuildingById(state, buildingID);
  if (!b) return [false, 'Building not found.'];
  if (b.isUnderConstruction) return [false, 'Already under construction.'];
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

  const b = s.buildings[idx];
  const cost = upgradeCost(b.type, b.level);
  if (!cost) return null;

  const deducted = deductCost(s, cost);
  const targetLv = b.level + 1;
  const duration = constructionTime(b.type, targetLv);
  deducted.buildings[idx] = {
    ...deducted.buildings[idx],
    isUnderConstruction: true,
    constructionEndsAt: duration > 0 ? Date.now() + duration * 1000 : null,
    constructionWorkerID: null,
    targetLevel: targetLv,
  };
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
    isConstructing: false,
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

// MARK: - Construction Management
export function assignWorkerToConstruction(state: GameState, buildingID: string, workerID: string): GameState | null {
  const building = state.buildings.find(b => b.id === buildingID);
  if (!building || !building.isUnderConstruction) return null;
  if (building.constructionWorkerID) return null; // already has a worker

  const worker = state.workers.find(w => w.id === workerID);
  if (!worker || worker.isTraining || worker.isConstructing) return null;

  const s = { ...state, buildings: [...state.buildings], workers: [...state.workers] };
  const bIdx = s.buildings.findIndex(b => b.id === buildingID);
  const wIdx = s.workers.findIndex(w => w.id === workerID);

  // Halve the remaining construction time
  const now = Date.now();
  const remaining = building.constructionEndsAt ? Math.max(0, building.constructionEndsAt - now) : 0;
  const newEndAt = now + Math.floor(remaining / 2);

  s.buildings[bIdx] = { ...s.buildings[bIdx], constructionWorkerID: workerID, constructionEndsAt: newEndAt };
  s.workers[wIdx] = { ...s.workers[wIdx], isConstructing: true };
  return s;
}

export function skipConstructionWithProtein(state: GameState, buildingID: string): GameState | null {
  const building = state.buildings.find(b => b.id === buildingID);
  if (!building || !building.isUnderConstruction) return null;

  const cost = skipConstructionCost(building.type, building.targetLevel);
  if (state.protein < cost) return null;

  const s = { ...state, buildings: [...state.buildings], workers: [...state.workers], protein: state.protein - cost };
  const bIdx = s.buildings.findIndex(b => b.id === buildingID);

  // Complete construction immediately
  s.buildings[bIdx] = {
    ...s.buildings[bIdx],
    level: building.targetLevel,
    isUnderConstruction: false,
    constructionEndsAt: null,
    constructionWorkerID: null,
  };

  // Free the construction worker
  if (building.constructionWorkerID) {
    const wIdx = s.workers.findIndex(w => w.id === building.constructionWorkerID);
    if (wIdx >= 0) {
      s.workers[wIdx] = { ...s.workers[wIdx], isConstructing: false };
    }
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

  const mkBuilding = (id: string, type: BuildingType, level: number, currentStorage: number, assignedWorkerID: string | null, position: { row: number; col: number }) => ({
    id, type, level, currentStorage, assignedWorkerID, isDecayed: false, position,
    isUnderConstruction: false, constructionEndsAt: null, constructionWorkerID: null, targetLevel: level,
  });

  mock.buildings = [
    mkBuilding(rhId,             BuildingType.rathaus,    2, 0,   null,     { row: 7, col: 7 }),
    mkBuilding(kkId,             BuildingType.kornkammer, 2, 45,  workerId, { row: 6, col: 6 }),
    mkBuilding(Crypto.randomUUID(), BuildingType.holzfaeller, 1, 120, null, { row: 6, col: 7 }),
    mkBuilding(Crypto.randomUUID(), BuildingType.feld,    1, 60,  null,     { row: 7, col: 6 }),
    mkBuilding(Crypto.randomUUID(), BuildingType.holzlager, 1, 0,  null,    { row: 7, col: 8 }),
    mkBuilding(Crypto.randomUUID(), BuildingType.kaserne, 1, 0,   null,     { row: 8, col: 7 }),
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
    isConstructing: false,
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
