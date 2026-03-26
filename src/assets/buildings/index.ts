// Building sprite index — pre-rendered isometric 3D models (512x512 PNG, transparent bg)

export const BuildingSprites = {
  burg_level_1: require('./burg_level_1.png'),
  burg_level_2: require('./burg_level_2.png'),
  burg_level_3: require('./burg_level_3.png'),
  burg_level_4: require('./burg_level_4.png'),
  burg_level_5: require('./burg_level_5.png'),
  schmiede_level_1: require('./schmiede_level_1.png'),
} as const;

export type BuildingSpriteKey = keyof typeof BuildingSprites;
