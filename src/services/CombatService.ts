// CombatService.ts
// FitRealm — Resolves combat between a monster wave and the player's defense

import {
  DefenseBreakdown, MonsterWave, WaveResult, DamageEffect,
  Animal, Building, LootDrop, EggRarity,
} from '../models/types';
import { ANIMAL_CONFIGS, MONSTER_CONFIGS } from '../config/EntityConfig';

export class CombatService {

  resolveCombat(
    defense: DefenseBreakdown,
    wave: MonsterWave,
    animals: Animal[],
    buildings: Building[],
  ): {
    result: WaveResult;
    damages: DamageEffect[];
    loot: LootDrop[];
    effectiveAK: number;
  } {
    // Step 1: Start with base AK
    let effectiveAK = wave.totalAttackPower;
    let adjustedAnimalVP = defense.animalVP;

    // Step 2: Apply tier abilities from defense animals
    const defenseAnimals = animals.filter(a => a.assignment.type === 'defense');
    for (const animal of defenseAnimals) {
      const animalType = animal.type;
      if (animalType === 'spaehfalke') {
        // Spähfalke: -10% AK
        effectiveAK = Math.round(effectiveAK * 0.90);
      } else if (animalType === 'kriegswolf') {
        // Kriegswolf: Rudel-Taktik — +10% animalVP
        adjustedAnimalVP = Math.round(adjustedAnimalVP * 1.10);
      } else if (animalType === 'uralterDrache') {
        // Uralter Drache: -30% AK
        effectiveAK = Math.round(effectiveAK * 0.70);
      }
    }

    // Recalculate totalVP with adjusted animalVP
    const adjustedTotalVP = Math.round(
      (defense.basisVP + defense.workoutVP + defense.workerVP + adjustedAnimalVP) *
      (1 + defense.streakBonus),
    );

    // Step 3: Determine outcome
    let outcome: WaveResult['outcome'];
    if (adjustedTotalVP >= effectiveAK * 1.5) {
      outcome = 'perfect';
    } else if (adjustedTotalVP >= effectiveAK) {
      outcome = 'defended';
    } else if (adjustedTotalVP >= effectiveAK * 0.5) {
      outcome = 'partial';
    } else {
      outcome = 'overrun';
    }

    // Step 4: Calculate damages
    let damages: DamageEffect[] = [];
    if (outcome === 'partial' || outcome === 'overrun') {
      damages = this._calculateDamages(wave, buildings, outcome);
    }

    // Step 5: Apply post-combat animal abilities
    // Mystischer Hirsch: -30% damage duration
    const hasMystischerHirsch = defenseAnimals.some(a => a.type === 'mystischerHirsch');
    if (hasMystischerHirsch && damages.length > 0) {
      damages = damages.map(d => {
        const newDuration = Math.round(d.duration * 0.70);
        const newEndsAt = d.startsAt + newDuration;
        return { ...d, duration: newDuration, endsAt: newEndsAt };
      });
    }

    // Glücksphönix: Remove one random DamageEffect
    const hasGluecksphoenixt = defenseAnimals.some(a => a.type === 'gluecksphoenixt');
    if (hasGluecksphoenixt && damages.length > 0) {
      const removeIdx = Math.floor(Math.random() * damages.length);
      damages = damages.filter((_, i) => i !== removeIdx);
    }

    // Step 6: Generate loot
    const loot: LootDrop[] = [];
    if (outcome === 'perfect' || outcome === 'defended') {
      const lootMultiplier = outcome === 'perfect' ? 2 : 1;
      for (const monster of wave.monsters) {
        const cfg = MONSTER_CONFIGS[monster.type];
        const { resources, eggChance, eggRarity, proteinChance } = cfg.lootTable;
        const amount = Math.round(
          (resources.min + Math.random() * (resources.max - resources.min)) * lootMultiplier,
        );
        if (amount > 0) {
          loot.push({ type: 'holz', amount });
        }
        // Protein chance
        if (Math.random() < proteinChance) {
          loot.push({ type: 'protein', amount: Math.round((1 + Math.random() * 3) * lootMultiplier) });
        }
        // Egg chance from monster loot table
        if (eggRarity && Math.random() < eggChance * lootMultiplier) {
          loot.push({ type: 'egg', amount: 1, eggRarity: eggRarity as EggRarity });
        }
      }

      // Random 20% common egg, 5% uncommon egg
      if (Math.random() < 0.20) {
        loot.push({ type: 'egg', amount: 1, eggRarity: 'common' });
      } else if (Math.random() < 0.05) {
        loot.push({ type: 'egg', amount: 1, eggRarity: 'uncommon' });
      }
    }

    const result: WaveResult = {
      outcome,
      damageDealt: damages,
      loot,
      playerVP: adjustedTotalVP,
      monsterAP: effectiveAK,
    };

    return { result, damages, loot, effectiveAK };
  }

