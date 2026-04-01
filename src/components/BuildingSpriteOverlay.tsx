// BuildingSpriteOverlay.tsx
// Renders pre-rendered isometric building PNGs on top of the isometric grid.
// All sprites are 512×512px, SW-perspective (54.736° tilt), transparent background.
// Buildings without a sprite fall back to the SVG cuboid in IsometricBuilding.

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { BuildingType } from '../models/types';
import { getBuildingSprite } from '../assets/village/buildingSprites';
import { gridToScreen, TILE_W, TILE_H } from '../utils/isometric';

interface Building {
  type: BuildingType;
  level: number;
  position: { row: number; col: number };
  isUnderConstruction: boolean;
}

interface Props {
  buildings: Building[];
  gridSize: number;
  /** Offset from the container to the SVG origin */
  svgOffsetX: number;
  svgOffsetY: number;
}

// All sprites are normalized to max 2.0 Units in Blender → uniform display size
const UNIFORM_SCALE = 1.0; // sprite fills TILE_W

function BuildingSpriteOverlayInner({ buildings, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const sprites = useMemo(() => {
    const result: {
      key: string;
      source: ReturnType<typeof require>;
      x: number;
      y: number;
      size: number;
      zIndex: number;
    }[] = [];

    for (const b of buildings) {
      if (b.isUnderConstruction) continue; // Under construction → SVG scaffold
      const source = getBuildingSprite(b.type, b.level ?? 1);
      if (!source) continue;

      const { x, y } = gridToScreen(b.position.row, b.position.col, gridSize);
      const size = TILE_W * UNIFORM_SCALE;

      // Center the sprite on the tile, bottom-anchor so it "stands" on the diamond
      const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
      const spriteY = svgOffsetY + y + TILE_H / 2 - size * 0.75;

      result.push({
        key: `sprite-${b.position.row}-${b.position.col}`,
        source,
        x: spriteX,
        y: spriteY,
        size,
        zIndex: Math.round(y + TILE_H), // depth sort: lower on screen = in front
      });
    }

    // Sort by zIndex for correct overlap
    result.sort((a, b) => a.zIndex - b.zIndex);
    return result;
  }, [buildings, gridSize, svgOffsetX, svgOffsetY]);

  if (sprites.length === 0) return null;

  return (
    <>
      {sprites.map((s) => (
        <View
          key={s.key}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            zIndex: s.zIndex,
          }}
          pointerEvents="none"
        >
          <Image
            source={s.source}
            style={{ width: s.size, height: s.size }}
            resizeMode="contain"
          />
        </View>
      ))}
    </>
  );
}

export const BuildingSpriteOverlay = React.memo(BuildingSpriteOverlayInner);
