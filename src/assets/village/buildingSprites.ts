// buildingSprites.ts
// Sprite-Map: BuildingType + Level → PNG (512×512, transparenter Hintergrund, SW-Isometrie)
// WICHTIG: require() muss statisch sein (Metro bundler — kein dynamisches require)

import { BuildingType } from '../../models/types';

export const BUILDING_SPRITES: Partial<Record<BuildingType, Record<number, ReturnType<typeof require>>>> = {
  [BuildingType.rathaus]: {
    1: require('./building-sprites/rathaus_1.png'),
    2: require('./building-sprites/rathaus_2.png'),
    3: require('./building-sprites/rathaus_3.png'),
  },
  [BuildingType.stammeshaus]: {
    1: require('./building-sprites/stammeshaus_1.png'),
    2: require('./building-sprites/stammeshaus_2.png'),
    4: require('./building-sprites/stammeshaus_4.png'),
    5: require('./building-sprites/stammeshaus_5.png'),
  },
  [BuildingType.kaserne]: {
    1: require('./building-sprites/kaserne_1.png'),
    2: require('./building-sprites/kaserne_2.png'),
    3: require('./building-sprites/kaserne_3.png'),
    4: require('./building-sprites/kaserne_4.png'),
  },
  [BuildingType.tempel]: {
    3: require('./building-sprites/tempel_3.png'),
  },
  [BuildingType.bibliothek]: {
    3: require('./building-sprites/bibliothek_3.png'),
  },
  [BuildingType.holzfaeller]: {
    0: require('./building-sprites/holzfaeller_0.png'),
    1: require('./building-sprites/holzfaeller_1.png'),
    2: require('./building-sprites/holzfaeller_2.png'),
    3: require('./building-sprites/holzfaeller_3.png'),
    4: require('./building-sprites/holzfaeller_4.png'),
    5: require('./building-sprites/holzfaeller_5.png'),
  },
  [BuildingType.lager]: {
    1: require('./building-sprites/lager_1.png'),
    2: require('./building-sprites/lager_2.png'),
    3: require('./building-sprites/lager_3.png'),
    4: require('./building-sprites/lager_4.png'),
    5: require('./building-sprites/lager_5.png'),
  },
  [BuildingType.steinbruch]: {
    1: require('./building-sprites/steinbruch_1.png'),
    2: require('./building-sprites/steinbruch_2.png'),
    3: require('./building-sprites/steinbruch_3.png'),
    5: require('./building-sprites/steinbruch_5.png'),
  },
  [BuildingType.marktplatz]: {
    1: require('./building-sprites/marktplatz_1.png'),
    2: require('./building-sprites/marktplatz_2.png'),
    3: require('./building-sprites/marktplatz_3.png'),
  },
  [BuildingType.proteinfarm]: {
    2: require('./building-sprites/proteinfarm_2.png'),
    3: require('./building-sprites/proteinfarm_3.png'),
    4: require('./building-sprites/proteinfarm_4.png'),
  },
  [BuildingType.feld]: {
    0: require('./building-sprites/feld_0.png'),
    1: require('./building-sprites/feld_1.png'),
    3: require('./building-sprites/feld_3.png'),
    4: require('./building-sprites/feld_4.png'),
  },
  [BuildingType.alchemist]: {
    2: require('./building-sprites/alchemist_2.png'),
  },
};

/**
 * Gibt den passenden Sprite für ein Gebäude zurück.
 * Fällt auf den nächst-niedrigeren verfügbaren Level zurück.
 * Gibt undefined zurück wenn kein Sprite vorhanden (→ SVG-Fallback).
 */
export function getBuildingSprite(
  type: BuildingType,
  level: number,
): ReturnType<typeof require> | undefined {
  const levels = BUILDING_SPRITES[type];
  if (!levels) return undefined;

  // Exakter Level-Match
  if (levels[level] !== undefined) return levels[level];

  // Nächst-niedrigerer Level
  const available = Object.keys(levels).map(Number).sort((a, b) => b - a);
  const fallback = available.find(l => l <= level);
  if (fallback !== undefined) return levels[fallback];

  // Kein passender Level → niedrigsten verfügbaren nehmen
  return levels[available[available.length - 1]];
}