  private _calculateDamages(
    wave: MonsterWave,
    buildings: Building[],
    outcome: 'partial' | 'overrun',
  ): DamageEffect[] {
    const damages: DamageEffect[] = [];
    const now = Date.now();
    const maxDamages = outcome === 'overrun' ? 3 : 1;

    // Gather monsters that can cause damage
    const shuffledMonsters = [...wave.monsters].sort(() => Math.random() - 0.5);
    let damageCount = 0;

    for (const monster of shuffledMonsters) {
      if (damageCount >= maxDamages) break;
      const cfg = MONSTER_CONFIGS[monster.type];
      const target = cfg.target;
      const { effectType, durationHours } = cfg.damageOnLoss;

      // Find a relevant building to target
      let targetBuilding: Building | undefined;
      if (target === 'fields' || target === 'production') {
        const productionBuildings = buildings.filter(b =>
          !b.isUnderConstruction && b.level >= 1 &&
          ['kornkammer', 'proteinfarm', 'holzfaeller', 'steinbruch', 'feld'].includes(b.type),
        );
        if (productionBuildings.length > 0) {
          targetBuilding = productionBuildings[Math.floor(Math.random() * productionBuildings.length)];
        }
      } else if (target === 'storage') {
        const storageBuildings = buildings.filter(b =>
          !b.isUnderConstruction && b.level >= 1 &&
          ['holzlager', 'steinlager', 'nahrungslager'].includes(b.type),
        );
        if (storageBuildings.length > 0) {
          targetBuilding = storageBuildings[Math.floor(Math.random() * storageBuildings.length)];
        }
      } else if (target === 'magic') {
        const magicBuildings = buildings.filter(b =>
          !b.isUnderConstruction && b.level >= 1 &&
          ['tempel', 'bibliothek'].includes(b.type),
        );
        if (magicBuildings.length > 0) {
          targetBuilding = magicBuildings[Math.floor(Math.random() * magicBuildings.length)];
        }
      } else if (target === 'protein') {
        targetBuilding = buildings.find(b => b.type === 'proteinfarm' && !b.isUnderConstruction && b.level >= 1);
      } else if (target === 'rathaus') {
        targetBuilding = buildings.find(b => b.type === 'rathaus' && !b.isUnderConstruction);
      } else if (target === 'all' || target === 'wall') {
        // Target a random building
        const activeBldgs = buildings.filter(b => !b.isUnderConstruction && b.level >= 1);
        if (activeBldgs.length > 0) {
          targetBuilding = activeBldgs[Math.floor(Math.random() * activeBldgs.length)];
        }
      }

      if (!targetBuilding) continue;

      // Adjust duration for partial vs overrun
      let durationMs: number;
      if (outcome === 'overrun') {
        if (effectType === 'productionStop') {
          durationMs = (2 + Math.random() * 4) * 3600 * 1000; // 2-6h
        } else if (effectType === 'disabled') {
          durationMs = (4 + Math.random() * 4) * 3600 * 1000; // 4-8h
        } else {
          durationMs = durationHours * 3600 * 1000;
        }
      } else {
        // partial
        if (effectType === 'productionStop') {
          durationMs = (1 + Math.random() * 2) * 3600 * 1000; // 1-3h
        } else if (effectType === 'disabled') {
          durationMs = (2 + Math.random() * 2) * 3600 * 1000; // 2-4h
        } else {
          durationMs = durationHours * 0.5 * 3600 * 1000;
        }
      }

      damages.push({
        buildingId: targetBuilding.id,
        effectType,
        duration: Math.round(durationMs),
        startsAt: now,
        endsAt: now + Math.round(durationMs),
      });

      damageCount++;
    }

    return damages;
  }
}

export const combatService = new CombatService();
