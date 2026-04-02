// ObstacleSpriteOverlay.tsx
// Renders obstacle PNG sprites as absolutely-positioned views over the isometric grid.
// Mirrors the same positioning formula as BuildingSpriteOverlay.

import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import { gridToScreen, TILE_W, TILE_H } from '../utils/isometric';

interface Obstacle {
  id: string;
  row: number;
  col: number;
  type: string;
  isCleared: boolean;
  isClearing: boolean;
}

interface Props {
  obstacles: Obstacle[];
  gridSize: number;
  svgOffsetX: number;
  svgOffsetY: number;
}

const SPRITE_MAP: Record<string, any> = {
  smallRock: require('../assets/obstacles/small_rock.png'),
  boulder:   require('../assets/obstacles/boulder.png'),
  largeTree: require('../assets/obstacles/large_tree.png'),
  deadTree:  require('../assets/obstacles/dead_tree.png'),
  branch:    require('../assets/obstacles/branch.png'),
  mushrooms: require('../assets/obstacles/mushrooms.png'),
};

const SPRITE_SIZE = TILE_W * 0.7; // slightly smaller than a full tile

function ObstacleSpriteOverlayInner({ obstacles, gridSize, svgOffsetX, svgOffsetY }: Props) {
  const sprites = useMemo(() => {
    return obstacles
      .filter(o => !o.isCleared)
      .map(o => {
        const source = SPRITE_MAP[o.type];
        if (!source) return null;
        const { x, y } = gridToScreen(o.row, o.col, gridSize);
        const size = SPRITE_SIZE;
        // Center horizontally on tile, bottom-align to tile's bottom vertex
        const spriteX = svgOffsetX + x + TILE_W / 2 - size / 2;
        const spriteY = svgOffsetY + y + TILE_H - size;
        return {
          key: `obs-sprite-${o.id}`,
          source,
          x: spriteX,
          y: spriteY,
          size,
          opacity: o.isClearing ? 0.5 : 1,
          zIndex: o.row + o.col,
        };
      })
      .filter(Boolean) as NonNullable<ReturnType<typeof obstacles.map>[number]>[];
  }, [obstacles, gridSize, svgOffsetX, svgOffsetY]);

  if (sprites.length === 0) return null;

  return (
    <>
      {sprites.map((s: any) => (
        <View
          key={s.key}
          style={{
            position: 'absolute',
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            zIndex: s.zIndex,
            opacity: s.opacity,
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

export const ObstacleSpriteOverlay = React.memo(ObstacleSpriteOverlayInner);
