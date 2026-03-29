// useGameStore.ts
// FitRealm - Zustand store replacing @EnvironmentObject for GameEngine, VitacoinEngine, HealthKitManager

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState, Building, GridPosition, BuildingType, Obstacle,
  WorkoutRecord, HealthSnapshot, emptyHealthSnapshot,
  createDefaultGameState, gameStateRathausLevel, findBuildingById, workerStatus, WorkerStatus,
  obstacleRemovalCost,
  Animal, AnimalEgg, AnimalAssignment, MonsterWave, WaveResult, DamageEffect, DefenseBreakdown,
  LootDrop, EggRarity, Trophy,
  Goal, SeasonalGoal, GoalStatus,
  UserProfile,
} from '../models/types';
import { calculateHRmax, DEFAULT_HRMAX } from '../utils/hrMax';
import { ANIMAL_CONFIGS, STALL_CONFIG, WAVE_CONFIG, DEFENSE_CONFIG } from '../config/EntityConfig';
import { waveService } from '../services/WaveService';
import { combatService } from '../services/CombatService';
import * as GE from '../engines/GameEngine';
import type { CollectResult, SellConsequences } from '../engines/GameEngine';
import * as VE from '../engines/VitacoinEngine';
import * as HK from '../engines/HealthKitManager';
import * as OM from '../engines/ObstacleManager';
import { ResourceCost, StorageCapacity, getTotalStorageCap, buildCost, upgradeCost, rathausRequirement, UNIQUE_BUILDINGS, Workers } from '../config/GameConfig';
import { useGameStore as useCurrencyStore } from './gameStore';

interface GameStore {
  // User Profile & Onboarding
  userProfile: UserProfile | null;
  hasCompletedOnboarding: boolean;

  // Game State
  gameState: GameState;
  isProcessing: boolean;

  // Vitacoin State
  totalVitacoins: number;
  recentWorkouts: WorkoutRecord[];
  healthSnapshot: HealthSnapshot;
  workoutsToday: number;
  vitacoinsEarnedToday: number;
  workoutsThisMonth: number;
  isSyncing: boolean;

  // HealthKit
  permissionStatus: HK.PermissionStatus;
  useMockData: boolean;

  // Obstacles
  obstacles: Obstacle[];

  // Collect popup
  lastCollectResult: CollectResult | null;

  // Wave System
  pendingWaveResult: {
    wave: MonsterWave;
    result: WaveResult;
    defenseVP: number;
    effectiveAK: number;
    damages: DamageEffect[];
    loot: LootDrop[];
    nextWaveIn: number;
  } | null;

  // Pending hatch result (for schlüpf-animation)
  pendingHatchResult: { animalType: import('../models/types').AnimalType; rarity: import('../models/types').AnimalRarity } | null;

  // Storage capacity (recalculated whenever buildings change)
  storageCap: StorageCapacity;

  // Actions - Init
  initialize: () => Promise<void>;

  // Actions - Game Engine
  processTick: () => void;
  buildBuilding: (type: BuildingType, position: GridPosition) => boolean;
  upgradeBuilding: (buildingID: string) => boolean;
  collectResources: (buildingID: string) => void;
  collectAll: () => CollectResult;
  clearCollectResult: () => void;
  sellBuilding: (id: string) => ResourceCost | null;
  calculateSellConsequences: (id: string) => SellConsequences | null;
  trainWorker: () => boolean;
  assignWorker: (workerID: string, buildingID: string) => void;
  unassignWorker: (workerID: string) => void;
  assignWorkerToConstruction: (buildingID: string, workerID: string) => boolean;
  skipConstruction: (buildingID: string) => boolean;
  unlockZone: (zoneID: number) => boolean;
  startExploration: (zoneID: number) => boolean;
  claimExplorationReward: (zoneID: number) => boolean;

  // Actions - Vitacoin
  syncHealthData: () => Promise<void>;
  addVitacoinsManually: (amount: number) => void;

  // Actions - HealthKit
  requestPermissions: () => Promise<void>;
  toggleMockData: () => Promise<void>;

  // Actions - Debug
  debugAddResources: () => void;
  resetGameState: () => Promise<void>;
  resetAllData: () => Promise<void>;
  loadMockGameState: () => void;

  // Actions - Manual workout injection (dev/test)
  injectManualWorkout: (workout: WorkoutRecord) => void;

  // Actions - Sync currencies between stores
  patchGameStateCurrencies: (patch: Partial<Pick<GameState, 'muskelmasse' | 'protein' | 'streakTokens' | 'currentStreak' | 'wood' | 'stone' | 'food'>>) => void;

  // Actions - Obstacles
  removeSmallObstacle: (id: string) => void;
  startClearingObstacle: (id: string) => void;
  checkObstacleCompletion: () => void;

  // Actions - Entity System (Tiere)
  addAnimal: (animal: Animal) => boolean;
  removeAnimal: (animalId: string) => void;
  assignAnimal: (animalId: string, assignment: AnimalAssignment) => boolean;

  // Actions - Entity System (Eier)
  addEgg: (egg: AnimalEgg) => void;
  removeEgg: (eggId: string) => void;
  incrementEggProgress: (eggId: string) => void;
  hatchEgg: (eggId: string) => Animal | null;

  // Actions - Entity System (Wellen)
  scheduleNextWave: () => void;
  startWave: (wave: MonsterWave) => void;
  resolveWave: (waveId: string, result: WaveResult) => void;
  initializeWaveSystem: () => void;
  triggerWaveResolution: () => void;
  applyLoot: (loot: LootDrop[]) => void;
  clearPendingWaveResult: () => void;

  // Actions - Entity System (Schaden)
  addDamageEffect: (effect: DamageEffect) => void;
  cleanupExpiredEffects: () => void;

  // Actions - Mauer
  updateWallHP: (current: number, max: number) => void;
  repairWall: () => void;

  // Actions - Verteidigung
  calculateDefense: () => DefenseBreakdown;

  // Actions - pendingHatchResult
  clearPendingHatchResult: () => void;

  // Actions - consecutiveEgg check
  checkConsecutiveEggs: () => void;

  // Actions - Trophies (Phase 6)
  addTrophy: (trophy: Trophy) => void;
  placeTrophy: (trophyId: string, position: { x: number; y: number }) => void;

  // Actions - Dragon Unlock (Phase 6)
  clearPendingDragonUnlock: () => void;

  // Pending dragon unlock
  pendingDragonUnlock: boolean;

  // Goals
  goals: Goal[];
  seasonalGoal: SeasonalGoal | null;
  claimedGoalIds: string[];
  claimGoalReward: (goalId: string) => void;
  claimSeasonalTier: (tier: 'bronze' | 'silver' | 'gold') => void;
  refreshGoalProgress: () => void;

