// Nature sprite index — pre-rendered 3D Low Poly isometric PNGs (outline-free)

export const NatureSprites = {
  // Large trees
  CommonTree_1: require('./CommonTree_1.png'),
  CommonTree_2: require('./CommonTree_2.png'),
  CommonTree_3: require('./CommonTree_3.png'),
  CommonTree_4: require('./CommonTree_4.png'),
  CommonTree_5: require('./CommonTree_5.png'),
  PineTree_1: require('./PineTree_1.png'),
  PineTree_2: require('./PineTree_2.png'),
  PineTree_3: require('./PineTree_3.png'),
  PineTree_4: require('./PineTree_4.png'),
  PineTree_5: require('./PineTree_5.png'),
  BirchTree_1: require('./BirchTree_1.png'),
  BirchTree_2: require('./BirchTree_2.png'),
  BirchTree_3: require('./BirchTree_3.png'),
  BirchTree_4: require('./BirchTree_4.png'),
  BirchTree_5: require('./BirchTree_5.png'),
  Willow_1: require('./Willow_1.png'),
  Willow_2: require('./Willow_2.png'),
  Willow_3: require('./Willow_3.png'),
  Willow_4: require('./Willow_4.png'),
  Willow_5: require('./Willow_5.png'),

  // Small props
  Bush_1: require('./Bush_1.png'),
  Bush_2: require('./Bush_2.png'),
  BushBerries_1: require('./BushBerries_1.png'),
  BushBerries_2: require('./BushBerries_2.png'),
  Rock_1: require('./Rock_1.png'),
  Rock_2: require('./Rock_2.png'),
  Rock_3: require('./Rock_3.png'),
  Rock_4: require('./Rock_4.png'),
  Rock_5: require('./Rock_5.png'),
  Rock_Moss_1: require('./Rock_Moss_1.png'),
  Rock_Moss_2: require('./Rock_Moss_2.png'),
  Rock_Moss_3: require('./Rock_Moss_3.png'),
  TreeStump: require('./TreeStump.png'),
  TreeStump_Moss: require('./TreeStump_Moss.png'),
  WoodLog: require('./WoodLog.png'),
  WoodLog_Moss: require('./WoodLog_Moss.png'),

  // Ground detail
  Grass: require('./Grass.png'),
  Grass_2: require('./Grass_2.png'),
  Grass_Short: require('./Grass_Short.png'),
  Plant_1: require('./Plant_1.png'),
  Plant_2: require('./Plant_2.png'),
  Plant_3: require('./Plant_3.png'),
  Plant_4: require('./Plant_4.png'),
  Plant_5: require('./Plant_5.png'),
  Flowers: require('./Flowers.png'),
  Corn_1: require('./Corn_1.png'),
  Wheat: require('./Wheat.png'),
} as const;

export type NatureSpriteKey = keyof typeof NatureSprites;

export const TREE_SPRITES: NatureSpriteKey[] = [
  'CommonTree_1', 'CommonTree_2', 'CommonTree_3', 'CommonTree_4', 'CommonTree_5',
  'PineTree_1', 'PineTree_2', 'PineTree_3', 'PineTree_4', 'PineTree_5',
  'BirchTree_1', 'BirchTree_2', 'BirchTree_3', 'BirchTree_4', 'BirchTree_5',
  'Willow_1', 'Willow_2', 'Willow_3', 'Willow_4', 'Willow_5',
];

export const SMALL_PROP_SPRITES: NatureSpriteKey[] = [
  'Bush_1', 'Bush_2', 'BushBerries_1', 'BushBerries_2',
  'Rock_1', 'Rock_2', 'Rock_3', 'Rock_4', 'Rock_5',
  'Rock_Moss_1', 'Rock_Moss_2', 'Rock_Moss_3',
  'TreeStump', 'TreeStump_Moss', 'WoodLog', 'WoodLog_Moss',
];

export const GROUND_DETAIL_SPRITES: NatureSpriteKey[] = [
  'Grass', 'Grass_2', 'Grass_Short',
  'Plant_1', 'Plant_2', 'Plant_3', 'Plant_4', 'Plant_5',
  'Flowers', 'Corn_1', 'Wheat',
];
