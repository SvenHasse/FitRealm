// WaveService.ts
// FitRealm — Generates and schedules monster waves

import { MonsterWave, Monster, MonsterType } from '../models/types';
import { MONSTER_CONFIGS, WAVE_CONFIG } from '../config/EntityConfig';

const TIER1_MONSTERS: MonsterType[] = ['sumpfgoblin', 'schattenratte'];
const TIER2_MONSTERS: MonsterType[] = ['skelettkrieger', 'giftwurm'];
const TIER3_MONSTERS: MonsterType[] = ['dunkelork', 'nebelgeist'];
const TIER4_MONSTERS: MonsterType[] = ['frostdrache', 'schattenmagier'];
const TIER5_MONSTERS: MonsterType[] = ['uralterGolem', 'verderbnisHydra'];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class WaveService {

  getInactivityMultiplier(lastWorkoutTimestamp: number): number {
    const hoursElapsed = (Date.now() - lastWorkoutTimestamp) / (1000 * 60 * 60);
    if (hoursElapsed < 48) return 1.0;
    if (hoursElapsed < 72) return 1.2;
    if (hoursElapsed < 120) return 1.4;
    return 1.8;
  }

  generateWave(rathausLevel: number, lastWorkoutTimestamp: number): MonsterWave {
    const inactivityMult = this.getInactivityMultiplier(lastWorkoutTimestamp);

    // Determine which monster types are available based on rathaus level
    let availableTypes: MonsterType[] = [...TIER1_MONSTERS];
    const groupCount = rathausLevel <= 2 ? randInt(1, 2) : randInt(2, 3);
    const selectedTypes: MonsterType[] = [];

    if (rathausLevel >= 3) {
      availableTypes = [...availableTypes, ...TIER2_MONSTERS];
      // 30% chance for a tier 3 monster
      if (Math.random() < 0.30) {
        availableTypes = [...availableTypes, ...TIER3_MONSTERS];
      }
    }
    if (rathausLevel >= 4) {
      availableTypes = [...availableTypes, ...TIER3_MONSTERS, ...TIER2_MONSTERS];
      // 20% chance for a tier 4 monster
      if (Math.random() < 0.20) {
        availableTypes = [...availableTypes, ...TIER4_MONSTERS];
      }
    }
    if (rathausLevel >= 5) {
      availableTypes = [...availableTypes, ...TIER4_MONSTERS];
      // 10% chance for boss tier
      if (Math.random() < 0.10) {
        availableTypes = [...availableTypes, ...TIER5_MONSTERS];
      }
    }

    // Pick unique monster types for this wave
    const shuffled = [...availableTypes].sort(() => Math.random() - 0.5);
    for (let i = 0; i < groupCount && i < shuffled.length; i++) {
      // Avoid duplicates
      if (!selectedTypes.includes(shuffled[i])) {
        selectedTypes.push(shuffled[i]);
      }
    }

    // Ensure at least 1 type
    if (selectedTypes.length === 0) {
      selectedTypes.push(pickRandom(TIER1_MONSTERS));
    }

    const monsters: Monster[] = selectedTypes.map(type => {
      const cfg = MONSTER_CONFIGS[type];
      const count = randInt(cfg.countRange[0], cfg.countRange[1]);
      const attackPower = randInt(cfg.baseAttackPower[0], cfg.baseAttackPower[1]);
      const hp = cfg.baseHP;
      return {
        type,
        count,
        attackPower,
        hp,
        target: cfg.target as Monster['target'],
      };
    });

    // Calculate total AK
    const baseAK = monsters.reduce((sum, m) => sum + m.count * m.attackPower, 0);
    const variation = randFloat(0.85, 1.15);
    const totalAttackPower = Math.round(baseAK * inactivityMult * variation);

    const now = Date.now();
    const warningMs = WAVE_CONFIG.baseWarningMs;
    const arrivesAt = now + warningMs;

    return {
      id: `wave_${now}_${Math.random().toString(36).slice(2)}`,
      monsters,
      totalAttackPower,
      status: 'approaching',
      announcedAt: now,
      arrivesAt,
      resolvedAt: null,
      result: null,
    };
  }

  scheduleNextWave(lastWaveTimestamp: number | null): number {
    const base = lastWaveTimestamp ?? Date.now();
    const { minIntervalMs, maxIntervalMs } = WAVE_CONFIG;
    const interval = minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);

    // Check for blood wave: every 7 days
    const daysSinceStart = (Date.now() - (lastWaveTimestamp ?? Date.now())) / (1000 * 60 * 60 * 24);
    const isBloodWave = daysSinceStart >= WAVE_CONFIG.bloodWaveIntervalDays;
    if (isBloodWave) {
      // Blood wave is scheduled sooner and stronger (handled in generateWave via multiplier)
      return base + interval * 0.8;
    }

    return base + interval;
  }
}

export const waveService = new WaveService();
