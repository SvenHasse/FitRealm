// IsometricBuilding.tsx
// FitRealm - Isometric 3D cuboid representing a building on the realm map

import React from 'react';
import { Polygon, Line, G, Text as SvgText } from 'react-native-svg';
import { BuildingType, buildingAccentColor } from '../models/types';
import { TILE_W, TILE_H } from '../utils/isometric';

interface Props {
  x: number;  // screen x of the tile (top-left of bounding box)
  y: number;  // screen y of the tile
  buildingType: BuildingType;
  level: number;
  isUnderConstruction: boolean;
}

// Building heights
const BUILDING_HEIGHT: Partial<Record<BuildingType, number>> = {
  [BuildingType.rathaus]: 56,
  [BuildingType.stammeshaus]: 56,
  [BuildingType.kaserne]: 44,
  [BuildingType.tempel]: 44,
  [BuildingType.bibliothek]: 44,
  [BuildingType.marktplatz]: 40,
  [BuildingType.wachturm]: 44,
  [BuildingType.mauer]: 36,
};
const DEFAULT_HEIGHT = 32;

function getHeight(type: BuildingType): number {
  return BUILDING_HEIGHT[type] ?? DEFAULT_HEIGHT;
}

function darkenHex(hex: string, factor: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const toH = (n: number) => Math.max(0, Math.min(255, Math.round(n * factor))).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

const BUILDING_LABELS: Record<BuildingType, string> = {
  [BuildingType.rathaus]: 'R',
  [BuildingType.kornkammer]: 'K',
  [BuildingType.proteinfarm]: 'P',
  [BuildingType.holzfaeller]: 'H',
  [BuildingType.steinbruch]: 'S',
  [BuildingType.feld]: 'F',
  [BuildingType.holzlager]: 'HL',
  [BuildingType.steinlager]: 'SL',
  [BuildingType.nahrungslager]: 'NL',
  [BuildingType.kaserne]: 'Ka',
  [BuildingType.tempel]: 'T',
  [BuildingType.bibliothek]: 'B',
  [BuildingType.marktplatz]: 'M',
  [BuildingType.stammeshaus]: 'St',
  [BuildingType.lager]: 'La',
  [BuildingType.alchemist]: 'Al',
  [BuildingType.stall]: 'Sl',
  [BuildingType.wachturm]: 'W',
  [BuildingType.mauer]: 'Ma',
};

function IsometricBuildingInner({ x, y, buildingType, level, isUnderConstruction }: Props) {
  const H = getHeight(buildingType);
  const accent = isUnderConstruction ? '#F5A623' : buildingAccentColor(buildingType);
  const topColor = accent;
  const leftColor = darkenHex(accent, 0.75);
  const rightColor = darkenHex(accent, 0.60);

  // Tile diamond reference points
  const top    = { x: x + TILE_W / 2, y: y };
  const right  = { x: x + TILE_W,     y: y + TILE_H / 2 };
  const bottom = { x: x + TILE_W / 2, y: y + TILE_H };
  const left   = { x: x,              y: y + TILE_H / 2 };

  // TOP FACE (roof) — diamond shifted up by H
  const roofPoints = [
    `${top.x},${top.y - H}`,
    `${right.x},${right.y - H}`,
    `${bottom.x},${bottom.y - H}`,
    `${left.x},${left.y - H}`,
  ].join(' ');

  // LEFT FACE — parallelogram from left edge, roof to ground
  const leftFacePoints = [
    `${left.x},${left.y - H}`,
    `${left.x},${left.y}`,
    `${bottom.x},${bottom.y}`,
    `${bottom.x},${bottom.y - H}`,
  ].join(' ');

  // RIGHT FACE — parallelogram from right edge, roof to ground
  const rightFacePoints = [
    `${bottom.x},${bottom.y - H}`,
    `${bottom.x},${bottom.y}`,
    `${right.x},${right.y}`,
    `${right.x},${right.y - H}`,
  ].join(' ');

  // Centre of roof for label
  const roofCx = x + TILE_W / 2;
  const roofCy = y + TILE_H / 2 - H;

  return (
    <G>
      {/* Left face */}
      <Polygon points={leftFacePoints} fill={leftColor} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Right face */}
      <Polygon points={rightFacePoints} fill={rightColor} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Top face (roof) */}
      <Polygon points={roofPoints} fill={topColor} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />

      {/* Construction scaffold lines */}
      {isUnderConstruction && (
        <>
          <Line
            x1={left.x + 8} y1={left.y - H + 8}
            x2={bottom.x - 8} y2={bottom.y - 8}
            stroke="rgba(0,0,0,0.3)" strokeWidth={2} strokeDasharray="4,4"
          />
          <Line
            x1={bottom.x + 8} y1={bottom.y - H + 8}
            x2={right.x - 8} y2={right.y - 8}
            stroke="rgba(0,0,0,0.3)" strokeWidth={2} strokeDasharray="4,4"
          />
        </>
      )}

      {/* Building label on roof */}
      <SvgText
        x={roofCx}
        y={roofCy + 5}
        fontSize={14}
        fontWeight="bold"
        fill="rgba(255,255,255,0.9)"
        textAnchor="middle"
      >
        {BUILDING_LABELS[buildingType] ?? '?'}
      </SvgText>

      {/* Level indicator */}
      {level > 0 && !isUnderConstruction && (
        <SvgText
          x={right.x - 6}
          y={right.y - H + 14}
          fontSize={9}
          fontWeight="bold"
          fill="rgba(255,255,255,0.7)"
          textAnchor="end"
        >
          L{level}
        </SvgText>
      )}
    </G>
  );
}

const IsometricBuilding = React.memo(IsometricBuildingInner);
export default IsometricBuilding;
