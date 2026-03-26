// IsometricForest.tsx
// FitRealm - Forest border: SVG ground tiles (inside <Svg>) + nothing else
// Tree/rock sprites are rendered separately as <Image> elements outside SVG

import React from 'react';
import { Polygon, G } from 'react-native-svg';
import { TILE_W, TILE_H, TILE_DEPTH, gridToScreen } from '../utils/isometric';

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

      elements.push(
        <G key={`forest-${row}-${col}`}>
          <Polygon points={leftFace} fill="#1E4A10" />
          <Polygon points={rightFace} fill="#275A18" />
          <Polygon points={topFace} fill="#2D6A1E" stroke="rgba(0,0,0,0.08)" strokeWidth={0.3} />
        </G>
      );
    }
  }

  return <>{elements}</>;
}

const IsometricForest = React.memo(IsometricForestInner);
export default IsometricForest;
