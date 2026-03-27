import { BiomeId, ScoutReport } from './types';

export interface BiomeConfig {
  id: BiomeId;
  name: string;
  emoji: string;
  description: string;
  scoutDurationHours: number;
  scoutReport: ScoutReport;
}

export const BIOME_CONFIGS: Record<BiomeId, BiomeConfig> = {
  desert: {
    id: 'desert',
    name: 'Wüste',
    emoji: '🏜️',
    description: 'Eine endlose Sandwüste mit verborgenen Oasen und alten Ruinen.',
    scoutDurationHours: 8,
    scoutReport: {
      resources: ['Kaktusfasern', 'Sandstein', 'Oasenholz', 'Seltene Samen'],
      animals: ['Wüstenfuchs', 'Sandeidechse', 'Kamel'],
      distanceKm: 5, workoutType: 'Laufen', stepsRequired: 20000,
      funFact: 'Es war unglaublich heiß, aber ich habe eine versteckte Oase gefunden!',
    },
  },
  mountains: {
    id: 'mountains',
    name: 'Berge',
    emoji: '⛰️',
    description: 'Schneebedeckte Gipfel mit verborgenen Höhlen und klaren Gebirgsbächen.',
    scoutDurationHours: 12,
    scoutReport: {
      resources: ['Granit', 'Bergkräuter', 'Gletscherwasser', 'Rohkristalle'],
      animals: ['Steinbock', 'Adler', 'Murmeltier'],
      distanceKm: 8, workoutType: 'Laufen', stepsRequired: 30000,
      funFact: 'Der Gipfel war wolkenverhangen, aber die Aussicht war atemberaubend!',
    },
  },
};