  // Actions - User Profile
  setUserProfile: (profile: Omit<UserProfile, 'hrMax' | 'onboardingCompleted'>) => void;
  updateUserProfile: (partial: Partial<Omit<UserProfile, 'hrMax' | 'onboardingCompleted'>>) => void;
  getUserHRmax: () => number;

  // Helpers
  canAfford: (cost: ResourceCost) => boolean;
  hourlyProductionRate: (building: Building) => number;
  buildingStorageCap: (building: Building) => number;
}

// ── Goals initial data ─────────────────────────────────────────────────────

const INITIAL_GOALS: Goal[] = [
  // Fitness
  {
    id: 'fitness-weekly-workouts',
    category: 'fitness',
    difficulty: 'medium',
    status: 'active',
    titleKey: 'goals.fitness.weeklyWorkouts.title',
    descriptionKey: 'goals.fitness.weeklyWorkouts.desc',
    currentValue: 0,
    targetValue: 12,
    unit: 'workouts',
    reward: { muskelmasse: 400, holz: 200 },
    icon: 'run',
  },
  {
    id: 'fitness-steps',
    category: 'fitness',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.fitness.steps.title',
    descriptionKey: 'goals.fitness.steps.desc',
    currentValue: 0,
    targetValue: 150000,
    unit: 'steps',
    reward: { muskelmasse: 200, holz: 300 },
    icon: 'shoe-print',
  },
  {
    id: 'fitness-intense',
    category: 'fitness',
    difficulty: 'hard',
    status: 'active',
    titleKey: 'goals.fitness.intense.title',
    descriptionKey: 'goals.fitness.intense.desc',
    currentValue: 0,
    targetValue: 5,
    unit: 'workouts',
    reward: { muskelmasse: 600, protein: 8 },
    icon: 'fire',
  },
  // Village
  {
    id: 'village-builder',
    category: 'village',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.village.builder.title',
    descriptionKey: 'goals.village.builder.desc',
    currentValue: 0,
    targetValue: 3,
    unit: 'buildings',
    reward: { muskelmasse: 300, holz: 400 },
    icon: 'home-plus',
  },
  {
    id: 'village-workers',
    category: 'village',
    difficulty: 'easy',
    status: 'active',
    titleKey: 'goals.village.workers.title',
    descriptionKey: 'goals.village.workers.desc',
    currentValue: 0,
    targetValue: 2,
    unit: 'workers',
    reward: { muskelmasse: 200, protein: 3 },
    icon: 'account-hard-hat',
  },
  {
    id: 'village-resources',
    category: 'village',
    difficulty: 'medium',
    status: 'active',
    titleKey: 'goals.village.resources.title',
    descriptionKey: 'goals.village.resources.desc',
    currentValue: 0,
    targetValue: 1000,
    unit: 'holz',
    reward: { muskelmasse: 250, protein: 3 },
    icon: 'treasure-chest',
  },
];

