import { NatureSpriteKey } from '../../assets/nature-sprites';
import { gridToScreen, TILE_W, TILE_H } from '../../utils/isometric';
import { ForestElement, ForestZone, RockCluster } from './forestTypes';

// ── Hand-placed element interface ──────────────────────────────────────────

export interface HandPlacedElement {
  sprite: NatureSpriteKey;
  row: number;
  col: number;
  size: number;
  flipX?: boolean;
}

// ── NE Corner detection ────────────────────────────────────────────────────

export function isNECorner(row: number, col: number): boolean {
  return row >= -5 && row <= 1 && col >= 9 && col <= 19;
}

// ── NE Corner hand-placed clusters ─────────────────────────────────────────

export const NE_CORNER_CLUSTERS: HandPlacedElement[] = [
  // Cluster 1: Two tall birches + rock at base
  { sprite: 'BirchTree_1', row: -4.0, col: 16.0, size: 95 },
  { sprite: 'BirchTree_3', row: -3.5, col: 16.8, size: 85 },
  { sprite: 'Rock_Moss_1', row: -3.2, col: 16.3, size: 35 },
  { sprite: 'Grass_Short', row: -3.8, col: 15.5, size: 25 },

  // Cluster 2: Single large pine (focal point)
  { sprite: 'PineTree_1', row: -2.0, col: 17.5, size: 100 },
  { sprite: 'Bush_1', row: -1.5, col: 17.8, size: 40 },
  { sprite: 'Plant_3', row: -1.8, col: 17.0, size: 25 },

  // Cluster 3: Three common trees — main grove
  { sprite: 'CommonTree_2', row: -3.0, col: 12.0, size: 90 },
  { sprite: 'CommonTree_1', row: -3.8, col: 12.8, size: 100, flipX: true },
  { sprite: 'CommonTree_4', row: -2.5, col: 13.2, size: 80 },
  { sprite: 'Bush_2', row: -2.0, col: 12.5, size: 35 },
  { sprite: 'BushBerries_1', row: -2.8, col: 11.5, size: 30 },
  { sprite: 'Flowers', row: -2.2, col: 13.5, size: 20 },

  // Cluster 4: Rock formation
  { sprite: 'Rock_2', row: -4.0, col: 13.5, size: 55 },
  { sprite: 'Rock_3', row: -4.5, col: 14.0, size: 65 },
  { sprite: 'Rock_Moss_2', row: -3.5, col: 14.2, size: 45 },
  { sprite: 'Grass', row: -4.2, col: 13.0, size: 22 },
  { sprite: 'Plant_1', row: -3.8, col: 14.5, size: 25 },

  // Cluster 5: Edge trees — smaller, near playfield
  { sprite: 'BirchTree_5', row: -0.5, col: 15.5, size: 65 },
  { sprite: 'Bush_1', row: 0.2, col: 16.0, size: 30 },
  { sprite: 'Grass_Short', row: 0.0, col: 15.0, size: 20 },

  // Cluster 6: Far corner — dense background
  { sprite: 'PineTree_3', row: -5.0, col: 18.0, size: 95, flipX: true },
  { sprite: 'PineTree_2', row: -4.5, col: 19.0, size: 90 },
  { sprite: 'CommonTree_5', row: -5.0, col: 17.0, size: 85 },
  { sprite: 'BirchTree_2', row: -4.0, col: 18.5, size: 80, flipX: true },

  // Cluster 7: Scattered ground detail (NO trees — open space)
  { sprite: 'Grass_Short', row: -1.5, col: 14.0, size: 22 },
  { sprite: 'Plant_1', row: -2.5, col: 15.0, size: 20 },
  { sprite: 'Grass', row: -1.0, col: 16.0, size: 18 },
  { sprite: 'Flowers', row: -3.0, col: 15.5, size: 20 },

  // Cluster 8: Stump + log — storytelling
  { sprite: 'TreeStump_Moss', row: -2.0, col: 10.5, size: 35 },
  { sprite: 'WoodLog', row: -2.3, col: 11.0, size: 40 },
  { sprite: 'Grass', row: -1.8, col: 10.2, size: 20 },

  // Additional edge detail
  { sprite: 'BirchTree_4', row: -1.0, col: 11.0, size: 60 },
  { sprite: 'Grass_2', row: -0.5, col: 12.0, size: 18 },
  { sprite: 'CommonTree_3', row: -1.5, col: 9.5, size: 70 },
  { sprite: 'Plant_5', row: -0.8, col: 10.0, size: 22 },
];

