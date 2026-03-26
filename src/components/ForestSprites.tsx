// ForestSprites.tsx
// FitRealm - Dense 3-layer forest border using pre-rendered 3D Low Poly sprites
// Layer 1: Ground cover (grass, plants, flowers) on every tile
// Layer 2: Bushes & rocks on ~70% of tiles
// Layer 3: Trees on ~85% of tiles (30% get two trees)

import React, { useMemo } from 'react';
import { Image } from 'react-native';
import {
  NatureSprites, NatureSpriteKey,
  TREE_SPRITES, SMALL_PROP_SPRITES, GROUND_DETAIL_SPRITES,
} from '../assets/nature-sprites';
import { gridToScreen, TILE_W, TILE_H } from '../utils/isometric';

interface ForestElement {
  sprite: NatureSpriteKey;
  screenX: number;
  screenY: number;
  size: number;
  sortY: number; // for depth ordering
}

// Deterministic seeded random
function srand(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function pickFrom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(srand(seed) * arr.length)];
}

function generateDenseForest(gridSize: number, borderSize: number): ForestElement[] {
  const elements: ForestElement[] = [];
  const totalSize = gridSize + borderSize * 2;

  for (let row = -borderSize; row < gridSize + borderSize; row++) {
    for (let col = -borderSize; col < gridSize + borderSize; col++) {
      // Skip the playable grid
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) continue;

      const baseSeed = (row + borderSize) * 1000 + (col + borderSize);
      const { x, y } = gridToScreen(row + borderSize, col + borderSize, totalSize);
      const tileBaseY = y + TILE_H; // bottom of tile for depth sorting

      // Distance to grid edge (for size scaling)
      const distToGrid = Math.min(
        row < 0 ? -row : row >= gridSize ? row - gridSize + 1 : borderSize,
        col < 0 ? -col : col >= gridSize ? col - gridSize + 1 : borderSize,
      );
      const edgeScale = distToGrid <= 1 ? 0.75 : 1.0;

      // ── Layer 1: Ground Cover (2-3 per tile) ──
      const groundCount = 2 + (srand(baseSeed + 10) > 0.6 ? 1 : 0);
      for (let g = 0; g < groundCount; g++) {
        const sprite = pickFrom(GROUND_DETAIL_SPRITES, baseSeed + 50 + g * 7);
        const size = (25 + srand(baseSeed + 60 + g) * 20) * edgeScale;
        const offX = (srand(baseSeed + 70 + g) - 0.5) * TILE_W * 0.6;
        const offY = (srand(baseSeed + 80 + g) - 0.5) * TILE_H * 0.5;
        elements.push({
          sprite,
          screenX: x + TILE_W / 2 + offX - size / 2,
          screenY: y + TILE_H / 2 + offY - size * 0.6,
          size,
          sortY: tileBaseY - 2, // behind everything on same tile
        });
      }

      // ── Layer 2: Bushes & Rocks (~70%) ──
      if (srand(baseSeed + 200) < 0.70) {
        const sprite = pickFrom(SMALL_PROP_SPRITES, baseSeed + 210);
        const size = (35 + srand(baseSeed + 220) * 25) * edgeScale;
        const offX = (srand(baseSeed + 230) - 0.5) * TILE_W * 0.4;
        const offY = (srand(baseSeed + 240) - 0.5) * TILE_H * 0.3;
        elements.push({
          sprite,
          screenX: x + TILE_W / 2 + offX - size / 2,
          screenY: y + TILE_H / 2 + offY - size * 0.7,
          size,
          sortY: tileBaseY - 1,
        });
      }

      // ── Layer 3: Trees (~85%, 30% get two) ──
      if (srand(baseSeed + 300) < 0.85) {
        const sprite = pickFrom(TREE_SPRITES, baseSeed + 310);
        const size = (70 + srand(baseSeed + 320) * 40) * edgeScale;
        const offX = (srand(baseSeed + 330) - 0.5) * TILE_W * 0.35;
        const offY = (srand(baseSeed + 340) - 0.5) * TILE_H * 0.2;
        elements.push({
          sprite,
          screenX: x + TILE_W / 2 + offX - size / 2,
          screenY: y + TILE_H / 2 + offY - size, // bottom-anchored
          size,
          sortY: tileBaseY,
        });

        // 30% chance for a second tree
        if (srand(baseSeed + 350) < 0.30) {
          const sprite2 = pickFrom(TREE_SPRITES, baseSeed + 360);
          const size2 = (60 + srand(baseSeed + 370) * 30) * edgeScale;
          const offX2 = (srand(baseSeed + 380) - 0.5) * TILE_W * 0.5;
          const offY2 = (srand(baseSeed + 390) - 0.5) * TILE_H * 0.3;
          elements.push({
            sprite: sprite2,
            screenX: x + TILE_W / 2 + offX2 - size2 / 2,
            screenY: y + TILE_H / 2 + offY2 - size2,
            size: size2,
            sortY: tileBaseY + 1,
          });
        }
      }
    }
  }

  // Sort by depth (back to front)
  elements.sort((a, b) => a.sortY - b.sortY);
  return elements;
}

interface Props {
  gridSize: number;
  borderSize: number;
}

function ForestSpritesInner({ gridSize, borderSize }: Props) {
  const elements = useMemo(
    () => generateDenseForest(gridSize, borderSize),
    [gridSize, borderSize],
  );

  return (
    <>
      {elements.map((el, i) => (
        <Image
          key={`fs-${i}`}
          source={NatureSprites[el.sprite]}
          style={{
            position: 'absolute',
            left: el.screenX,
            top: el.screenY,
            width: el.size,
            height: el.size,
          }}
          resizeMode="contain"
        />
      ))}
    </>
  );
}

const ForestSprites = React.memo(ForestSpritesInner);
export default ForestSprites;
