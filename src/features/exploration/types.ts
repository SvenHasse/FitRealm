export type BiomeId = 'desert' | 'mountains';
export type BiomeStatus = 'locked' | 'scouting' | 'scout_returned' | 'unlocking' | 'unlocked';

export interface ScoutMission {
  animalType: string;
  departureTime: number;
  returnTime: number;
  durationHours: number;
}

export interface ScoutReport {
  resources: string[];
  animals: string[];
  distanceKm: number;
  workoutType: string;
  stepsRequired: number;
  funFact: string;
}

export interface BiomeState {
  id: BiomeId;
  status: BiomeStatus;
  mission?: ScoutMission;
  report?: ScoutReport;
  stepsCompleted: number;
}