// ── Zone definitions ────────────────────────────────────────────────────────

const ZONES: ForestZone[] = [
  // NW Pine Forest — Dense conifers
  {
    name: 'NW Pine Forest',
    rowMin: -5, rowMax: -1, colMin: -5, colMax: 4,
    treePalette: [
      { sprite: 'PineTree_1', weight: 3 }, { sprite: 'PineTree_2', weight: 3 },
      { sprite: 'PineTree_3', weight: 3 }, { sprite: 'PineTree_4', weight: 3 },
      { sprite: 'PineTree_5', weight: 3 }, { sprite: 'CommonTree_1', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Bush_1', weight: 2 }, { sprite: 'Plant_1', weight: 2 },
      { sprite: 'Grass', weight: 2 }, { sprite: 'Grass_Short', weight: 2 },
      { sprite: 'Rock_Moss_1', weight: 1 },
    ],
    treeDensity: 1.8, undergrowthDensity: 2.5,
    treeSizeMin: 75, treeSizeMax: 110,
  },
  // NE Birch Grove — Light, airy, flowery
  {
    name: 'NE Birch Grove',
    rowMin: -5, rowMax: -1, colMin: 10, colMax: 19,
    treePalette: [
      { sprite: 'BirchTree_1', weight: 3 }, { sprite: 'BirchTree_2', weight: 2 },
      { sprite: 'BirchTree_3', weight: 3 }, { sprite: 'BirchTree_4', weight: 2 },
      { sprite: 'BirchTree_5', weight: 2 }, { sprite: 'CommonTree_3', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Flowers', weight: 3 }, { sprite: 'Grass_Short', weight: 3 },
      { sprite: 'Plant_3', weight: 2 }, { sprite: 'Grass_2', weight: 2 },
    ],
    treeDensity: 1.2, undergrowthDensity: 3.0,
    treeSizeMin: 65, treeSizeMax: 95,
  },
  // North transition zone — mix of Pine + Birch
  {
    name: 'North Transition',
    rowMin: -5, rowMax: -1, colMin: 5, colMax: 9,
    treePalette: [
      { sprite: 'PineTree_1', weight: 3 }, { sprite: 'PineTree_3', weight: 2 },
      { sprite: 'PineTree_5', weight: 2 }, { sprite: 'BirchTree_1', weight: 2 },
      { sprite: 'BirchTree_3', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Bush_1', weight: 2 }, { sprite: 'Grass', weight: 2 },
      { sprite: 'Flowers', weight: 1 }, { sprite: 'Grass_Short', weight: 2 },
      { sprite: 'Plant_1', weight: 1 },
    ],
    treeDensity: 1.5, undergrowthDensity: 2.5,
    treeSizeMin: 70, treeSizeMax: 100,
  },
  // West Rocky — Sparse trees, lots of rocks
  {
    name: 'West Rocky',
    rowMin: 0, rowMax: 7, colMin: -5, colMax: -1,
    treePalette: [
      { sprite: 'PineTree_2', weight: 2 }, { sprite: 'PineTree_4', weight: 2 },
      { sprite: 'CommonTree_5', weight: 1 }, { sprite: 'BirchTree_5', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Rock_1', weight: 3 }, { sprite: 'Rock_2', weight: 3 },
      { sprite: 'Rock_3', weight: 3 }, { sprite: 'Rock_4', weight: 3 },
      { sprite: 'Rock_5', weight: 3 }, { sprite: 'Rock_Moss_1', weight: 2 },
      { sprite: 'Rock_Moss_2', weight: 2 }, { sprite: 'Rock_Moss_3', weight: 2 },
      { sprite: 'Grass_Short', weight: 1 },
    ],
    treeDensity: 0.6, undergrowthDensity: 3.5,
    treeSizeMin: 70, treeSizeMax: 105,
  },
  // SW Thicket — Dense bushes, smaller trees
  {
    name: 'SW Thicket',
    rowMin: 8, rowMax: 19, colMin: -5, colMax: -1,
    treePalette: [
      { sprite: 'CommonTree_3', weight: 2 }, { sprite: 'CommonTree_4', weight: 2 },
      { sprite: 'PineTree_5', weight: 2 }, { sprite: 'BirchTree_2', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Bush_1', weight: 4 }, { sprite: 'Bush_2', weight: 4 },
      { sprite: 'BushBerries_1', weight: 3 }, { sprite: 'BushBerries_2', weight: 3 },
      { sprite: 'Plant_3', weight: 2 }, { sprite: 'Plant_4', weight: 2 },
      { sprite: 'Plant_5', weight: 2 }, { sprite: 'Wheat', weight: 1 },
    ],
    treeDensity: 1.4, undergrowthDensity: 4.0,
    treeSizeMin: 55, treeSizeMax: 85,
  },
  // East Deciduous — Mixed CommonTree + some Willow
  {
    name: 'East Deciduous',
    rowMin: 0, rowMax: 7, colMin: 15, colMax: 19,
    treePalette: [
      { sprite: 'CommonTree_1', weight: 3 }, { sprite: 'CommonTree_2', weight: 3 },
      { sprite: 'CommonTree_4', weight: 3 }, { sprite: 'CommonTree_5', weight: 3 },
      { sprite: 'Willow_1', weight: 1 }, { sprite: 'Willow_3', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Bush_1', weight: 2 }, { sprite: 'Bush_2', weight: 2 },
      { sprite: 'BushBerries_1', weight: 2 }, { sprite: 'Plant_4', weight: 2 },
      { sprite: 'Grass', weight: 2 }, { sprite: 'WoodLog', weight: 1 },
    ],
    treeDensity: 1.5, undergrowthDensity: 2.0,
    treeSizeMin: 70, treeSizeMax: 105,
  },
  // SE Willow Wetland — Tall willows, lush
  {
    name: 'SE Willow Wetland',
    rowMin: 8, rowMax: 19, colMin: 15, colMax: 19,
    treePalette: [
      { sprite: 'Willow_1', weight: 3 }, { sprite: 'Willow_2', weight: 2 },
      { sprite: 'Willow_3', weight: 3 }, { sprite: 'Willow_4', weight: 2 },
      { sprite: 'Willow_5', weight: 2 },
    ],
    undergrowthPalette: [
      { sprite: 'Grass', weight: 3 }, { sprite: 'Grass_2', weight: 2 },
      { sprite: 'Plant_2', weight: 2 }, { sprite: 'Plant_5', weight: 2 },
      { sprite: 'BushBerries_2', weight: 1 },
    ],
    treeDensity: 1.3, undergrowthDensity: 2.5,
    treeSizeMin: 80, treeSizeMax: 120,
  },
  // South Dense — Mixed everything, very dense
  {
    name: 'South Dense',
    rowMin: 15, rowMax: 19, colMin: 0, colMax: 14,
    treePalette: [
      { sprite: 'CommonTree_1', weight: 2 }, { sprite: 'CommonTree_2', weight: 2 },
      { sprite: 'CommonTree_3', weight: 2 }, { sprite: 'PineTree_1', weight: 2 },
      { sprite: 'PineTree_3', weight: 2 }, { sprite: 'BirchTree_1', weight: 1 },
    ],
    undergrowthPalette: [
      { sprite: 'Bush_1', weight: 2 }, { sprite: 'Bush_2', weight: 2 },
      { sprite: 'BushBerries_1', weight: 2 }, { sprite: 'Rock_1', weight: 1 },
      { sprite: 'TreeStump', weight: 1 }, { sprite: 'WoodLog_Moss', weight: 1 },
      { sprite: 'Corn_1', weight: 1 },
    ],
    treeDensity: 2.0, undergrowthDensity: 2.5,
    treeSizeMin: 70, treeSizeMax: 105,
  },
];

// ── Pathway ─────────────────────────────────────────────────────────────────

export const PATHWAY_CENTERS: { row: number; col: number }[] = [
  { row: 0, col: 0 },
  { row: -1, col: -1 },
  { row: -1, col: -2 },
  { row: -2, col: -2 },
  { row: -2, col: -3 },
  { row: -3, col: -3 },
  { row: -3, col: -4 },
  { row: -4, col: -4 },
  { row: -4, col: -5 },
  { row: -5, col: -5 },
];

export function isOnPathway(row: number, col: number): boolean {
  return PATHWAY_CENTERS.some(
    (p) => Math.abs(p.row - row) < 0.8 && Math.abs(p.col - col) < 0.8,
  );
}

export function isNearPathway(row: number, col: number, maxDist: number): boolean {
  return PATHWAY_CENTERS.some((p) => {
    const dr = p.row - row;
    const dc = p.col - col;
    return Math.sqrt(dr * dr + dc * dc) < maxDist;
  });
}

// ── Rock Clusters ───────────────────────────────────────────────────────────

export const ROCK_CLUSTERS: RockCluster[] = [
  // West hillside cliff
  {
    centerRow: 7, centerCol: -3, rocks: [
      { offsetRow: 0, offsetCol: 0, sprite: 'Rock_2', size: 70 },
      { offsetRow: 0.3, offsetCol: -0.5, sprite: 'Rock_3', size: 80 },
      { offsetRow: -0.3, offsetCol: 0.3, sprite: 'Rock_5', size: 55 },
      { offsetRow: 0.5, offsetCol: 0.2, sprite: 'Rock_Moss_2', size: 65 },
      { offsetRow: -0.5, offsetCol: -0.3, sprite: 'Rock_4', size: 50 },
      { offsetRow: 0.1, offsetCol: -0.8, sprite: 'Rock_Moss_3', size: 45 },
    ],
  },
  // Path entrance gateway rocks
  {
    centerRow: -1, centerCol: 0, rocks: [
      { offsetRow: 0, offsetCol: 0.8, sprite: 'Rock_3', size: 55 },
      { offsetRow: 0, offsetCol: -0.8, sprite: 'Rock_Moss_2', size: 50 },
      { offsetRow: -0.3, offsetCol: 1.0, sprite: 'Rock_1', size: 35 },
    ],
  },
  // SE wetland rocks
  {
    centerRow: 17, centerCol: 17, rocks: [
      { offsetRow: 0, offsetCol: 0, sprite: 'Rock_Moss_1', size: 50 },
      { offsetRow: 0.5, offsetCol: 0.3, sprite: 'Rock_Moss_2', size: 45 },
      { offsetRow: -0.4, offsetCol: 0.5, sprite: 'Rock_Moss_3', size: 40 },
    ],
  },
  // South — fallen tree area
  {
    centerRow: 17, centerCol: 7, rocks: [
      { offsetRow: 0, offsetCol: 0, sprite: 'WoodLog', size: 45 },
      { offsetRow: 0.3, offsetCol: 0.5, sprite: 'WoodLog_Moss', size: 50 },
      { offsetRow: -0.2, offsetCol: -0.3, sprite: 'TreeStump_Moss', size: 40 },
      { offsetRow: 0.5, offsetCol: -0.2, sprite: 'TreeStump', size: 35 },
    ],
  },
];

// ── Helper functions ────────────────────────────────────────────────────────

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function weightedPick(
  items: { sprite: NatureSpriteKey; weight: number }[],
  rand: number,
): NatureSpriteKey {
  let total = 0;
  for (const item of items) total += item.weight;
  let threshold = rand * total;
  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) return item.sprite;
  }
  return items[items.length - 1].sprite;
}

function getZoneForTile(row: number, col: number): ForestZone | null {
  for (const zone of ZONES) {
    if (
      row >= zone.rowMin && row <= zone.rowMax &&
      col >= zone.colMin && col <= zone.colMax
    ) {
      return zone;
    }
  }
  return null;
}

function getDistToPlayfield(row: number, col: number, gridSize: number): number {
  if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) return 0;
  const dRow = row < 0 ? -row : row >= gridSize ? row - gridSize + 1 : 0;
  const dCol = col < 0 ? -col : col >= gridSize ? col - gridSize + 1 : 0;
  return Math.max(dRow, dCol);
}

// ── Main generation function ────────────────────────────────────────────────

export function generateAllForestElements(
  gridSize: number,
  borderSize: number,
): ForestElement[] {
  const allElements: ForestElement[] = [];
  const totalSize = gridSize + borderSize * 2;

  // ── NE Corner — hand-placed clusters ──
  for (const el of NE_CORNER_CLUSTERS) {
    const { x, y } = gridToScreen(el.row + borderSize, el.col + borderSize, totalSize);
    allElements.push({
      sprite: el.sprite,
      x: x + TILE_W / 2 - el.size / 2,
      y: y + TILE_H - el.size, // bottom-anchored
      width: el.size,
      height: el.size,
      zIndex: Math.round(y + TILE_H),
      flipX: el.flipX,
    });
  }

  // ── All other zones — zone-based generation ──
  for (let row = -borderSize; row < gridSize + borderSize; row++) {
    for (let col = -borderSize; col < gridSize + borderSize; col++) {
      // Skip playable grid
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) continue;
      // Skip NE corner — handled above by hand-placed clusters
      if (isNECorner(row, col)) continue;

      const zone = getZoneForTile(row, col);
      if (!zone) continue;

      const seed = (row + borderSize) * 1000 + (col + borderSize);
      const { x, y } = gridToScreen(row + borderSize, col + borderSize, totalSize);

      // Edge softening: reduce density near playfield edge
      const distToField = getDistToPlayfield(row, col, gridSize);
      const edgeFactor = distToField <= 1 ? 0.3 : distToField <= 2 ? 0.7 : 1.0;
      const sizeFactor = distToField <= 1 ? 0.6 : distToField <= 2 ? 0.8 : 1.0;

      // Pathway handling
      const onPath = isOnPathway(row, col);
      const nearPath = isNearPathway(row, col, 1.5);

      // ── Undergrowth ──
      const ugCount = onPath
        ? 1
        : nearPath
          ? Math.ceil(zone.undergrowthDensity * 0.5)
          : Math.ceil(zone.undergrowthDensity * edgeFactor);

      for (let u = 0; u < ugCount; u++) {
        const sprite = weightedPick(zone.undergrowthPalette, srand(seed + 50 + u * 7));
        const size = (20 + srand(seed + 60 + u) * 30) * sizeFactor;
        const offX = (srand(seed + 70 + u) - 0.5) * TILE_W * 0.6;
        const offY = (srand(seed + 80 + u) - 0.5) * TILE_H * 0.5;
        allElements.push({
          sprite,
          x: x + TILE_W / 2 + offX - size / 2,
          y: y + TILE_H / 2 + offY - size * 0.6,
          width: size,
          height: size,
          zIndex: Math.round(y + TILE_H - 2),
        });
      }

      // ── Trees (skip on path, sparse near path) ──
      if (!onPath) {
        const treeCount = nearPath ? 0 : Math.round(zone.treeDensity * edgeFactor);
        // Cluster approach: pick same species for nearby tiles
        const clusterSeed = Math.floor(row / 2) * 100 + Math.floor(col / 2);
        const treeSprite = weightedPick(zone.treePalette, srand(clusterSeed + 310));

        for (let t = 0; t < treeCount; t++) {
          const size =
            (zone.treeSizeMin + srand(seed + 320 + t) * (zone.treeSizeMax - zone.treeSizeMin)) *
            sizeFactor;
          const offX = (srand(seed + 330 + t) - 0.5) * TILE_W * 0.35;
          const offY = (srand(seed + 340 + t) - 0.5) * TILE_H * 0.2;
          allElements.push({
            sprite: treeSprite,
            x: x + TILE_W / 2 + offX - size / 2,
            y: y + TILE_H / 2 + offY - size,
            width: size,
            height: size,
            zIndex: Math.round(y + TILE_H),
            flipX: srand(seed + 350 + t) > 0.5,
          });
        }
      }
    }
  }

  // ── Rock clusters ──
  for (const cluster of ROCK_CLUSTERS) {
    for (const rock of cluster.rocks) {
      const rRow = cluster.centerRow + rock.offsetRow;
      const rCol = cluster.centerCol + rock.offsetCol;
      const { x, y } = gridToScreen(
        rRow + borderSize,
        rCol + borderSize,
        totalSize,
      );
      allElements.push({
        sprite: rock.sprite,
        x: x + TILE_W / 2 - rock.size / 2,
        y: y + TILE_H / 2 - rock.size * 0.7,
        width: rock.size,
        height: rock.size,
        zIndex: Math.round(y + TILE_H - 1),
      });
    }
  }

  allElements.sort((a, b) => a.zIndex - b.zIndex);
  return allElements;
}
