import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiomeId, BiomeState, ScoutMission } from './types';
import { BIOME_CONFIGS } from './biomeConfig';
import { ANIMAL_FIT } from './animalFitConfig';

interface ExplorationStore {
  biomes: Record<BiomeId, BiomeState>;
  sendScout: (biomeId: BiomeId, animalType: string) => void;
  checkReturnedScouts: () => BiomeId[];
  acknowledgeReport: (biomeId: BiomeId) => void;
  addSteps: (steps: number) => { biomeId: BiomeId; justUnlocked: boolean } | null;
}

const initialBiomes: Record<BiomeId, BiomeState> = {
  desert:    { id: 'desert',    status: 'locked', stepsCompleted: 0 },
  mountains: { id: 'mountains', status: 'locked', stepsCompleted: 0 },
};

export const useExplorationStore = create<ExplorationStore>()(
  persist(
    (set, get) => ({
      biomes: initialBiomes,

      sendScout: (biomeId, animalType) => {
        const config = BIOME_CONFIGS[biomeId];
        const fit = ANIMAL_FIT[biomeId]?.[animalType];
        const durationHours = config.scoutDurationHours * (1 / (fit?.speedMultiplier ?? 1.0));
        const now = Date.now();
        const mission: ScoutMission = {
          animalType,
          departureTime: now,
          returnTime: now + durationHours * 60 * 60 * 1000,
          durationHours,
        };
        set(state => ({
          biomes: {
            ...state.biomes,
            [biomeId]: { ...state.biomes[biomeId], status: 'scouting' as const, mission },
          },
        }));
      },

      checkReturnedScouts: () => {
        const now = Date.now();
        const returned: BiomeId[] = [];
        const current = get().biomes;
        const updated = { ...current };
        let changed = false;
        for (const id of Object.keys(updated) as BiomeId[]) {
          const b = updated[id];
          if (b.status === 'scouting' && b.mission && now >= b.mission.returnTime) {
            updated[id] = {
              ...b,
              status: 'scout_returned',
              report: BIOME_CONFIGS[id].scoutReport,
            };
            returned.push(id);
            changed = true;
          }
        }
        if (changed) set({ biomes: updated });
        return returned;
      },

      acknowledgeReport: (biomeId) => {
        set(state => ({
          biomes: {
            ...state.biomes,
            [biomeId]: { ...state.biomes[biomeId], status: 'unlocking' as const },
          },
        }));
      },

      addSteps: (steps) => {
        const state = get();
        for (const id of Object.keys(state.biomes) as BiomeId[]) {
          const b = state.biomes[id];
          if (b.status === 'unlocking' && b.report) {
            const newSteps = b.stepsCompleted + steps;
            const justUnlocked = newSteps >= b.report.stepsRequired;
            set(prev => ({
              biomes: {
                ...prev.biomes,
                [id]: {
                  ...prev.biomes[id],
                  stepsCompleted: Math.min(newSteps, b.report!.stepsRequired),
                  status: justUnlocked ? 'unlocked' as const : 'unlocking' as const,
                },
              },
            }));
            return { biomeId: id, justUnlocked };
          }
        }
        return null;
      },
    }),
    { name: 'exploration-store', storage: createJSONStorage(() => AsyncStorage) }
  )
);
