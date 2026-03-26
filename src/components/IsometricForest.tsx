// IsometricForest.tsx
// FitRealm - Forest border: SVG ground tiles (inside <Svg>) + nothing else
// Tree/rock sprites are rendered separately as <Image> elements outside SVG

import React from 'react';
import { Polygon, G } from 'react-native-svg';
import { TILE_W, TILE_H, TILE_DEPTH, gridToScreen } from '../utils/isometric';
import { isOnPathway, isNECorner } from './village/forestZones';

// ── Ground color system ────────────────────────────────────────────────────

type GroundType = 'grass_dark' | 'grass_light' | 'earth' | 'earth_dark' | 'earth_light' | 'moss';

const GROUND_COLORS: Record<GroundType, { top: string; left: string; right: string }> = {
  grass_dark:  { top: '#3A6B2A', left: '#2D5A1B', right: '#2A5520' },
  grass_light: { top: '#4A7C3F', left: '#2D5A1B', right: '#3A6B2A' },
  earth:       { top: '#9E8B6E', left: '#7A6B52', right: '#8B7A5E' },
  earth_dark:  { top: '#8B7A5E', left: '#6B5A42', right: '#7A6B52' },
  earth_light: { top: '#B8A88A', left: '#8B7A5E', right: '#9E8B6E' },
  moss:        { top: '#4A6B35', left: '#2D5A1B', right: '#3A5A28' },
};

// ── NE corner tile sets ────────────────────────────────────────────────────

const NE_EARTH_TILES = new Set([
  '-1,13', '-1,14', '-2,14', '-2,15', '-3,15', '-1,16',
  '-4,13', '-4,14', '-2,10', '-2,11',
  '-1,11', '-1,12', '-3,10', '-1,17', '-1,18',
  '-5,15', '-5,16', '-3,14',
]);

const NE_DARK_GRASS_TILES = new Set([
  '-3,12', '-4,12', '-3,13', '-4,16', '-3,17',
  '-5,17', '-5,18', '-4,19', '-3,16',
]);

// ── Seeded random ──────────────────────────────────────────────────────────

function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ── Ground color resolver ──────────────────────────────────────────────────

function getGroundColors(row: number, col: number, onPath: boolean): { top: string; left: string; right: string } {
  if (onPath) return { top: '#C4A96B', left: '#8B7044', right: '#A08050' };

  const key = `${row},${col}`;
  if (NE_EARTH_TILES.has(key)) return GROUND_COLORS.earth;
  if (NE_DARK_GRASS_TILES.has(key)) return GROUND_COLORS.grass_dark;

  // Default for NE corner: mix earth and grass based on seeded random
  if (isNECorner(row, col)) {
    const s = srand(row * 137 + col * 311);
    if (s < 0.4) return GROUND_COLORS.earth;
    if (s < 0.6) return GROUND_COLORS.moss;
    return GROUND_COLORS.grass_dark;
  }

  // Default for rest of forest
  return { top: '#2D6A1E', left: '#1E4A10', right: '#275A18' };
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  gridSize: number;
  borderSize: number;
}

function IsometricForestInner({ gridSize, borderSize }: Props) {
  const totalSize = gridSize + borderSize * 2;
  const elements: React.ReactElement[] = [];

  for (let row = -borderSize; row < gridSize + borderSize; row++) {
    for (let col = -borderSize; col < gridSize + borderSize; col++) {
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) continue;

      const { x, y } = gridToScreen(row + borderSize, col + borderSize, totalSize);
      const hw = TILE_W / 2;
      const hh = TILE_H / 2;

      const topFace = `${x},${y + hh} ${x + hw},${y} ${x + TILE_W},${y + hh} ${x + hw},${y + TILE_H}`;
      const leftFace = `${x},${y + hh} ${x + hw},${y + TILE_H} ${x + hw},${y + TILE_H + TILE_DEPTH} ${x},${y + hh + TILE_DEPTH}`;
      const rightFace = `${x + hw},${y + TILE_H} ${x + TILE_W},${y + hh} ${x + TILE_W},${y + hh + TILE_DEPTH} ${x + hw},${y + TILE_H + TILE_DEPTH}`;

      const onPath = isOnPathway(row, col);
      const colors = getGroundColors(row, col, onPath);

      elements.push(
        <G key={`forest-${row}-${col}`}>
          <Polygon points={leftFace} fill={colors.left} />
          <Polygon points={rightFace} fill={colors.right} />
          <Polygon points={topFace} fill={colors.top} stroke="rgba(0,0,0,0.08)" strokeWidth={0.3} />
        </G>
      );

      // ── Cliff edges for NE corner boundary ──
      // South-facing cliff: row === -1, cols 9..14 (forest tile, south is playfield)
      if (row === -1 && col >= 9 && col < gridSize) {
        const cliffH = 28 + srand(row * 100 + col) * 8; // 28-36px variable
        // Left cliff face
        elements.push(
          <Polygon
            key={`cliff-l-${row}-${col}`}
            points={`${x},${y + hh} ${x},${y + hh + cliffH} ${x + hw},${y + TILE_H + cliffH} ${x + hw},${y + TILE_H}`}
            fill="#6B5234"
          />
        );
        // Right cliff face
        elements.push(
          <Polygon
            key={`cliff-r-${row}-${col}`}
            points={`${x + hw},${y + TILE_H} ${x + hw},${y + TILE_H + cliffH} ${x + TILE_W},${y + hh + cliffH} ${x + TILE_W},${y + hh}`}
            fill="#8B6E4E"
          />
        );
      }

      // West-facing cliff: col === 15, rows 0..7 (East Deciduous zone, playfield is at col 14)
      // The visible cliff face is the LEFT side of col=15 tiles
      if (col === 15 && row >= 0 && row <= 7) {
        const cliffH = 28 + srand(row * 100 + col) * 8;
        // Left cliff face (facing west / toward playfield)
        elements.push(
          <Polygon
            key={`cliff-w-${row}-${col}`}
            points={`${x},${y + hh} ${x},${y + hh + cliffH} ${x + hw},${y + TILE_H + cliffH} ${x + hw},${y + TILE_H}`}
            fill="#7A6040"
          />
        );
      }
    }
  }

  return <>{elements}</>;
}

const IsometricForest = React.memo(IsometricForestInner);
export default IsometricForest;
