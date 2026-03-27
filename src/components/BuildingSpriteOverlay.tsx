// BuildingSpriteOverlay.tsx
// Renders pre-rendered PNG building sprites on top of the isometric grid.
// Only rathaus (burg_level_1..5) and holzfaeller (schmiede_level_1) use PNG assets.
// All other building types are rendered as SVG via IsometricBuildingSpriteG
// directly inside the main Svg canvas in RealmScreen (buildingLayer).

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
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
  /** Offset from the Animated.View origin to the SVG canvas top-left */
  svgOffsetX: number;
  svgOffsetY: number;
}

// ── PNG sprite helpers ────────────────────────────────────────────────────────

/** Building types that have pre-rendered PNG assets */
export const PNG_BUILDINGS = new Set<BuildingType>([
  BuildingType.rathaus,
  BuildingType.holzfaeller,
]);

function getSpriteSource(type: BuildingType, level: number): any | null {
  if (type === BuildingType.rathaus) {
    const clampedLevel = Math.max(1, Math.min(5, level));
    const key = `burg_level_${clampedLevel}` as keyof typeof BuildingSprites;
    return BuildingSprites[key] ?? null;
  }
  if (type === BuildingType.holzfaeller) {
    return BuildingSprites.schmiede_level_1;
  }
  return null;
}

const PNG_SCALE: Partial<Record<BuildingType, number>> = {
  [BuildingType.rathaus]:     1.15,
  [BuildingType.holzfaeller]: 1.0,
};
const DEFAULT_PNG_SCALE = 0.95;

// ── Component — PNG only ──────────────────────────────────────────────────────

function BuildingSpriteOverlayInner({ buildings, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const pngSprites = useMemo(() => {
    const result: { key: string; source: any; x: number; y: number; size: number; zIndex: number }[] = [];

    for (const b of buildings) {
      if (b.isUnderConstruction) continue;
      if (!PNG_BUILDINGS.has(b.type)) continue;

      const source = getSpriteSource(b.type, b.level);
      if (!source) continue;

      const { x, y } = gridToScreen(b.position.row, b.position.col, gridSize);
      const scale = PNG_SCALE[b.type] ?? DEFAULT_PNG_SCALE;
      const size = TILE_W * scale;
      const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
      const spriteY = svgOffsetY + y + TILE_H / 2 - size * 0.75;
      result.push({
        key: `png-${b.position.row}-${b.position.col}`,
        source,
        x: spriteX,
        y: spriteY,
        size,
        zIndex: Math.round(y + TILE_H),
      });
    }

    result.sort((a, b) => a.zIndex - b.zIndex);
    return result;
  }, [buildings, gridSize, svgOffsetX, svgOffsetY]);

  if (pngSprites.length === 0) return null;

  return (
    <>
      {pngSprites.map((s) => (
        <View
          key={s.key}
          style={{ position: 'absolute', left: s.x, top: s.y, width: s.size, height: s.size, zIndex: s.zIndex }}
          pointerEvents="none"
        >
          <Image source={s.source} style={{ width: s.size, height: s.size }} resizeMode="contain" />
        </View>
      ))}
    </>
  );
}

export const BuildingSpriteOverlay = React.memo(BuildingSpriteOverlayInner);
