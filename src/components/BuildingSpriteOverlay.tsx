// BuildingSpriteOverlay.tsx
// Renders pre-rendered 3D building PNGs on top of the isometric grid.
// Only buildings with available sprites get the PNG treatment.
// Others still use the SVG cuboid fallback in IsometricBuilding.

import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BuildingType } from '../models/types';
import { BuildingSprites } from '../assets/buildings';
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

// Map building type + level to sprite key
function getSpriteSource(type: BuildingType, level: number): any | null {
  if (type === BuildingType.rathaus) {
    const clampedLevel = Math.max(1, Math.min(5, level));
    const key = `burg_level_${clampedLevel}` as keyof typeof BuildingSprites;
    return BuildingSprites[key] ?? null;
  }
  if (type === BuildingType.holzfaeller) {
    return BuildingSprites.schmiede_level_1;
  }
  return null; // No sprite available — SVG fallback
}

// Sprite display size relative to tile
const SPRITE_SCALE: Partial<Record<BuildingType, number>> = {
  [BuildingType.rathaus]: 1.6,     // burg fills ~1.6 tiles
  [BuildingType.holzfaeller]: 1.4, // schmiede proportional to burg
};
const DEFAULT_SCALE = 1.2;

function BuildingSpriteOverlayInner({ buildings, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const sprites = useMemo(() => {
    const result: { key: string; source: any; x: number; y: number; size: number; zIndex: number }[] = [];

    for (const b of buildings) {
      if (b.isUnderConstruction) continue; // Under construction = use SVG scaffold
      const source = getSpriteSource(b.type, b.level);
      if (!source) continue;

      const { x, y } = gridToScreen(b.position.row, b.position.col, gridSize);
      const scale = SPRITE_SCALE[b.type] ?? DEFAULT_SCALE;
      const size = TILE_W * scale;

      // Position: center the sprite on the tile, shift up so it "stands" on the tile
      const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
      const spriteY = svgOffsetY + y + TILE_H / 2 - size * 0.75; // bottom-anchored

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
