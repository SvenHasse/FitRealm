// BuildingSpriteOverlay.tsx
// Renders PNG building sprites for ALL building types on top of the isometric grid.
// Sprites are 512×512 PNGs with transparent background.
// Replace any {type}_level_{n}.png in src/assets/buildings/ with a real render
// to upgrade that building's appearance immediately — no code changes needed.

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

// ── Sprite lookup ─────────────────────────────────────────────────────────────

function getSpriteSource(type: BuildingType, level: number): any | null {
  // Clamp to levels we have assets for
  const maxLevels: Partial<Record<BuildingType, number>> = {
    [BuildingType.rathaus]:     5,
    [BuildingType.holzfaeller]: 4,
    [BuildingType.feld]:        4,
    [BuildingType.steinbruch]:  4,
    [BuildingType.holzlager]:   4,
    [BuildingType.kaserne]:     4,
    [BuildingType.proteinfarm]: 4,
  };
  const maxLevel = maxLevels[type] ?? 3;
  const l = Math.max(1, Math.min(maxLevel, level));

  // Rathaus uses legacy key name "burg"
  if (type === BuildingType.rathaus) {
    const key = `burg_level_${l}` as keyof typeof BuildingSprites;
    return BuildingSprites[key] ?? null;
  }

  // All other types use {type}_level_{n}
  const key = `${type}_level_${l}` as keyof typeof BuildingSprites;
  return (BuildingSprites as any)[key] ?? null;
}

// Alle Gebäude-Sprites werden einheitlich auf 1 Kachel (TILE_W) skaliert.
// Die PNGs werden bereits in korrekter isometrischer Größe gerendert
// (512×512 transparent, Footprint = 140×70 isometrische Raute).
const UNIFORM_SCALE = 1.0;

// ── Component ─────────────────────────────────────────────────────────────────

function BuildingSpriteOverlayInner({ buildings, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const sprites = useMemo(() => {
    const result: {
      key: string;
      source: any;
      x: number;
      y: number;
      size: number;
      zIndex: number;
    }[] = [];

    for (const b of buildings) {
      if (b.isUnderConstruction) continue; // scaffold shown by IsometricBuilding SVG

      const source = getSpriteSource(b.type, b.level);
      if (!source) continue;

      const { x, y } = gridToScreen(b.position.row, b.position.col, gridSize);
      const size = TILE_W * UNIFORM_SCALE;

      // Center horizontally, bottom-align to tile's bottom vertex (y + TILE_H).
      // The PNGs have ~12% transparent padding at the bottom, so we nudge
      // the sprite down by that fraction so the visible building base
      // sits on the tile instead of floating above it.
      const BOTTOM_PAD_FRAC = 0.12; // ~12% empty space at PNG bottom
      const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
      const spriteY = svgOffsetY + y + TILE_H - size + size * BOTTOM_PAD_FRAC;

      result.push({
        key: `sprite-${b.position.row}-${b.position.col}`,
        source,
        x: spriteX,
        y: spriteY,
        size,
        zIndex: Math.round(y + TILE_H), // depth sort: lower row = higher zIndex = in front
      });
    }

    // Isometric depth sort
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

/** Building types rendered via PNG overlay (all of them now) */
export const PNG_BUILDINGS = new Set<BuildingType>(
  Object.values(BuildingType) as BuildingType[]
);
