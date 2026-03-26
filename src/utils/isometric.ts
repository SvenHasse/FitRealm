// isometric.ts
// FitRealm - Isometric coordinate utilities for the 2.5D realm map

export const TILE_W = 96;
export const TILE_H = 48;
export const TILE_DEPTH = 16;

/**
 * Convert grid (row, col) to screen pixel coordinates.
 * originX centres the diamond grid horizontally in the total pixel space.
 */
export function gridToScreen(row: number, col: number, gridSize: number): { x: number; y: number } {
  const originX = (gridSize / 2) * (TILE_W / 2);
  return {
    x: originX + (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/**
 * Convert screen pixel coordinates back to the nearest grid (row, col).
 */
export function screenToGrid(screenX: number, screenY: number, gridSize: number): { row: number; col: number } {
  const originX = (gridSize / 2) * (TILE_W / 2);
  const relX = screenX - originX;
  const col = Math.round((relX / (TILE_W / 2) + screenY / (TILE_H / 2)) / 2);
  const row = Math.round((screenY / (TILE_H / 2) - relX / (TILE_W / 2)) / 2);
  return { row, col };
}

/**
 * Total pixel dimensions of the isometric canvas for a given grid size.
 */
export function getGridPixelSize(gridSize: number): { width: number; height: number } {
  return {
    width: gridSize * TILE_W,
    height: gridSize * TILE_H + TILE_DEPTH,
  };
}
