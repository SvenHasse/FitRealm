// isometric.ts
// FitRealm - Isometric coordinate utilities for the 2.5D realm map

export const TILE_W = 96;
export const TILE_H = 48;
export const TILE_DEPTH = 16;

/**
 * Convert grid (row, col) to screen pixel coordinates.
 * Returns the top-left corner of the tile's bounding box in the SVG canvas.
 * An offset is applied so the leftmost tile doesn't go negative.
 */
export function gridToScreen(row: number, col: number, gridSize: number): { x: number; y: number } {
  const offsetX = ((gridSize - 1) / 2) * TILE_W;
  return {
    x: offsetX + (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/**
 * Convert screen pixel coordinates back to the nearest grid (row, col).
 * Inverse of gridToScreen.
 */
export function screenToGrid(screenX: number, screenY: number, gridSize: number): { row: number; col: number } {
  const offsetX = ((gridSize - 1) / 2) * TILE_W;
  const relX = screenX - offsetX - TILE_W / 2; // centre of tile
  const relY = screenY - TILE_H / 2;

  // Inverse isometric transform
  const col = Math.round((relX / (TILE_W / 2) + relY / (TILE_H / 2)) / 2);
  const row = Math.round((relY / (TILE_H / 2) - relX / (TILE_W / 2)) / 2);
  return { row, col };
}

/**
 * Check if a point is inside a specific tile's diamond shape.
 */
export function isTapInDiamond(
  tapX: number,
  tapY: number,
  tileScreenX: number,
  tileScreenY: number,
): boolean {
  const centerX = tileScreenX + TILE_W / 2;
  const centerY = tileScreenY + TILE_H / 2;
  const dx = Math.abs(tapX - centerX) / (TILE_W / 2);
  const dy = Math.abs(tapY - centerY) / (TILE_H / 2);
  return dx + dy <= 1;
}

/**
 * Total pixel dimensions of the isometric canvas for a given grid size.
 * Accounts for the diamond layout extending further than a simple rectangle.
 */
export function getGridPixelSize(gridSize: number): { width: number; height: number } {
  // The isometric diamond for gridSize tiles:
  // Width: tiles extend from col=0,row=max to col=max,row=0 → gridSize * TILE_W wide + one extra tile
  // Height: the last row is at y = (gridSize-1 + gridSize-1) * TILE_H/2 + TILE_H + depth
  return {
    width: gridSize * TILE_W + TILE_W,
    height: gridSize * TILE_H + TILE_H + TILE_DEPTH * 2,
  };
}
