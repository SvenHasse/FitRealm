// IsometricTile.tsx
// FitRealm - A single isometric diamond tile rendered via react-native-svg

import React from 'react';
import { Polygon } from 'react-native-svg';
import { TILE_W, TILE_H, TILE_DEPTH } from '../utils/isometric';

type TileVariant = 'grass' | 'path' | 'water' | 'highlight';

interface Props {
  x: number;
  y: number;
  variant: TileVariant;
}

const TILE_COLORS: Record<TileVariant, { top: string; left: string; right: string; stroke?: string }> = {
  grass:     { top: 'transparent', left: 'transparent', right: 'transparent' },
  path:      { top: 'transparent', left: 'transparent', right: 'transparent' },
  water:     { top: 'rgba(44,95,138,0.3)', left: 'transparent', right: 'transparent' },
  highlight: { top: 'rgba(255,215,0,0.3)', left: 'transparent', right: 'transparent', stroke: '#FFD700' },
};

function IsometricTileInner({ x, y, variant }: Props) {
  const hw = TILE_W / 2; // 48
  const hh = TILE_H / 2; // 24
  const colors = TILE_COLORS[variant];

  // Top face diamond: top, right, bottom, left
  const topFace = `${x},${y + hh} ${x + hw},${y} ${x + TILE_W},${y + hh} ${x + hw},${y + TILE_H}`;

  // Left side face
  const leftFace = `${x},${y + hh} ${x + hw},${y + TILE_H} ${x + hw},${y + TILE_H + TILE_DEPTH} ${x},${y + hh + TILE_DEPTH}`;

  // Right side face
  const rightFace = `${x + hw},${y + TILE_H} ${x + TILE_W},${y + hh} ${x + TILE_W},${y + hh + TILE_DEPTH} ${x + hw},${y + TILE_H + TILE_DEPTH}`;

  return (
    <>
      {TILE_DEPTH > 0 && <Polygon points={leftFace} fill={colors.left} />}
      {TILE_DEPTH > 0 && <Polygon points={rightFace} fill={colors.right} />}
      <Polygon
        points={topFace}
        fill={colors.top}
        stroke={colors.stroke ?? 'rgba(255,255,255,0.18)'}
        strokeWidth={colors.stroke ? 1.5 : 0.7}
      />
    </>
  );
}

const IsometricTile = React.memo(IsometricTileInner);
export default IsometricTile;
