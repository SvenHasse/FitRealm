export const GRID_SIZE = 15;
export const WORLD_GRID_EXTENT = 24;
export const CELL_WORLD_SIZE = WORLD_GRID_EXTENT / GRID_SIZE;

export const BIOME_CENTERS = {
  forest:    { x: 0,   z: 0 },
  desert:    { x: -40, z: 0 },
  mountains: { x: 40,  z: 0 },
} as const;

export type BiomeKey = keyof typeof BIOME_CENTERS;

export function gridToWorld(gridX: number, gridY: number, biome: BiomeKey) {
  const center = BIOME_CENTERS[biome];
  return {
    x: center.x + (gridX - GRID_SIZE / 2) * CELL_WORLD_SIZE,
    y: 0,
    z: center.z + (gridY - GRID_SIZE / 2) * CELL_WORLD_SIZE,
  };
}
