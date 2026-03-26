import { NatureSpriteKey } from '../../assets/nature-sprites';

export interface ForestElement {
  sprite: NatureSpriteKey;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity?: number;
  flipX?: boolean;
}

export interface ForestZone {
  name: string;
  // Rectangular bounds in grid coords (row/col, inclusive)
  rowMin: number;
  rowMax: number;
  colMin: number;
  colMax: number;
  treePalette: { sprite: NatureSpriteKey; weight: number }[];
  undergrowthPalette: { sprite: NatureSpriteKey; weight: number }[];
  treeDensity: number;
  undergrowthDensity: number;
  treeSizeMin: number;
  treeSizeMax: number;
}

export interface RockCluster {
  centerRow: number;
  centerCol: number;
  rocks: { offsetRow: number; offsetCol: number; sprite: NatureSpriteKey; size: number }[];
}
