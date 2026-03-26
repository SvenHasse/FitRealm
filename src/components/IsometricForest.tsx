// IsometricForest.tsx
// FitRealm - Renders forest border tiles with trees and rocks around the isometric grid

import React from 'react';
import { Polygon, Rect, G } from 'react-native-svg';
import { TILE_W, TILE_H, TILE_DEPTH, gridToScreen } from '../utils/isometric';

interface Props {
  gridSize: number;
  borderSize: number; // typically 3
}

// Deterministic seeded random using LCG
function seededRandom(row: number, col: number): number {
  let s = ((row * 1000 + col) * 1664525 + 1013904223) >>> 0;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  return (s >>> 0) / 0x100000000;
}

type NatureType = 'pine' | 'tree' | 'rock' | 'empty';

function getNatureType(row: number, col: number): NatureType {
  const r = seededRandom(row, col);
  if (r < 0.35) return 'pine';
  if (r < 0.70) return 'tree';
  if (r < 0.80) return 'rock';
  return 'empty';
}

// --- Pine Tree SVG ---
function PineTree({ x, y, scale }: { x: number; y: number; scale: number }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const cx = x + hw;
  const baseY = y + hh;

  return (
    <G transform={`translate(${cx}, ${baseY}) scale(${scale})`}>
      {/* Trunk */}
      <Rect x={-2} y={-14} width={4} height={12} fill="#3E2723" />
      {/* Bottom layer */}
      <Polygon points="-14,-14 0,-30 14,-14" fill="#1B5E20" />
      {/* Mid layer */}
      <Polygon points="-11,-22 0,-36 11,-22" fill="#2E7D32" />
      {/* Top layer */}
      <Polygon points="-8,-30 0,-42 8,-30" fill="#388E3C" />
    </G>
  );
}

// --- Common Tree SVG ---
function CommonTree({ x, y, scale }: { x: number; y: number; scale: number }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const cx = x + hw;
  const baseY = y + hh;

  return (
    <G transform={`translate(${cx}, ${baseY}) scale(${scale})`}>
      {/* Trunk */}
      <Rect x={-2.5} y={-12} width={5} height={10} fill="#5D4037" />
      {/* Crown - irregular polygon */}
      <Polygon points="-16,-12 -12,-28 0,-34 12,-28 16,-12 8,-14 0,-16 -8,-14" fill="#2E7D32" />
      <Polygon points="-12,-16 -8,-28 4,-30 12,-18 6,-20 -2,-22 -8,-18" fill="#1B5E20" opacity={0.6} />
    </G>
  );
}

// --- Rock SVG (small isometric box) ---
function Rock({ x, y, scale }: { x: number; y: number; scale: number }) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const cx = x + hw;
  const baseY = y + hh;
  const rw = 10; // half-width of rock
  const rh = 5;  // half-height of rock diamond
  const rd = 6;  // depth

  return (
    <G transform={`translate(${cx}, ${baseY}) scale(${scale})`}>
      {/* Left side */}
      <Polygon points={`${-rw},0 0,${rh} 0,${rh + rd} ${-rw},${rd}`} fill="#546E7A" />
      {/* Right side */}
      <Polygon points={`0,${rh} ${rw},0 ${rw},${rd} 0,${rh + rd}`} fill="#607D8B" />
      {/* Top face */}
      <Polygon points={`0,${-rh} ${rw},0 0,${rh} ${-rw},0`} fill="#90A4AE" />
    </G>
  );
}

function IsometricForestInner({ gridSize, borderSize }: Props) {
  const totalSize = gridSize + borderSize * 2;
  const elements: React.ReactElement[] = [];

  for (let row = -borderSize; row < gridSize + borderSize; row++) {
    for (let col = -borderSize; col < gridSize + borderSize; col++) {
      // Skip the actual game grid area
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) continue;

      const { x, y } = gridToScreen(row + borderSize, col + borderSize, totalSize);
      const hw = TILE_W / 2;
      const hh = TILE_H / 2;

      // Grass tile
      const topFace = `${x},${y + hh} ${x + hw},${y} ${x + TILE_W},${y + hh} ${x + hw},${y + TILE_H}`;
      const leftFace = `${x},${y + hh} ${x + hw},${y + TILE_H} ${x + hw},${y + TILE_H + TILE_DEPTH} ${x},${y + hh + TILE_DEPTH}`;
      const rightFace = `${x + hw},${y + TILE_H} ${x + TILE_W},${y + hh} ${x + TILE_W},${y + hh + TILE_DEPTH} ${x + hw},${y + TILE_H + TILE_DEPTH}`;

      // Slightly darker forest green
      elements.push(
        <G key={`forest-${row}-${col}`}>
          <Polygon points={leftFace} fill="#1E4A10" />
          <Polygon points={rightFace} fill="#275A18" />
          <Polygon points={topFace} fill="#2D6A1E" stroke="rgba(0,0,0,0.08)" strokeWidth={0.3} />
        </G>
      );

      // Nature element
      const natureType = getNatureType(row, col);
      // Slightly smaller near the edge
      const distFromEdge = Math.min(
        row < 0 ? -row : row >= gridSize ? row - gridSize + 1 : borderSize,
        col < 0 ? -col : col >= gridSize ? col - gridSize + 1 : borderSize,
      );
      const scale = distFromEdge <= 1 ? 0.8 : 1.0;

      if (natureType === 'pine') {
        elements.push(<PineTree key={`pine-${row}-${col}`} x={x} y={y} scale={scale} />);
      } else if (natureType === 'tree') {
        elements.push(<CommonTree key={`tree-${row}-${col}`} x={x} y={y} scale={scale} />);
      } else if (natureType === 'rock') {
        elements.push(<Rock key={`rock-${row}-${col}`} x={x} y={y} scale={scale} />);
      }
    }
  }

  return <>{elements}</>;
}

const IsometricForest = React.memo(IsometricForestInner);
export default IsometricForest;