const CURRENT_SEASONAL_GOAL: SeasonalGoal = {
  id: 'seasonal-2026-03',
  titleKey: 'goals.seasonal.warrior.title',
  descriptionKey: 'goals.seasonal.warrior.desc',
  month: 3,
  year: 2026,
  icon: 'sword',
  deadline: '2026-03-31T23:59:59Z',
  tiers: [
    { tier: 'bronze', targetValue: 12, currentValue: 0, status: 'active',  reward: { muskelmasse: 400, holz: 400 } },
    { tier: 'silver', targetValue: 18, currentValue: 0, status: 'locked',  reward: { muskelmasse: 800, protein: 6 } },
    { tier: 'gold',   targetValue: 24, currentValue: 0, status: 'locked',  reward: { muskelmasse: 1500, protein: 15 } },
  ],
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  userProfile: null,
  hasCompletedOnboarding: false,
  gameState: createDefaultGameState(),
  isProcessing: false,
  totalVitacoins: 0,
  recentWorkouts: [],
  healthSnapshot: emptyHealthSnapshot,
  workoutsToday: 0,
  vitacoinsEarnedToday: 0,
  workoutsThisMonth: 0,
  isSyncing: false,
  permissionStatus: {},
  useMockData: false,
  obstacles: [],
  lastCollectResult: null,
  pendingWaveResult: null,
  pendingHatchResult: null,
  pendingDragonUnlock: false,
  storageCap: getTotalStorageCap([]),
  goals: INITIAL_GOALS,
  seasonalGoal: CURRENT_SEASONAL_GOAL,
  claimedGoalIds: [],

  // MARK: - Initialize
  async initialize() {
    // Load game state
    let gs = await GE.loadGameState();
    gs = GE.initializeState(gs);
    await GE.saveGameState(gs);

    // Load vitacoin state
    const vs = await VE.loadVitacoinState();

    // Load mock data preference — auto-enable on first launch (HealthKit unavailable in Expo Go)
    let mockData = await HK.getUseMockData();
    const firstLaunchKey = 'fitrealmFirstLaunchDone';
    const firstLaunchDone = await AsyncStorage.getItem(firstLaunchKey);
    if (!firstLaunchDone) {
      // First launch: enable mock data so screens show content immediately
      mockData = true;
      await HK.setUseMockData(true);
      await AsyncStorage.setItem(firstLaunchKey, 'true');
    }

    // Load obstacles
    const obstacles = await OM.loadObstacles();

    // Load user profile from AsyncStorage
    let userProfile: UserProfile | null = null;
    let hasCompletedOnboarding = false;
    try {
      const profileJson = await AsyncStorage.getItem('fitrealm_user_profile');
      if (profileJson) {
        userProfile = JSON.parse(profileJson) as UserProfile;
        hasCompletedOnboarding = userProfile.onboardingCompleted;
      }
    } catch { /* ignore parse errors */ }

    // Existing users who already have buildings but no profile → treat as onboarded
    if (!hasCompletedOnboarding && gs.buildings.length > 0) {
      hasCompletedOnboarding = true;
    }

    set({
      gameState: gs,
      totalVitacoins: vs.totalVitacoins ?? 0,
      recentWorkouts: vs.recentWorkouts ?? [],
      vitacoinsEarnedToday: vs.vitacoinsEarnedToday ?? 0,
      useMockData: mockData,
      obstacles,
      storageCap: getTotalStorageCap(gs.buildings),
      userProfile,
      hasCompletedOnboarding,
    });

    // If mock mode, load the mock game state with pre-built buildings
    if (mockData) {
      get().loadMockGameState();
    }

    // Process tick on startup
    get().processTick();

    // Sync engine → currency store so both have the same values on startup
    _syncAllCurrencies(get().gameState);

    // Auto-sync health data
    await get().syncHealthData();
  },

  // MARK: - Game Engine Actions
  processTick() {
    const newState = GE.processTick(get().gameState);
    set({ gameState: newState, storageCap: getTotalStorageCap(newState.buildings) });
    GE.saveGameState(newState);
  },

  buildBuilding(type, position) {
    const prevState = get().gameState;
    const isFirstStall = type === BuildingType.stall &&
      !prevState.buildings.some(b => b.type === BuildingType.stall);

    const result = GE.buildBuilding(prevState, type, position);
    if (!result) return false;

    // Gift Erntehuhn when the first stall is placed
    let finalState = result;
    if (isFirstStall) {
      const erntehuhn: Animal = {
        id: `animal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
        type: 'erntehuhn',
        name: ANIMAL_CONFIGS['erntehuhn'].name,
        rarity: 'common',
        assignment: { type: 'idle' },
        obtainedAt: Date.now(),
      };
      finalState = { ...finalState, animals: [...finalState.animals, erntehuhn] };
    }

    // Initialize wallHP when Mauer is built (level 1 after construction completes → targetLevel 1)
    if (type === BuildingType.mauer) {
      // The building starts at level 0 (under construction), wallHP will be set when construction completes.
      // We initialize with the target level (1) so it's ready.
      const initialHP = 1 * 50; // L1: 50 HP
      finalState = { ...finalState, wallHP: { current: initialHP, max: initialHP } };
    }

    set({ gameState: finalState, storageCap: getTotalStorageCap(finalState.buildings) });
    GE.saveGameState(finalState);
    _syncAllCurrencies(finalState);
    return true;
  },

  upgradeBuilding(buildingID) {
    const prevGs = get().gameState;
    const result = GE.upgradeBuilding(prevGs, buildingID);
    if (!result) return false;

    // Update wallHP when Mauer is upgraded
    let finalResult = result;
    const upgradedBuilding = result.buildings.find(b => b.id === buildingID);
    if (upgradedBuilding && upgradedBuilding.type === BuildingType.mauer && upgradedBuilding.level >= 1) {
      const newMax = upgradedBuilding.level * 50;
      finalResult = { ...result, wallHP: { current: newMax, max: newMax } };
    }

    set({ gameState: finalResult, storageCap: getTotalStorageCap(finalResult.buildings) });
    GE.saveGameState(finalResult);
    _syncAllCurrencies(finalResult);
    return true;
  },

  collectResources(buildingID) {
    const result = GE.collectResources(get().gameState, buildingID);
    set({ gameState: result });
    GE.saveGameState(result);
  },

  collectAll() {
    const { newState, result } = GE.collectAllWithResult(get().gameState);
    set({
      gameState: newState,
      // Only surface popup when at least one building contributed resources
      lastCollectResult: result.totalBuildings > 0 ? result : null,
    });
    GE.saveGameState(newState);
    return result;
  },

  clearCollectResult() {
    set({ lastCollectResult: null });
  },

  sellBuilding(id) {
    const prevGs = get().gameState;
    const result = GE.sellBuilding(prevGs, id);
    if (!result) return null;

    let finalState = result.newState;

    // Stall-Verkauf: Alle dem Stall zugewiesenen Tiere → idle
    const soldBuilding = prevGs.buildings.find(b => b.id === id);
    if (soldBuilding?.type === BuildingType.stall) {
      finalState = {
        ...finalState,
        animals: finalState.animals.map(a =>
          a.assignment.type === 'building'
            ? { ...a, assignment: { type: 'idle' as const } }
            : a,
        ),
      };
    } else if (soldBuilding) {
      // Beliebiges anderes Gebäude: Zugewiesene Tiere → idle
      finalState = {
        ...finalState,
        animals: finalState.animals.map(a =>
          (a.assignment.type === 'building' && (a.assignment as { type: 'building'; buildingId: string }).buildingId === id)
            ? { ...a, assignment: { type: 'idle' as const } }
            : a,
        ),
      };
    }

    set({ gameState: finalState, storageCap: getTotalStorageCap(finalState.buildings) });
    GE.saveGameState(finalState);
    _syncAllCurrencies(finalState);
    return result.refund;
  },

  calculateSellConsequences(id) {
    return GE.calculateSellConsequences(get().gameState, id);
  },

  trainWorker() {
    const result = GE.trainWorker(get().gameState);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  assignWorker(workerID, buildingID) {
    const result = GE.assignWorker(get().gameState, workerID, buildingID);
    set({ gameState: result });
    GE.saveGameState(result);
  },

  unassignWorker(workerID) {
    const result = GE.unassignWorker(get().gameState, workerID);
    set({ gameState: result });
    GE.saveGameState(result);
  },

  assignWorkerToConstruction(buildingID, workerID) {
    const result = GE.assignWorkerToConstruction(get().gameState, buildingID, workerID);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  skipConstruction(buildingID) {
    const result = GE.skipConstructionWithProtein(get().gameState, buildingID);
    if (!result) return false;
    set({ gameState: result, storageCap: getTotalStorageCap(result.buildings) });
    GE.saveGameState(result);
    return true;
  },

  unlockZone(zoneID) {
    const result = GE.unlockZone(get().gameState, zoneID);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  startExploration(zoneID) {
    const result = GE.startExploration(get().gameState, zoneID);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  claimExplorationReward(zoneID) {
    const result = GE.claimExplorationReward(get().gameState, zoneID);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  // MARK: - Vitacoin Actions
  async syncHealthData() {
    if (get().isSyncing) return;
    set({ isSyncing: true });

    try {
      if (get().useMockData) {
        const mockState = VE.syncMockData();
        set({ ...mockState });

        // Forward workouts to game engine
        const gs = GE.processWorkouts(get().gameState, mockState.recentWorkouts, mockState.healthSnapshot, get().userProfile?.hrMax ?? DEFAULT_HRMAX);
        set({ gameState: gs, storageCap: getTotalStorageCap(gs.buildings) });
        GE.saveGameState(gs);
      } else {
        // Real HealthKit sync (stubs for managed workflow)
        const snapshot = await HK.fetchHealthSnapshot();
        set({ healthSnapshot: snapshot });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const workoutsToday = get().recentWorkouts.filter(w => new Date(w.date) >= todayStart).length;
        set({ workoutsToday });
      }
    } catch (e) {
      console.log('[Store] Sync error:', e);
    } finally {
      set({ isSyncing: false });
    }
  },

  addVitacoinsManually(amount) {
    set(s => ({
      totalVitacoins: s.totalVitacoins + amount,
      vitacoinsEarnedToday: s.vitacoinsEarnedToday + amount,
    }));
  },

  // MARK: - HealthKit Actions
  async requestPermissions() {
    const status = await HK.requestPermissions();
    set({ permissionStatus: status });
  },

  async toggleMockData() {
    const newVal = !get().useMockData;
    await HK.setUseMockData(newVal);
    set({ useMockData: newVal });

    if (newVal) {
      get().loadMockGameState();
    } else {
      await get().resetGameState();
    }
    await get().syncHealthData();
  },

  // MARK: - Debug Actions
  debugAddResources() {
    const result = GE.debugAddResources(get().gameState);
    set({ gameState: result });
    GE.saveGameState(result);
  },

  async resetGameState() {
    const gs = GE.initializeState(createDefaultGameState());
    set({ gameState: gs });
    await GE.saveGameState(gs);
    const obstacles = OM.generateObstacles();
    set({ obstacles });
    await OM.saveObstacles(obstacles);
  },

  async resetAllData() {
    const vs = await VE.resetAllVitacoinData();
    set({
      totalVitacoins: vs.totalVitacoins,
      recentWorkouts: vs.recentWorkouts,
      healthSnapshot: vs.healthSnapshot,
      workoutsToday: vs.workoutsToday,
      vitacoinsEarnedToday: vs.vitacoinsEarnedToday,
      workoutsThisMonth: vs.workoutsThisMonth,
    });
    await get().resetGameState();
  },

  loadMockGameState() {
    const mock = GE.loadMockGameState();
    set({ gameState: mock, storageCap: getTotalStorageCap(mock.buildings) });
    GE.saveGameState(mock);
  },

  // MARK: - Manual Workout Injection
  injectManualWorkout(workout) {
    // Add to recentWorkouts list
    const updatedWorkouts = [...get().recentWorkouts, workout];
    set({ recentWorkouts: updatedWorkouts });

    // Process through game engine (calculates muskelmasse, protein, streak, etc.)
    const prevGs = get().gameState;
    const newGs = GE.processWorkouts(prevGs, updatedWorkouts, get().healthSnapshot, get().userProfile?.hrMax ?? DEFAULT_HRMAX);
    set({ gameState: newGs, storageCap: getTotalStorageCap(newGs.buildings) });
    GE.saveGameState(newGs);

    // Sync earned currencies to the currency store
    _syncAllCurrencies(newGs);

    console.log(`[Store] Manual workout injected: ${workout.durationMinutes}min, ${workout.averageHeartRate ?? '?'}bpm → +${Math.floor(newGs.muskelmasse - prevGs.muskelmasse)}g Muskelmasse`);
    get().refreshGoalProgress();

    // Ei-Fortschritt prüfen
    const gs = get().gameState;
    const eggs = gs.eggs;
    if (eggs.length > 0) {
      const workoutDate = new Date(workout.date);
      // averageHeartRate / userHRmax * 100 als % HRmax
      const userHRmax = get().userProfile?.hrMax ?? DEFAULT_HRMAX;
      const workoutHRmax = workout.averageHeartRate ? (workout.averageHeartRate / userHRmax) * 100 : 0;

      for (const egg of eggs) {
        if (egg.workoutsCompleted >= egg.workoutsRequired) continue;

        // HRmax-Bedingung prüfen
        if (egg.requiresMinHRmax !== null && workoutHRmax < egg.requiresMinHRmax) continue;

        // Consecutive-Bedingung prüfen
        if (egg.requiresConsecutive) {
          const yesterday = new Date(workoutDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const currentGs = get().gameState;
          const trainedYesterday = currentGs.lastWorkoutDate
            ? new Date(currentGs.lastWorkoutDate).toDateString() === yesterday.toDateString()
            : false;
          if (!trainedYesterday && egg.workoutsCompleted > 0) {
            // Reset consecutive egg
            const resetGs = get().gameState;
            const resetEggs = resetGs.eggs.map(e =>
              e.id === egg.id ? { ...e, workoutsCompleted: 0 } : e,
            );
            const resetState = { ...resetGs, eggs: resetEggs };
            set({ gameState: resetState });
            GE.saveGameState(resetState);
            continue;
          }
        }

        // Fortschritt erhöhen
        get().incrementEggProgress(egg.id);

        // Prüfen ob reif
        const updatedGs = get().gameState;
        const updatedEgg = updatedGs.eggs.find(e => e.id === egg.id);
        if (updatedEgg && updatedEgg.workoutsCompleted >= updatedEgg.workoutsRequired) {
          const hatchedAnimal = get().hatchEgg(egg.id);
          if (hatchedAnimal) {
            // pendingHatchResult setzen für Animation
            const finalGs = get().gameState;
            const newFinalGs = {
              ...finalGs,
              pendingHatchResult: { animalType: hatchedAnimal.type, rarity: hatchedAnimal.rarity },
            };
            set({ gameState: newFinalGs, pendingHatchResult: { animalType: hatchedAnimal.type, rarity: hatchedAnimal.rarity } });
            GE.saveGameState(newFinalGs);
          }
        }
      }
    }
  },

  // MARK: - Patch GameState Currencies (for dev tools sync)
  patchGameStateCurrencies(patch) {
    const gs = get().gameState;
    const updatedGs = { ...gs, ...patch };
    set({ gameState: updatedGs });
    GE.saveGameState(updatedGs);
  },

  // MARK: - Obstacle Actions
  removeSmallObstacle(id) {
    // Find the obstacle before removing it so we can compute its cost
    const obstacle = get().obstacles.find(o => o.id === id);
    const cost = obstacle ? obstacleRemovalCost(obstacle.type) : 0;

    // Mark obstacle as cleared
    const obstacles = OM.removeSmallObstacle(get().obstacles, id);
    set({ obstacles });
    OM.saveObstacles(obstacles);

    // Deduct Muskelmasse cost (15g for small obstacles) and persist
    if (cost > 0) {
      const gs = get().gameState;
      const updatedGs = { ...gs, muskelmasse: Math.max(0, gs.muskelmasse - cost) };
      set({ gameState: updatedGs });
      GE.saveGameState(updatedGs);
      _syncAllCurrencies(updatedGs);
    }
  },

  startClearingObstacle(id) {
    const obstacles = OM.startClearingObstacle(get().obstacles, id);
    set({ obstacles });
    OM.saveObstacles(obstacles);
  },

  checkObstacleCompletion() {
    const obstacles = OM.checkObstacleCompletion(get().obstacles);
    if (obstacles !== get().obstacles) {
      set({ obstacles });
      OM.saveObstacles(obstacles);
    }
  },

  // MARK: - Entity System — Tiere

  addAnimal(animal) {
    const gs = get().gameState;
    // Prüfe Stall-Kapazität
    const stall = gs.buildings.find(b => b.type === BuildingType.stall && b.level >= 1);
    const maxSlots = stall
      ? STALL_CONFIG.slotsPerLevel[Math.min(stall.level, STALL_CONFIG.slotsPerLevel.length - 1)]
      : 0;
    if (gs.animals.length >= maxSlots) return false;

    const newGs = { ...gs, animals: [...gs.animals, animal] };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
    return true;
  },

  removeAnimal(animalId) {
    const gs = get().gameState;
    const newGs = { ...gs, animals: gs.animals.filter(a => a.id !== animalId) };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  assignAnimal(animalId, assignment) {
    const gs = get().gameState;
    const animal = gs.animals.find(a => a.id === animalId);
    if (!animal) return false;

    // Prüfe ob Assignment gültig ist
    if (assignment.type === 'building') {
      const buildingExists = gs.buildings.some(b => b.id === assignment.buildingId && b.level >= 1);
      if (!buildingExists) return false;
      // Prüfe ob das Gebäude nicht schon von einem anderen Tier belegt ist
      const alreadyOccupied = gs.animals.some(
        a => a.id !== animalId &&
             a.assignment.type === 'building' &&
             (a.assignment as { type: 'building'; buildingId: string }).buildingId === assignment.buildingId,
      );
      if (alreadyOccupied) return false;
    }

    const newGs = {
      ...gs,
      animals: gs.animals.map(a => a.id === animalId ? { ...a, assignment } : a),
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
    return true;
  },

  // MARK: - Entity System — Eier

  addEgg(egg) {
    const gs = get().gameState;
    const newGs = { ...gs, eggs: [...gs.eggs, egg] };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  removeEgg(eggId) {
    const gs = get().gameState;
    const newGs = { ...gs, eggs: gs.eggs.filter(e => e.id !== eggId) };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  incrementEggProgress(eggId) {
    const gs = get().gameState;
    const newGs = {
      ...gs,
      eggs: gs.eggs.map(e =>
        e.id === eggId
          ? { ...e, workoutsCompleted: e.workoutsCompleted + 1 }
          : e,
      ),
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  hatchEgg(eggId) {
    const gs = get().gameState;
    const egg = gs.eggs.find(e => e.id === eggId);
    if (!egg) return null;
    if (egg.workoutsCompleted < egg.workoutsRequired) return null;

    // Prüfe Stall-Kapazität
    const stall = gs.buildings.find(b => b.type === BuildingType.stall && b.level >= 1);
    const maxSlots = stall
      ? STALL_CONFIG.slotsPerLevel[Math.min(stall.level, STALL_CONFIG.slotsPerLevel.length - 1)]
      : 0;
    if (gs.animals.length >= maxSlots) return null;

    const config = ANIMAL_CONFIGS[egg.hatchesInto];
    const animal: Animal = {
      id: `animal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
      type: egg.hatchesInto,
      name: config.name,
      rarity: egg.rarity,
      assignment: { type: 'idle' },
      obtainedAt: Date.now(),
    };

    const newGs = {
      ...gs,
      eggs: gs.eggs.filter(e => e.id !== eggId),
      animals: [...gs.animals, animal],
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
    return animal;
  },

  // MARK: - Entity System — Wellen

  scheduleNextWave() {
    const { minIntervalMs, maxIntervalMs } = WAVE_CONFIG;
    const interval = minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
    const nextWaveAt = Date.now() + interval;
    const newGs = { ...get().gameState, nextWaveAt };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  startWave(wave) {
    const gs = get().gameState;
    const newGs = {
      ...gs,
      activeWave: wave,
      waves: [...gs.waves, wave],
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  resolveWave(waveId, result) {
    const gs = get().gameState;
    const resolvedAt = Date.now();
    const updatedWaves = gs.waves.map(w =>
      w.id === waveId ? { ...w, status: 'resolved' as const, resolvedAt, result } : w,
    );
    const activeWave = gs.activeWave?.id === waveId ? null : gs.activeWave;
    const newGs = { ...gs, waves: updatedWaves, activeWave };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  // MARK: - Wave System Initialization

  initializeWaveSystem() {
    const gs = get().gameState;

    if (!gs.nextWaveAt) {
      // No wave scheduled → schedule one
      get().scheduleNextWave();
      return;
    }

    // Wenn nextWaveAt vor mehr als 14 Tagen → nur eine Welle auflösen, kein Backlog
    const fourteenDaysAgo = Date.now() - 14 * 24 * 3600 * 1000;
    if (gs.nextWaveAt < fourteenDaysAgo) {
      // Setze nextWaveAt auf "vor 1 Minute" damit nur eine Welle aufgelöst wird
      const patchedGs: GameState = { ...gs, nextWaveAt: Date.now() - 60 * 1000 };
      set({ gameState: patchedGs });
      GE.saveGameState(patchedGs);
    }

    const currentGs = get().gameState;
    if (currentGs.nextWaveAt && currentGs.nextWaveAt <= Date.now()) {
      // Wave time has passed → resolve offline combat
      if (currentGs.activeWave && currentGs.activeWave.status !== 'resolved') {
        // Existing active wave — resolve it
        get().triggerWaveResolution();
      } else {
        // Generate a new wave and immediately resolve it
        const rathausLevel = gameStateRathausLevel(currentGs);
        const lastWorkoutTs = currentGs.lastWorkoutDate
          ? new Date(currentGs.lastWorkoutDate).getTime()
          : Date.now() - 72 * 60 * 60 * 1000;
        const watchtowerBuilding = currentGs.buildings.find(b => b.type === BuildingType.wachturm && b.level >= 1 && !b.isUnderConstruction);
        const watchtowerLevel = watchtowerBuilding?.level ?? 0;
        const hasScoutFalcon = currentGs.animals.some(a => a.type === 'spaehfalke' && a.assignment.type === 'defense');
        const wave = waveService.generateWave(rathausLevel, lastWorkoutTs, watchtowerLevel, hasScoutFalcon);
        const startWaveGs: GameState = {
          ...currentGs,
          activeWave: { ...wave, status: 'active' },
          waves: [...currentGs.waves, { ...wave, status: 'active' }],
        };
        set({ gameState: startWaveGs });
        GE.saveGameState(startWaveGs);
        get().triggerWaveResolution();
      }
    }
    // If nextWaveAt is in the future, nothing to do — the UI will show a countdown
  },

  triggerWaveResolution() {
    const gs = get().gameState;
    if (!gs.activeWave) return;

    const defense = get().calculateDefense();
    const rathausLevel = gameStateRathausLevel(gs);
    const activeWaveCopy = gs.activeWave;

    // Bestimme ob Blutwelle oder Boss-Event
    const isBloodWaveDue = waveService.isBloodWaveDue(gs.lastBloodWaveAt);
    const isBossEventDue = waveService.isBossEventDue(gs.lastBossEventAt, rathausLevel);
    const isBossWave = isBossEventDue && (
      activeWaveCopy.monsters[0]?.type === 'uralterGolem' ||
      activeWaveCopy.monsters[0]?.type === 'verderbnisHydra'
    );
    const isBloodWave = isBloodWaveDue && !isBossWave;

    let combatResult: { result: WaveResult; damages: DamageEffect[]; loot: LootDrop[]; effectiveAK: number; wallHPUsed: number };

    if (isBossWave && activeWaveCopy.monsters[0]?.type === 'uralterGolem') {
      const r = combatService.resolveBossGolem(defense, activeWaveCopy, gs.wallHP);
      combatResult = { result: r.result, damages: r.damages, loot: r.loot, effectiveAK: activeWaveCopy.totalAttackPower, wallHPUsed: r.wallHPUsed };
    } else if (isBossWave && activeWaveCopy.monsters[0]?.type === 'verderbnisHydra') {
      const r = combatService.resolveBossHydra(defense, activeWaveCopy, gs.animals);
      combatResult = { result: r.result, damages: r.damages, loot: r.loot, effectiveAK: activeWaveCopy.totalAttackPower, wallHPUsed: r.wallHPUsed };
    } else {
      // Normale Welle oder Blutwelle
      const waveToResolve = isBloodWave
        ? waveService.applyBloodWaveModifiers(activeWaveCopy)
        : activeWaveCopy;
      const r = combatService.resolveCombat(defense, waveToResolve, gs.animals, gs.buildings, gs.wallHP);
      // Felder für Blutwelle setzen
      const resultWithFlags: WaveResult = { ...r.result, isBloodWave };
      combatResult = { ...r, result: resultWithFlags };
    }

    const { result, damages, loot, effectiveAK, wallHPUsed } = combatResult;

    const resolvedAt = Date.now();
    const resolvedWave: MonsterWave = {
      ...activeWaveCopy,
      status: 'resolved',
      resolvedAt,
      result,
    };

    // Apply damages
    const allDamages = [...gs.damageEffects, ...damages];

    // Apply loot
    get().applyLoot(loot);

    // Update state
    const updatedGs = get().gameState; // re-read after applyLoot
    const updatedWaves = updatedGs.waves.map(w =>
      w.id === resolvedWave.id ? resolvedWave : w,
    );
    const waveInArray = updatedWaves.find(w => w.id === resolvedWave.id);
    const finalWaves = waveInArray ? updatedWaves : [...updatedWaves, resolvedWave];

    // Schedule next wave
    const nextWaveAt = waveService.scheduleNextWave(resolvedAt);

    // Update wallHP if Mauer absorbed damage
    let newWallHP = updatedGs.wallHP;
    if (wallHPUsed > 0 && newWallHP) {
      newWallHP = { ...newWallHP, current: Math.max(0, newWallHP.current - wallHPUsed) };
    }

    // Nach Boss-Sieg: Trophäe vergeben
    const bossWon = isBossWave && (result.outcome === 'perfect' || result.outcome === 'defended');
    let newTrophies = [...updatedGs.trophies];
    if (bossWon && activeWaveCopy.monsters[0]?.type === 'uralterGolem') {
      const trophy: Trophy = {
        id: `trophy_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'golemHerz',
        name: 'Herz des Uralten Golems',
        emoji: '🔮',
        obtainedAt: Date.now(),
        gridPosition: null,
      };
      newTrophies = [...newTrophies, trophy];
    } else if (bossWon && activeWaveCopy.monsters[0]?.type === 'verderbnisHydra') {
      const trophy: Trophy = {
        id: `trophy_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: 'hydraSchuppe',
        name: 'Schuppe der Verderbnis-Hydra',
        emoji: '🐍',
        obtainedAt: Date.now(),
        gridPosition: null,
      };
      newTrophies = [...newTrophies, trophy];
    }

    // Uralter Drache freischalten: Streak ≥ 30 und Boss besiegt
    const dragonAlreadyOwned = updatedGs.animals.some(a => a.type === 'uralterDrache');
    const shouldUnlockDragon = bossWon && updatedGs.currentStreak >= 30 && !dragonAlreadyOwned;

    const finalGs: GameState = {
      ...updatedGs,
      activeWave: null,
      waves: finalWaves,
      nextWaveAt,
      damageEffects: allDamages,
      wallHP: newWallHP,
      trophies: newTrophies,
      lastBloodWaveAt: isBloodWave ? Date.now() : updatedGs.lastBloodWaveAt,
      lastBossEventAt: isBossWave ? Date.now() : (updatedGs.lastBossEventAt ?? Date.now()),
      pendingDragonUnlock: shouldUnlockDragon,
    };
    set({ gameState: finalGs, pendingDragonUnlock: shouldUnlockDragon });
    GE.saveGameState(finalGs);

    // Set pending result for UI
    set({
      pendingWaveResult: {
        wave: resolvedWave,
        result,
        defenseVP: defense.totalVP,
        effectiveAK,
        damages,
        loot,
        nextWaveIn: nextWaveAt - Date.now(),
      },
    });
  },

  applyLoot(loot) {
    const gs = get().gameState;
    let updatedGs = { ...gs };
    const newEggs: AnimalEgg[] = [];

    for (const drop of loot) {
      switch (drop.type) {
        case 'muskelmasse':
          updatedGs = { ...updatedGs, muskelmasse: updatedGs.muskelmasse + drop.amount };
          break;
        case 'protein':
          updatedGs = { ...updatedGs, protein: updatedGs.protein + drop.amount };
          break;
        case 'holz':
          updatedGs = { ...updatedGs, wood: updatedGs.wood + drop.amount };
          break;
        case 'stein':
          updatedGs = { ...updatedGs, stone: updatedGs.stone + drop.amount };
          break;
        case 'nahrung':
          updatedGs = { ...updatedGs, food: updatedGs.food + drop.amount };
          break;
        case 'egg': {
          // Generate an egg
          const { EGG_HATCH_CONFIGS, ANIMAL_CONFIGS: AC } = require('../config/EntityConfig');
          const rarity: EggRarity = (drop.eggRarity as EggRarity) ?? 'common';
          const cfg = EGG_HATCH_CONFIGS[rarity];
          // Pick a random animal type that matches the rarity
          const possibleTypes = Object.values(AC).filter(
            (ac: any) => ac.rarity === rarity,
          ) as any[];
          if (possibleTypes.length > 0) {
            const chosenAnimal = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
            const egg: AnimalEgg = {
              id: `egg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              rarity,
              hatchesInto: chosenAnimal.type,
              workoutsRequired: cfg.workoutsRequired,
              workoutsCompleted: 0,
              requiresConsecutive: cfg.requiresConsecutive,
              requiresMinHRmax: cfg.requiresMinHRmax,
              obtainedAt: Date.now(),
            };
            newEggs.push(egg);
          }
          break;
        }
      }
    }

    if (newEggs.length > 0) {
      updatedGs = { ...updatedGs, eggs: [...updatedGs.eggs, ...newEggs] };
    }

    set({ gameState: updatedGs });
    GE.saveGameState(updatedGs);
    _syncAllCurrencies(updatedGs);
  },

  clearPendingWaveResult() {
    set({ pendingWaveResult: null });
  },

  // MARK: - Mauer HP Aktionen

  updateWallHP(current, max) {
    const gs = get().gameState;
    const newGs = { ...gs, wallHP: { current, max } };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  repairWall() {
    const gs = get().gameState;
    if (!gs.wallHP) return;
    const mauerBuilding = gs.buildings.find(b => b.type === BuildingType.mauer && b.level >= 1 && !b.isUnderConstruction);
    if (!mauerBuilding) return;
    const missingHP = gs.wallHP.max - gs.wallHP.current;
    if (missingHP <= 0) return;
    const repairCost = Math.ceil(missingHP * 20 / gs.wallHP.max * mauerBuilding.level);
    if (gs.wood < repairCost) return;
    const newGs = {
      ...gs,
      wood: gs.wood - repairCost,
      wallHP: { current: gs.wallHP.max, max: gs.wallHP.max },
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  // MARK: - Entity System — Schadens-Effekte

  addDamageEffect(effect) {
    const gs = get().gameState;
    const newGs = { ...gs, damageEffects: [...gs.damageEffects, effect] };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  cleanupExpiredEffects() {
    const gs = get().gameState;
    const now = Date.now();
    const active = gs.damageEffects.filter(e => e.endsAt > now);
    if (active.length !== gs.damageEffects.length) {
      const newGs = { ...gs, damageEffects: active };
      set({ gameState: newGs });
      GE.saveGameState(newGs);
    }
  },

  // MARK: - pendingHatchResult

  clearPendingHatchResult() {
    set({ pendingHatchResult: null });
    // Also clear in gameState
    const gs = get().gameState;
    if (gs.pendingHatchResult !== null) {
      const newGs = { ...gs, pendingHatchResult: null };
      set({ gameState: newGs });
      GE.saveGameState(newGs);
    }
  },

  // MARK: - Consecutive Egg Check

  checkConsecutiveEggs() {
    const gs = get().gameState;
    const lastWorkout = gs.lastWorkoutDate ? new Date(gs.lastWorkoutDate) : null;
    if (!lastWorkout) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const lastWorkoutDay = new Date(lastWorkout);
    lastWorkoutDay.setHours(0, 0, 0, 0);
    const todayDay = new Date();
    todayDay.setHours(0, 0, 0, 0);

    // Missed yesterday: lastWorkout is before yesterday
    const missedYesterday = lastWorkoutDay < yesterday && lastWorkoutDay.toDateString() !== yesterday.toDateString();

    if (missedYesterday) {
      const consecutiveEggs = gs.eggs.filter(e => e.requiresConsecutive && e.workoutsCompleted > 0);
      if (consecutiveEggs.length > 0) {
        const resetEggs = gs.eggs.map(e =>
          e.requiresConsecutive && e.workoutsCompleted > 0
            ? { ...e, workoutsCompleted: 0 }
            : e,
        );
        const newGs = { ...gs, eggs: resetEggs };
        set({ gameState: newGs });
        GE.saveGameState(newGs);
      }
    }
  },

  // MARK: - Verteidigungs-Berechnung

  calculateDefense() {
    const gs = get().gameState;
    const workouts = get().recentWorkouts;

    // basisVP: aus Gebäuden (Rathaus, Kaserne, Wachturm, Mauer)
    let basisVP = 0;
    for (const b of gs.buildings) {
      if (b.level < 1 || b.isUnderConstruction) continue;
      const vpPerLevel = DEFENSE_CONFIG.buildingVP[b.type];
      if (vpPerLevel) basisVP += vpPerLevel * b.level;
    }

    // workoutVP: aus Workouts der letzten 24h
    const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
    let workoutVP = 0;
    for (const w of workouts) {
      if (new Date(w.date).getTime() < cutoff24h) continue;
      // ~70% HRmax gilt als "intensiv"
      const hrMaxThreshold = Math.round((get().userProfile?.hrMax ?? DEFAULT_HRMAX) * 0.7);
      const intense = (w.averageHeartRate ?? 0) >= hrMaxThreshold;
      const rate = intense ? DEFENSE_CONFIG.vpPerIntenseMinute : DEFENSE_CONFIG.vpPerWorkoutMinute;
      workoutVP += w.durationMinutes * rate;
    }

    // workerVP: Worker in Verteidigung (zukünftiges Feature, aktuell 0)
    const workerVP = 0;

    // animalVP: Tiere die der Verteidigung zugewiesen sind
    let animalVP = 0;
    for (const a of gs.animals) {
      if (a.assignment.type === 'defense') {
        animalVP += ANIMAL_CONFIGS[a.type].defenseVP;
      }
    }

    // streakBonus: 5% pro Streak-Tag (als Multiplikator)
    const streakBonus = gs.currentStreak * DEFENSE_CONFIG.streakBonusPerDay;

    const totalVP = Math.round((basisVP + workoutVP + workerVP + animalVP) * (1 + streakBonus));

    return { basisVP, workoutVP, workerVP, animalVP, streakBonus, totalVP };
  },

  // MARK: - User Profile

  setUserProfile(profile) {
    const hrMax = calculateHRmax(profile.age);
    const userProfile: UserProfile = {
      ...profile,
      hrMax,
      onboardingCompleted: true,
    };
    set({ userProfile, hasCompletedOnboarding: true });
    AsyncStorage.setItem('fitrealm_user_profile', JSON.stringify(userProfile));
  },

  updateUserProfile(partial) {
    const current = get().userProfile;
    if (!current) return;
    const updated: UserProfile = { ...current, ...partial };
    if (partial.age !== undefined) {
      updated.hrMax = calculateHRmax(updated.age);
    }
    set({ userProfile: updated });
    AsyncStorage.setItem('fitrealm_user_profile', JSON.stringify(updated));
  },

  getUserHRmax() {
    return get().userProfile?.hrMax ?? DEFAULT_HRMAX;
  },

  // MARK: - Helpers
  canAfford(cost) {
    return GE.canAfford(get().gameState, cost);
  },

  hourlyProductionRate(building) {
    return GE.hourlyProductionRate(building);
  },

  buildingStorageCap(building) {
    return GE.buildingStorageCap(building, get().gameState.buildings);
  },

  // MARK: - Trophies (Phase 6)

  addTrophy(trophy) {
    const gs = get().gameState;
    const newGs = { ...gs, trophies: [...gs.trophies, trophy] };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  placeTrophy(trophyId, position) {
    const gs = get().gameState;
    const newGs = {
      ...gs,
      trophies: gs.trophies.map(t => t.id === trophyId ? { ...t, gridPosition: position } : t),
    };
    set({ gameState: newGs });
    GE.saveGameState(newGs);
  },

  // MARK: - Dragon Unlock (Phase 6)

  clearPendingDragonUnlock() {
    const gs = get().gameState;
    const newGs = { ...gs, pendingDragonUnlock: false };
    set({ gameState: newGs, pendingDragonUnlock: false });
    GE.saveGameState(newGs);
  },

  // ── Goals ──────────────────────────────────────────────────────────────────

  claimGoalReward(goalId) {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal || goal.status !== 'claimable') return;
    const r = goal.reward;
    const cs = useCurrencyStore.getState();
    if (r.muskelmasse) cs.addMuskelmasse(r.muskelmasse);
    if (r.holz)        cs.addHolz(r.holz);
    if (r.protein)     cs.addProtein(r.protein);
    if (r.nahrung)     cs.addNahrung(r.nahrung);
    if (r.stein)       cs.addStein(r.stein);
    set(s => ({
      goals: s.goals.map(g =>
        g.id === goalId
          ? { ...g, status: 'claimed' as GoalStatus, completedAt: new Date().toISOString() }
          : g
      ),
      claimedGoalIds: [...s.claimedGoalIds, goalId],
    }));
  },

  claimSeasonalTier(tier) {
    const sg = get().seasonalGoal;
    if (!sg) return;
    const t = sg.tiers.find(t => t.tier === tier);
    if (!t || t.status !== 'claimable') return;
    const r = t.reward;
    const cs = useCurrencyStore.getState();
    if (r.muskelmasse) cs.addMuskelmasse(r.muskelmasse);
    if (r.holz)        cs.addHolz(r.holz);
    if (r.protein)     cs.addProtein(r.protein);
    set(s => ({
      seasonalGoal: s.seasonalGoal ? {
        ...s.seasonalGoal,
        tiers: s.seasonalGoal.tiers.map(t2 =>
          t2.tier === tier
            ? { ...t2, status: 'claimed' as GoalStatus }
            : t2
        ),
      } : null,
    }));
  },

  refreshGoalProgress() {
    const state = get();
    const now = Date.now();
    const cutoff30d = now - 30 * 24 * 60 * 60 * 1000;
    const workouts30d = state.recentWorkouts.filter(w => new Date(w.date).getTime() >= cutoff30d);
    const intenseWorkouts = workouts30d.filter(
      w => (w.averageHeartRate ?? 0) >= 140 && w.durationMinutes >= 20
    ).length;
    const steps = state.healthSnapshot.stepsToday * 30; // approximation
    const gs = state.gameState;
    const level2Buildings = gs.buildings.filter(b => b.level >= 2).length;
    const workerCount = gs.workers?.length ?? 0;
    const holzAmount = useCurrencyStore.getState().holz;

    const updated = state.goals.map(goal => {
      if (goal.status === 'claimed') return goal;
      let currentValue = goal.currentValue;
      switch (goal.id) {
        case 'fitness-weekly-workouts': currentValue = workouts30d.length; break;
        case 'fitness-steps':          currentValue = steps; break;
        case 'fitness-intense':        currentValue = intenseWorkouts; break;
        case 'village-builder':        currentValue = level2Buildings; break;
        case 'village-workers':        currentValue = workerCount; break;
        case 'village-resources':      currentValue = holzAmount; break;
      }
      const done = currentValue >= goal.targetValue;
      const newStatus: GoalStatus = done && goal.status === 'active' ? 'claimable' : goal.status;
      return { ...goal, currentValue, status: newStatus };
    });

    // Seasonal goal progress (total workouts in 30d)
    const workoutCount = workouts30d.length;
    let updatedSeasonal = state.seasonalGoal;
    if (updatedSeasonal) {
      const tierOrder: ('bronze' | 'silver' | 'gold')[] = ['bronze', 'silver', 'gold'];
      const newTiers = updatedSeasonal.tiers.map((t, i) => {
        if (t.status === 'claimed') return { ...t, currentValue: workoutCount };
        const prevDone = i === 0 || ['claimable', 'claimed'].includes(updatedSeasonal!.tiers[i - 1].status);
        const done = workoutCount >= t.targetValue;
        let newStatus: GoalStatus = t.status;
        if (!prevDone) newStatus = 'locked';
        else if (done && t.status === 'active') newStatus = 'claimable';
        else if (!done && t.status === 'locked' && prevDone) newStatus = 'active';
        else newStatus = t.status;
        return { ...t, currentValue: workoutCount, status: newStatus };
      });
      updatedSeasonal = { ...updatedSeasonal, tiers: newTiers };
    }

    set({ goals: updated, seasonalGoal: updatedSeasonal });
  },
}));

/** Sync all currency fields from engine GameState → currency store (gameStore) */
function _syncAllCurrencies(gs: GameState) {
  const cs = useCurrencyStore.getState();
  // Overwrite currency store with engine state values to keep them in sync
  if (Math.floor(gs.muskelmasse) !== Math.floor(cs.muskelmasse)) {
    useCurrencyStore.setState({ muskelmasse: gs.muskelmasse });
  }
  if (gs.protein !== cs.protein) {
    useCurrencyStore.setState({ protein: gs.protein });
  }
  if (gs.streakTokens !== cs.streakTokens) {
    useCurrencyStore.setState({ streakTokens: gs.streakTokens });
  }
  if (gs.currentStreak !== cs.currentStreak) {
    useCurrencyStore.setState({ currentStreak: gs.currentStreak });
  }
}
