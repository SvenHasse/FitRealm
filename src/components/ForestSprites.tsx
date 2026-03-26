// ForestSprites.tsx
// FitRealm - Pre-rendered 3D Low Poly tree/rock/bush sprites as React Native <Image>
// Must be rendered OUTSIDE <Svg>, as sibling elements in the same absolute container

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
  zIndex: number;
}

// Deterministic random from seed (sin-hash)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function generateForestElements(gridSize: number, borderSize: number): ForestElement[] {
  const elements: ForestElement[] = [];
  const totalSize = gridSize + borderSize * 2;

  for (let row = -borderSize; row < gridSize + borderSize; row++) {
    for (let col = -borderSize; col < gridSize + borderSize; col++) {
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) continue;

      const seed = (row + borderSize) * 1000 + (col + borderSize);
      const rand = seededRandom(seed);

      // 25% empty, 50% tree, 15% small prop, 10% ground detail
      if (rand < 0.25) continue;

      const { x, y } = gridToScreen(row + borderSize, col + borderSize, totalSize);

      let sprite: NatureSpriteKey;
      let size: number;

      if (rand < 0.75) {
        // Tree
        const pool = TREE_SPRITES;
        sprite = pool[Math.floor(seededRandom(seed + 100) * pool.length)];
        size = 60 + seededRandom(seed + 200) * 40; // 60-100px

        // Trees near grid edge are smaller
        const distToGrid = Math.min(
          row < 0 ? -row : row >= gridSize ? row - gridSize + 1 : borderSize,
          col < 0 ? -col : col >= gridSize ? col - gridSize + 1 : borderSize,
        );
        if (distToGrid <= 1) size *= 0.8;
      } else if (rand < 0.90) {
        // Small prop
        const pool = SMALL_PROP_SPRITES;
        sprite = pool[Math.floor(seededRandom(seed + 300) * pool.length)];
        size = 30 + seededRandom(seed + 400) * 25;
      } else {
        // Ground detail
        const pool = GROUND_DETAIL_SPRITES;
        sprite = pool[Math.floor(seededRandom(seed + 500) * pool.length)];
        size = 20 + seededRandom(seed + 600) * 20;
      }

      // Small random offset within tile
      const offsetX = (seededRandom(seed + 700) - 0.5) * TILE_W * 0.3;
      const offsetY = (seededRandom(seed + 800) - 0.5) * TILE_H * 0.3;

      elements.push({
        sprite,
        screenX: x + TILE_W / 2 + offsetX - size / 2,
        screenY: y + TILE_H / 2 + offsetY - size,
        size,
        zIndex: Math.round(y + TILE_H),
      });
    }
  }

  elements.sort((a, b) => a.zIndex - b.zIndex);
  return elements;
}

interface Props {
  gridSize: number;
  borderSize: number;
}

function ForestSpritesInner({ gridSize, borderSize }: Props) {
  const elements = useMemo(
    () => generateForestElements(gridSize, borderSize),
    [gridSize, borderSize],
  );

  return (
    <>
      {elements.map((el, index) => (
        <Image
          key={`fsprite-${index}`}
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
