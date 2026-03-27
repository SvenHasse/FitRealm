// BuildingSpriteOverlay.tsx
// Renders building visuals on top of the isometric grid.
//   • PNG sprites  → rathaus (burg_level_1..5) + holzfaeller (schmiede_level_1)
//   • SVG sprites  → all other building types via IsometricBuildingSprite

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { BuildingType } from '../models/types';
import { BuildingSprites } from '../assets/buildings';
import { gridToScreen, TILE_W, TILE_H } from '../utils/isometric';
import {
  IsometricBuildingSprite,
  SPRITE_HEIGHT,
  DEFAULT_SPRITE_HEIGHT,
} from './IsometricBuildingSprite';

interface Building {
  type: BuildingType;
  level: number;
  position: { row: number; col: number };
  isUnderConstruction: boolean;
  isDecayed: boolean;
}

interface Props {
  buildings: Building[];
  gridSize: number;
  /** Offset from the container to the SVG origin */
  svgOffsetX: number;
  svgOffsetY: number;
}

// ── PNG sprite helpers ────────────────────────────────────────────────────────

/** Building types that have pre-rendered PNG assets */
const PNG_BUILDINGS = new Set<BuildingType>([
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

// ── Main component ────────────────────────────────────────────────────────────

function BuildingSpriteOverlayInner({ buildings, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const items = useMemo(() => {
    const png: { key: string; source: any; x: number; y: number; size: number; zIndex: number }[] = [];
    const svg: { key: string; type: BuildingType; level: number; isDecayed: boolean; x: number; y: number; H: number; zIndex: number }[] = [];

    for (const b of buildings) {
      if (b.isUnderConstruction) continue; // scaffold handled by IsometricBuilding SVG

      const { x, y } = gridToScreen(b.position.row, b.position.col, gridSize);
      const zIndex = Math.round(y + TILE_H);

      if (PNG_BUILDINGS.has(b.type)) {
        // ── PNG path ──────────────────────────────────────────────────────────
        const source = getSpriteSource(b.type, b.level);
        if (!source) continue;
        const scale = PNG_SCALE[b.type] ?? DEFAULT_PNG_SCALE;
        const size = TILE_W * scale;
        const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
        const spriteY = svgOffsetY + y + TILE_H / 2 - size * 0.75;
        png.push({ key: `png-${b.position.row}-${b.position.col}`, source, x: spriteX, y: spriteY, size, zIndex });
      } else {
        // ── SVG sprite path ───────────────────────────────────────────────────
        const H = SPRITE_HEIGHT[b.type] ?? DEFAULT_SPRITE_HEIGHT;
        // The SVG is TILE_W wide × (TILE_H + H) tall.
        // Position so the bottom diamond aligns with the underlying grid tile.
        const spriteX = svgOffsetX + x;
        const spriteY = svgOffsetY + y - H;
        svg.push({
          key: `svg-${b.position.row}-${b.position.col}`,
          type: b.type,
          level: b.level,
          isDecayed: b.isDecayed,
          x: spriteX,
          y: spriteY,
          H,
          zIndex,
        });
      }
    }

    // Sort each list by zIndex for correct depth overlap
    png.sort((a, b) => a.zIndex - b.zIndex);
    svg.sort((a, b) => a.zIndex - b.zIndex);
    return { png, svg };
  }, [buildings, gridSize, svgOffsetX, svgOffsetY]);

  if (items.png.length === 0 && items.svg.length === 0) return null;

  return (
    <>
      {/* PNG sprites */}
      {items.png.map((s) => (
        <View
          key={s.key}
          style={{ position: 'absolute', left: s.x, top: s.y, width: s.size, height: s.size, zIndex: s.zIndex }}
          pointerEvents="none"
        >
          <Image source={s.source} style={{ width: s.size, height: s.size }} resizeMode="contain" />
        </View>
      ))}

      {/* SVG sprites — detailed isometric buildings for all non-PNG types */}
      {items.svg.map((s) => (
        <View
          key={s.key}
          style={{ position: 'absolute', left: s.x, top: s.y, zIndex: s.zIndex }}
          pointerEvents="none"
        >
          <IsometricBuildingSprite
            type={s.type}
            level={s.level}
            H={s.H}
            isDecayed={s.isDecayed}
          />
        </View>
      ))}
    </>
  );
}

export const BuildingSpriteOverlay = React.memo(BuildingSpriteOverlayInner);
