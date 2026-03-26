// IsometricBuilding.tsx
// FitRealm - Isometric 3D box representing a building on the realm map

import React from 'react';
import { Polygon, Line, G, Text as SvgText } from 'react-native-svg';
import { BuildingType, buildingAccentColor } from '../models/types';
import { TILE_W, TILE_H } from '../utils/isometric';

interface Props {
  x: number;  // screen x of the tile
  y: number;  // screen y of the tile
  buildingType: BuildingType;
  level: number;
  isUnderConstruction: boolean;
}

// Building heights by category
const SMALL_TYPES: Set<BuildingType> = new Set([
  BuildingType.holzfaeller, BuildingType.feld, BuildingType.holzlager,
  BuildingType.steinlager, BuildingType.nahrungslager, BuildingType.stall,
]);
const LARGE_TYPES: Set<BuildingType> = new Set([
  BuildingType.rathaus, BuildingType.stammeshaus,
]);

function getBuildingHeight(type: BuildingType): number {
  if (SMALL_TYPES.has(type)) return 32;
  if (LARGE_TYPES.has(type)) return 64;
  return 48; // medium
}

function darkenColor(hex: string, factor: number): string {
  // Handle non-hex colours (fallback)
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
}

// MaterialCommunityIcons single-character representation for SVG <Text>
// Since we can't use icon fonts directly inside SVG, we use a simple text label.
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
  [BuildingType.stall]: 'St',
  [BuildingType.wachturm]: 'W',
  [BuildingType.mauer]: 'Ma',
};

function IsometricBuildingInner({ x, y, buildingType, level, isUnderConstruction }: Props) {
  const hw = TILE_W / 2; // 48
  const hh = TILE_H / 2; // 24
  const bh = getBuildingHeight(buildingType);
  const accent = isUnderConstruction ? '#F5A623' : buildingAccentColor(buildingType);
  const topColor = accent;
  const leftColor = darkenColor(accent, 0.75);
  const rightColor = darkenColor(accent, 0.60);

  // Tile centre points
  const cx = x + hw;      // centre x of diamond
  const cy = y + hh;      // centre y of diamond

  // Top face (roof) - diamond at elevated position
  const roofTop = `${cx},${cy - bh - hh} ${x + TILE_W},${cy - bh} ${cx},${cy - bh + hh} ${x},${cy - bh}`;

  // Left face of box
  const leftFace = `${x},${cy - bh} ${cx},${cy - bh + hh} ${cx},${cy + hh} ${x},${cy}`;

  // Right face of box
  const rightFace = `${cx},${cy - bh + hh} ${x + TILE_W},${cy - bh} ${x + TILE_W},${cy} ${cx},${cy + hh}`;

  return (
    <G>
      {/* Left face */}
      <Polygon points={leftFace} fill={leftColor} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Right face */}
      <Polygon points={rightFace} fill={rightColor} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Top face (roof) */}
      <Polygon points={roofTop} fill={topColor} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5} />

      {/* Construction diagonal lines */}
      {isUnderConstruction && (
        <>
          <Line x1={x + 10} y1={cy - bh + 10} x2={cx - 10} y2={cy + hh - 10} stroke="rgba(0,0,0,0.3)" strokeWidth={2} strokeDasharray="4,4" />
          <Line x1={cx + 10} y1={cy - bh + 10} x2={x + TILE_W - 10} y2={cy - 10} stroke="rgba(0,0,0,0.3)" strokeWidth={2} strokeDasharray="4,4" />
        </>
      )}

      {/* Building label on top face */}
      <SvgText
        x={cx}
        y={cy - bh + 4}
        fontSize={14}
        fontWeight="bold"
        fill="rgba(255,255,255,0.9)"
        textAnchor="middle"
        alignmentBaseline="central"
      >
        {BUILDING_LABELS[buildingType] ?? '?'}
      </SvgText>

      {/* Level indicator */}
      {level > 0 && (
        <SvgText
          x={cx + hw - 8}
          y={cy + hh - 2}
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
