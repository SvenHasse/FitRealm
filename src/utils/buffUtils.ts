// buffUtils.ts
// Calculates all active MM/production buffs from tribe + buildings.

import { Tribe } from '../models/types';
import { getMmBoostForLevel } from './friendsUtils';

export interface ActiveBuff {
  id: string;
  label: string;
  source: string;
  sourceIcon: string;
  sourceColor: string;
  bonusPercent: number;
  bonusType: 'mm' | 'storage' | 'speed' | 'global';
}

export function getActiveBuffs(
  gameState: any,
  tribe: Tribe | null,
): ActiveBuff[] {
  const buffs: ActiveBuff[] = [];

  // Tribe buff
  if (tribe && tribe.level >= 1) {
    const boost = getMmBoostForLevel(tribe.level);
    if (boost > 0) {
      buffs.push({
        id: 'tribe',
        label: tribe.name,
        source: 'Stammeshaus',
        sourceIcon: 'shield-star',
        sourceColor: '#9C27B0',
        bonusPercent: boost,
        bonusType: 'mm',
      });
    }
  }

  // Building buffs (from GAME_CONFIG if buildingBonus fields exist)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ANIMAL_CONFIGS } = require('../config/GameConfig');
    const placedIds = new Set<string>(
      (gameState?.animals ?? [])
        .filter((a: any) => a?.assignment?.type === 'building')
        .map((a: any) => a.type as string)
    );

    for (const [animalType, animal] of Object.entries(ANIMAL_CONFIGS ?? {}) as [string, any][]) {
      if (!animal?.buildingBonus) continue;
      if (!placedIds.has(animalType)) continue;
      const bonus = animal.buildingBonus;
      buffs.push({
        id: `building_${animalType}`,
        label: animal.nameKey ?? animalType,
        source: animal.nameKey ?? animalType,
        sourceIcon: getBuildingIcon(animalType),
        sourceColor: getBuildingColor(bonus.bonusType ?? ''),
        bonusPercent: bonus.bonusPercent ?? 0,
        bonusType: mapBonusType(bonus.bonusType ?? ''),
      });
    }
  } catch {
    // GameConfig not accessible in this context — skip building buffs
  }

  return buffs;
}

export function getTotalMmBoostPercent(buffs: ActiveBuff[]): number {
  return buffs
    .filter(b => b.bonusType === 'mm' || b.bonusType === 'global')
    .reduce((sum, b) => sum + b.bonusPercent, 0);
}

function getBuildingIcon(animalType: string): string {
  const map: Record<string, string> = {
    tempel:      'temple-buddhist',
    bibliothek:  'book-open-variant',
    stammeshaus: 'shield-star',
    schmiede:    'anvil',
    markt:       'store',
  };
  return map[animalType.toLowerCase()] ?? 'home';
}

function getBuildingColor(bonusType: string): string {
  const map: Record<string, string> = {
    production: '#F5A623',
    storage:    '#2196F3',
    speed:      '#00BCD4',
    global:     '#9C27B0',
    mm:         '#9C27B0',
  };
  return map[bonusType] ?? '#F5A623';
}

function mapBonusType(raw: string): ActiveBuff['bonusType'] {
  if (raw === 'production' || raw === 'mm') return 'mm';
  if (raw === 'storage') return 'storage';
  if (raw === 'speed') return 'speed';
  return 'global';
}
