// WaveService.ts
// FitRealm — Generates and schedules monster waves

import { MonsterWave, Monster, MonsterType } from '../models/types';
import { MONSTER_CONFIGS, WAVE_CONFIG } from '../config/EntityConfig';

// Re-export for convenience
export { WAVE_CONFIG };

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

  generateWave(
    rathausLevel: number,
    lastWorkoutTimestamp: number,
    watchtowerLevel?: number,
    hasScoutFalcon?: boolean,
  ): MonsterWave {
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

    // Calculate warning time: base 12h + Wachturm-Bonus (+3h/Level) + Spähfalke (+6h)
    const baseWarningHours = WAVE_CONFIG.baseWarningMs / (1000 * 60 * 60);
    const watchtowerBonus = (watchtowerLevel ?? 0) * 3;
    const falconBonus = hasScoutFalcon ? 6 : 0;
    const totalWarningHours = baseWarningHours + watchtowerBonus + falconBonus;
    const warningMs = totalWarningHours * 3600 * 1000;

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

  isBossEventDue(lastBossEventAt: number | null, rathausLevel: number): boolean {
    if (rathausLevel < 5) return false;
    if (lastBossEventAt === null) return false; // Erst nach der allerersten Wave
    return (Date.now() - lastBossEventAt) >= WAVE_CONFIG.bossEventIntervalDays * 24 * 3600 * 1000;
  }

  isBloodWaveDue(lastBloodWaveAt: number | null): boolean {
    if (lastBloodWaveAt === null) return false;
    return (Date.now() - lastBloodWaveAt) >= WAVE_CONFIG.bloodWaveIntervalDays * 24 * 3600 * 1000;
  }

  generateBossWave(bossType: 'uralterGolem' | 'verderbnisHydra', rathausLevel: number): MonsterWave {
    const now = Date.now();
    const cfg = MONSTER_CONFIGS[bossType];

    // Boss-Monster selbst
    const bossAttackPower = randInt(
      Math.round(cfg.baseAttackPower[0] * (3 + rathausLevel * 0.5)),
      Math.round(cfg.baseAttackPower[1] * (3 + rathausLevel * 0.5)),
    );
    const bossMonster: Monster = {
      type: bossType,
      count: 1,
      attackPower: bossAttackPower,
      hp: cfg.baseHP,
      target: cfg.target as Monster['target'],
    };

    // Begleiter (Tier 2-3)
    const companionTypes: MonsterType[] = ['skelettkrieger', 'dunkelork', 'giftwurm', 'nebelgeist'];
    const companionCount = randInt(2, 4);
    const companions: Monster[] = [];
    for (let i = 0; i < companionCount; i++) {
      const cType = pickRandom(companionTypes);
      const cCfg = MONSTER_CONFIGS[cType];
      companions.push({
        type: cType,
        count: randInt(1, 2),
        attackPower: randInt(cCfg.baseAttackPower[0], cCfg.baseAttackPower[1]),
        hp: cCfg.baseHP,
        target: cCfg.target as Monster['target'],
      });
    }

    const monsters: Monster[] = [bossMonster, ...companions];
    const totalAttackPower = monsters.reduce((sum, m) => sum + m.count * m.attackPower, 0);

    // Boss-Wellen haben längere Vorlaufzeit (+12h)
    const warningMs = (WAVE_CONFIG.baseWarningMs / (1000 * 60 * 60) + 12) * 3600 * 1000;

    return {
      id: `boss_${now}_${Math.random().toString(36).slice(2)}`,
      monsters,
      totalAttackPower,
      status: 'approaching',
      announcedAt: now,
      arrivesAt: now + warningMs,
      resolvedAt: null,
      result: null,
    };
  }

  applyBloodWaveModifiers(wave: MonsterWave): MonsterWave {
    return {
      ...wave,
      totalAttackPower: Math.round(wave.totalAttackPower * WAVE_CONFIG.bloodWaveMultiplier),
    };
  }
}

export const waveService = new WaveService();
