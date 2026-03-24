// useGameStore.ts
// FitRealm - Zustand store replacing @EnvironmentObject for GameEngine, VitacoinEngine, HealthKitManager

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameState, Building, GridPosition, BuildingType, Obstacle,
  WorkoutRecord, HealthSnapshot, emptyHealthSnapshot,
  createDefaultGameState, gameStateRathausLevel, findBuildingById, workerStatus, WorkerStatus,
  obstacleRemovalCost,
} from '../models/types';
import * as GE from '../engines/GameEngine';
import type { CollectResult } from '../engines/GameEngine';
import * as VE from '../engines/VitacoinEngine';
import * as HK from '../engines/HealthKitManager';
import * as OM from '../engines/ObstacleManager';
import { ResourceCost, buildCost, upgradeCost, rathausRequirement, UNIQUE_BUILDINGS, Workers } from '../config/GameConfig';

interface GameStore {
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
  trainWorker: () => boolean;
  assignWorker: (workerID: string, buildingID: string) => void;
  unassignWorker: (workerID: string) => void;
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

  // Actions - Obstacles
  removeSmallObstacle: (id: string) => void;
  startClearingObstacle: (id: string) => void;
  checkObstacleCompletion: () => void;

  // Helpers
  canAfford: (cost: ResourceCost) => boolean;
  hourlyProductionRate: (building: Building) => number;
  buildingStorageCap: (building: Building) => number;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
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

    set({
      gameState: gs,
      totalVitacoins: vs.totalVitacoins ?? 0,
      recentWorkouts: vs.recentWorkouts ?? [],
      vitacoinsEarnedToday: vs.vitacoinsEarnedToday ?? 0,
      useMockData: mockData,
      obstacles,
    });

    // If mock mode, load the mock game state with pre-built buildings
    if (mockData) {
      get().loadMockGameState();
    }

    // Process tick on startup
    get().processTick();

    // Auto-sync health data
    await get().syncHealthData();
  },

  // MARK: - Game Engine Actions
  processTick() {
    const newState = GE.processTick(get().gameState);
    set({ gameState: newState });
    GE.saveGameState(newState);
  },

  buildBuilding(type, position) {
    const result = GE.buildBuilding(get().gameState, type, position);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
    return true;
  },

  upgradeBuilding(buildingID) {
    const result = GE.upgradeBuilding(get().gameState, buildingID);
    if (!result) return false;
    set({ gameState: result });
    GE.saveGameState(result);
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
    const result = GE.sellBuilding(get().gameState, id);
    if (!result) return null;
    set({ gameState: result.newState });
    GE.saveGameState(result.newState);
    return result.refund;
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
        const gs = GE.processWorkouts(get().gameState, mockState.recentWorkouts, mockState.healthSnapshot);
        set({ gameState: gs });
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
    set({ gameState: mock });
    GE.saveGameState(mock);
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
}));
