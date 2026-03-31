// IsometricBuildingSprite.tsx
// Detailed isometric SVG sprites for every building type that lacks a PNG asset.
//
// Coordinate system (H = building height in pixels):
//   Roof diamond:  top=(70,0)  right=(140,35)  bottom=(70,70)  left=(0,35)
//   Left face:     (0,35)→(0,H+35)→(70,H+70)→(70,70)
//   Right face:    (70,70)→(70,H+70)→(140,H+35)→(140,35)
//
// Two public variants:
//   IsometricBuildingSprite     — standalone <Svg> wrapper (for previews etc.)
//   IsometricBuildingSpriteG    — <G transform="translate(x, y-H)"> for use
//                                 INSIDE the main SVG canvas in RealmScreen.

import React from 'react';
import Svg, {
  Circle, Ellipse, G, Line, Path, Polygon, Rect,
} from 'react-native-svg';
import { BuildingType } from '../models/types';
import { TILE_W, TILE_H } from '../utils/isometric';

// ── Public height table (pixels) ────────────────────────────────────────────

export const SPRITE_HEIGHT: Partial<Record<BuildingType, number>> = {
  [BuildingType.feld]:          16,
  [BuildingType.steinbruch]:    36,
  [BuildingType.proteinfarm]:   40,

  [BuildingType.kaserne]:       44,
  [BuildingType.tempel]:        48,
  [BuildingType.bibliothek]:    44,
  [BuildingType.marktplatz]:    36,
  [BuildingType.stammeshaus]:   56,
  [BuildingType.holzlager]:     28,
  [BuildingType.steinlager]:    28,
  [BuildingType.nahrungslager]: 28,
  [BuildingType.wachturm]:      64,
  [BuildingType.mauer]:         36,
  [BuildingType.stall]:         32,
};
export const DEFAULT_SPRITE_HEIGHT = 32;

// ── Props ────────────────────────────────────────────────────────────────────

export interface IsometricBuildingSpriteProps {
  type: BuildingType;
  level: number;
  H: number;           // building height (from SPRITE_HEIGHT)
  isDecayed?: boolean;
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

const TW = TILE_W;  // 140
const TH = TILE_H;  // 70
const HW = TW / 2;  // 70
const HH = TH / 2;  // 35

// Roof diamond polygon (always at top of SVG, independent of H)
const ROOF = `${HW},0 ${TW},${HH} ${HW},${TH} 0,${HH}`;

function lf(H: number): string {
  // Left face  points (from roof-left clockwise to roof-bottom)
  return `0,${HH} 0,${H + HH} ${HW},${H + TH} ${HW},${TH}`;
}

function rf(H: number): string {
  // Right face points (from roof-bottom clockwise to roof-right)
  return `${HW},${TH} ${HW},${H + TH} ${TW},${H + HH} ${TW},${HH}`;
}

// ── Color utilities ──────────────────────────────────────────────────────────

function desaturate(hex: string, factor: number): string {
  // factor=1 → original, factor=0 → fully gray
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const nr = clamp(gray + (r - gray) * factor);
  const ng = clamp(gray + (g - gray) * factor);
  const nb = clamp(gray + (b - gray) * factor);
  const h2 = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h2(nr)}${h2(ng)}${h2(nb)}`;
}

// Apply decay desaturation
function dc(hex: string, d: boolean): string {
  return d ? desaturate(hex, 0.35) : hex;
}

// ── Decay overlay ────────────────────────────────────────────────────────────

function DecayOverlay({ H }: { H: number }) {
  return (
    <G>
      {/* Cracks on left face */}
      <Line x1={14} y1={HH + H * 0.25} x2={30} y2={HH + H * 0.55}
        stroke="rgba(200,0,0,0.55)" strokeWidth={0.9} />
      <Line x1={30} y1={HH + H * 0.55} x2={20} y2={HH + H * 0.78}
        stroke="rgba(200,0,0,0.55)" strokeWidth={0.9} />
      {/* Warning triangle top-right */}
      <G transform={`translate(${TW - 16}, 2)`}>
        <Polygon points="6,0 12,10 0,10" fill="rgba(220,40,40,0.92)" />
        <Line x1={6} y1={3} x2={6} y2={7.5} stroke="white" strokeWidth={1.2} />
        <Circle cx={6} cy={9} r={0.7} fill="white" />
      </G>
    </G>
  );
}

// ── Level pill ───────────────────────────────────────────────────────────────
// (small L{n} text on roof, same convention as IsometricBuilding)

// ── Individual building sprites ──────────────────────────────────────────────

function FeldSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#7CB342', d);
  const left  = dc('#558B2F', d);
  const right = dc('#33691E', d);
  const stripe = dc('#6D4C41', d);
  const count = Math.min(2 + level, 6);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.12)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.12)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Crop-row stripes across roof diamond */}
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 1) / (count + 1);
        return (
          <Line key={i}
            x1={HW + HW * t} y1={HH * t}
            x2={HW * (1 - t)} y2={HH + HH * t}
            stroke={stripe} strokeWidth={1.1} opacity={0.55}
          />
        );
      })}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function SteinbruchSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#78909C', d);
  const left  = dc('#546E7A', d);
  const right = dc('#455A64', d);
  const block = dc('#90A4AE', d);
  const crane = dc('#37474F', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Stone blocks stacked on right face */}
      <Rect x={HW + 10} y={TH + H * 0.5} width={15} height={8} rx={1}
        fill={block} opacity={0.85} />
      <Rect x={HW + 8}  y={TH + H * 0.65} width={19} height={8} rx={1}
        fill={block} opacity={0.70} />
      <Polygon points={ROOF} fill={roof} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Crane arm (L-shape) on roof */}
      <Line x1={HW + 6} y1={TH - 1} x2={HW + 6} y2={HH - 4}
        stroke={crane} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1={HW + 6} y1={HH - 4} x2={HW + 24} y2={HH - 4}
        stroke={crane} strokeWidth={2.2} strokeLinecap="round" />
      {/* Hanging cable */}
      <Line x1={HW + 24} y1={HH - 4} x2={HW + 24} y2={HH + 4}
        stroke={crane} strokeWidth={0.9} />
      {level >= 3 && (
        <Rect x={HW + 20} y={HH + 4} width={8} height={5} rx={1}
          fill={block} opacity={0.9} />
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function ProteinfarmSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#7B1FA2', d);
  const left  = dc('#6A1B9A', d);
  const right = dc('#4A148C', d);
  const tank  = dc('#CE93D8', d);
  const pipe  = dc('#AB47BC', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Window on left face */}
      <Rect x={10} y={HH + H * 0.25} width={9} height={7} rx={1}
        fill={dc('#E1BEE7', d)} opacity={0.75} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Two tanks on roof */}
      <Ellipse cx={HW - 16} cy={HH - 5} rx={10} ry={6} fill={tank} opacity={0.92} />
      <Ellipse cx={HW + 16} cy={HH + 5} rx={10} ry={6} fill={tank} opacity={0.92} />
      {/* Connecting pipe */}
      <Line x1={HW - 6} y1={HH - 2} x2={HW + 6} y2={HH + 2}
        stroke={pipe} strokeWidth={2.5} strokeLinecap="round" />
      {level >= 3 && (
        <Ellipse cx={HW + 16} cy={HH + 5} rx={5} ry={3}
          fill="rgba(255,255,255,0.28)" />
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function KaserneSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#C62828', d);
  const left  = dc('#B71C1C', d);
  const right = dc('#7F0000', d);
  const flag  = dc('#FF5252', d);
  const hasBattlements = level >= 3;
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Gate arch on right face */}
      <Path
        d={`M ${HW + 14},${TH + H - 3}
            L ${HW + 14},${TH + H * 0.42}
            A 7,8 0 0 1 ${HW + 28},${TH + H * 0.42}
            L ${HW + 28},${TH + H - 3}`}
        fill={dc('#1A0000', d)} opacity={0.85}
      />
      <Polygon points={ROOF} fill={roof} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Flag left */}
      <Line x1={HW - 14} y1={HH - 1} x2={HW - 14} y2={HH - 13}
        stroke={dc('#8B0000', d)} strokeWidth={1.6} strokeLinecap="round" />
      <Polygon points={`${HW - 14},${HH - 13} ${HW - 5},${HH - 9} ${HW - 14},${HH - 5}`}
        fill={flag} />
      {/* Flag right */}
      <Line x1={HW + 16} y1={HH + 5} x2={HW + 16} y2={HH - 7}
        stroke={dc('#8B0000', d)} strokeWidth={1.6} strokeLinecap="round" />
      <Polygon points={`${HW + 16},${HH - 7} ${HW + 25},${HH - 3} ${HW + 16},${HH + 1}`}
        fill={flag} />
      {hasBattlements && (
        <G>
          <Rect x={HW - 18} y={HH - 5} width={5} height={5} rx={0.5} fill={dc('#9B1212', d)} />
          <Rect x={HW - 11} y={HH - 5} width={5} height={5} rx={0.5} fill={dc('#9B1212', d)} />
          <Rect x={HW + 13} y={HH + 1} width={5} height={5} rx={0.5} fill={dc('#9B1212', d)} />
          <Rect x={HW + 20} y={HH + 1} width={5} height={5} rx={0.5} fill={dc('#9B1212', d)} />
        </G>
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function TempelSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#F9A825', d);
  const left  = dc('#FF8F00', d);
  const right = dc('#E65100', d);
  const win   = dc('#FFD54F', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Golden windows on left face */}
      <Rect x={8} y={HH + H * 0.2} width={11} height={8} rx={1.5}
        fill={win} opacity={0.82} />
      <Rect x={8} y={HH + H * 0.55} width={11} height={8} rx={1.5}
        fill={win} opacity={0.82} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Pagoda-style curved roof via Path */}
      <Path
        d={`M ${HW},0
            Q ${TW * 0.82},${HH * 0.3} ${TW},${HH}
            Q ${TW * 0.82},${TH * 0.7}  ${HW},${TH}
            Q ${TW * 0.18},${TH * 0.7}  0,${HH}
            Q ${TW * 0.18},${HH * 0.3}  ${HW},0 Z`}
        fill={roof} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5}
      />
      {/* Central jewel on roof */}
      <Circle cx={HW} cy={HH} r={3.5} fill={win} opacity={0.95} />
      {level >= 3 && (
        <G>
          {/* Rooftop cross */}
          <Line x1={HW} y1={-5} x2={HW} y2={3}
            stroke={win} strokeWidth={1.8} strokeLinecap="round" />
          <Line x1={HW - 3} y1={-1} x2={HW + 3} y2={-1}
            stroke={win} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function BibliothekSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#1565C0', d);
  const left  = dc('#0D47A1', d);
  const right = dc('#0A2F6B', d);
  const col   = dc('#1976D2', d);
  const win   = dc('#42A5F5', d);
  const winMid = TH + H / 2;
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Pillar lines on left face */}
      <Line x1={16} y1={HH + 2} x2={10} y2={TH + H - 3}
        stroke={col} strokeWidth={1.8} opacity={0.55} />
      <Line x1={33} y1={HH + 7} x2={30} y2={TH + H - 3}
        stroke={col} strokeWidth={1.8} opacity={0.55} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Rose window on right face */}
      <Circle cx={HW + 24} cy={winMid} r={10}
        fill={right} stroke={win} strokeWidth={1.8} />
      {/* Window spokes */}
      <Line x1={HW + 24} y1={winMid - 10} x2={HW + 24} y2={winMid + 10}
        stroke={win} strokeWidth={0.9} opacity={0.8} />
      <Line x1={HW + 14} y1={winMid} x2={HW + 34} y2={winMid}
        stroke={win} strokeWidth={0.9} opacity={0.8} />
      <Line x1={HW + 17} y1={winMid - 7} x2={HW + 31} y2={winMid + 7}
        stroke={win} strokeWidth={0.7} opacity={0.65} />
      <Line x1={HW + 17} y1={winMid + 7} x2={HW + 31} y2={winMid - 7}
        stroke={win} strokeWidth={0.7} opacity={0.65} />
      <Polygon points={ROOF} fill={roof} stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Book stack on roof */}
      {level >= 2 && (
        <G>
          <Rect x={HW - 8} y={HH - 2} width={14} height={3} rx={0.5}
            fill={win} opacity={0.82} />
          <Rect x={HW - 6} y={HH - 5} width={11} height={3} rx={0.5}
            fill={dc('#64B5F6', d)} opacity={0.82} />
        </G>
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function MarktplatzSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#FF7043', d);
  const left  = dc('#E64A19', d);
  const right = dc('#BF360C', d);
  const awning = dc('#FF5722', d);
  const flagPalette = ['#F44336', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0'];
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Colourful bunting flags on left face */}
      {flagPalette.map((c, i) => {
        const fx = 8 + i * 12;
        const fy = HH + H * 0.28;
        return (
          <Polygon key={i}
            points={`${fx},${fy} ${fx + 7},${fy} ${fx + 3.5},${fy + 6}`}
            fill={dc(c, d)} opacity={0.9 as any}
          />
        );
      })}
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Market awning overhang */}
      <Polygon
        points={`${HW - 20},${TH - 5} ${HW + 20},${TH - 5} ${HW},${TH + 8}`}
        fill={awning} opacity={0.88}
      />
      {level >= 3 && (
        /* Extra sign on roof */
        <Rect x={HW - 6} y={HH - 6} width={12} height={7} rx={1}
          fill={dc('#FF8A65', d)} opacity={0.9} />
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function StammeshausSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#4E342E', d);
  const left  = dc('#3E2723', d);
  const right = dc('#2C1810', d);
  const banner = dc('#FF6F00', d);
  const torch  = dc('#FF8F00', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Timber beams on left face */}
      {[0.22, 0.48, 0.72].map((t, i) => {
        const y = HH + t * H;
        const x0 = HW * t;
        return (
          <Line key={i} x1={x0 + 2} y1={y} x2={HW - 2} y2={y + H * 0.07}
            stroke={dc('#5D4037', d)} strokeWidth={1.6} opacity={0.5} />
        );
      })}
      {/* Torch on left face */}
      <Line x1={12} y1={HH + H * 0.12} x2={12} y2={HH + H * 0.02}
        stroke={dc('#8D6E63', d)} strokeWidth={1.3} />
      <Circle cx={12} cy={HH + H * 0.02} r={3} fill={torch} opacity={0.88} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Banner pole + flag on roof */}
      <Line x1={HW + 6} y1={HH + 5} x2={HW + 6} y2={HH - 11}
        stroke={dc('#5D4037', d)} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x={HW + 6} y={HH - 11} width={19} height={13} rx={1} fill={banner} opacity={0.92} />
      {level >= 4 && (
        /* Second torch */
        <G>
          <Line x1={28} y1={HH + H * 0.12} x2={28} y2={HH + H * 0.02}
            stroke={dc('#8D6E63', d)} strokeWidth={1.3} />
          <Circle cx={28} cy={HH + H * 0.02} r={3} fill={torch} opacity={0.88} />
        </G>
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function HolzlagerSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#8D6E63', d);
  const left  = dc('#6D4C41', d);
  const right = dc('#4E342E', d);
  const log   = dc('#A1887F', d);
  const count = Math.min(2 + level, 5);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Stacked log ends on roof (overlapping ellipses) */}
      {Array.from({ length: count }, (_, i) => (
        <Ellipse key={i}
          cx={HW - 8 + i * 10} cy={HH - 2 + i * 2}
          rx={8} ry={5}
          fill={log} opacity={0.85}
        />
      ))}
      {/* Log grain circles */}
      {Array.from({ length: Math.min(count, 3) }, (_, i) => (
        <Circle key={i}
          cx={HW - 8 + i * 10} cy={HH - 2 + i * 2}
          r={3} fill="none"
          stroke={dc('#5D4037', d)} strokeWidth={0.6} opacity={0.5}
        />
      ))}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function SteinlagerSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#90A4AE', d);
  const left  = dc('#607D8B', d);
  const right = dc('#455A64', d);
  const stone = [dc('#B0BEC5', d), dc('#90A4AE', d), dc('#78909C', d)];
  const count = Math.min(2 + level, 5);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Stone blocks stacked on roof */}
      {Array.from({ length: count }, (_, i) => (
        <Rect key={i}
          x={HW - 14 + i * 9} y={HH - 4 + (i % 2) * 4}
          width={12} height={7} rx={1}
          fill={stone[i % 3]} opacity={0.88}
        />
      ))}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function NahrungslagerSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#558B2F', d);
  const left  = dc('#33691E', d);
  const right = dc('#1B5E20', d);
  const barrel = dc('#689F38', d);
  const count = Math.min(1 + level, 4);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Barrel circles on roof */}
      {Array.from({ length: count }, (_, i) => {
        const cx = HW - 16 + i * 13;
        const cy = HH - 2;
        return (
          <G key={i}>
            <Circle cx={cx} cy={cy} r={9} fill={barrel} opacity={0.85} />
            <Line x1={cx - 7} y1={cy - 3} x2={cx + 7} y2={cy - 3}
              stroke={dc('#33691E', d)} strokeWidth={0.8} opacity={0.6} />
            <Line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy}
              stroke={dc('#33691E', d)} strokeWidth={0.8} opacity={0.6} />
            <Line x1={cx - 7} y1={cy + 3} x2={cx + 7} y2={cy + 3}
              stroke={dc('#33691E', d)} strokeWidth={0.8} opacity={0.6} />
          </G>
        );
      })}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function WachturmSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  // Narrow tower: 45% of tile width, centred
  const tw = TW * 0.45;   // tower width  = 63
  const thw = tw / 2;     // tower half-w = 31.5
  const tth = TH * 0.45;  // tower half-height = 31.5 (isometric proportions)
  const thh = tth / 2;    // = 15.75
  const cx = HW;          // tower x-centre = 70

  // Narrow roof diamond (top of SVG)
  const tRoof = `${cx},0 ${cx + thw},${thh} ${cx},${tth} ${cx - thw},${thh}`;
  // Narrow ground diamond (where tower meets ground)
  const gy = H; // ground y in SVG coords
  const tGround = `${cx},${gy} ${cx + thw},${gy + thh} ${cx},${gy + tth} ${cx - thw},${gy + thh}`;
  // Tower left face:  roof-left → ground-left → ground-bottom → roof-bottom
  const tLeft = `${cx - thw},${thh} ${cx - thw},${gy + thh} ${cx},${gy + tth} ${cx},${tth}`;
  // Tower right face: roof-bottom → ground-bottom → ground-right → roof-right
  const tRight = `${cx},${tth} ${cx},${gy + tth} ${cx + thw},${gy + thh} ${cx + thw},${thh}`;

  // Full ground tile as base platform
  const platform = `${HW},${H} ${TW},${H + HH} ${HW},${H + TH} 0,${H + HH}`;

  const dark1 = dc('#424242', d);
  const dark2 = dc('#212121', d);
  const dark3 = dc('#1a1a1a', d);
  const plat  = dc('#3E3E3E', d);
  const platL = dc('#2A2A2A', d);
  const platR = dc('#1E1E1E', d);

  // Full-width ground platform faces
  const platLeft  = `0,${HH} 0,${H + HH} ${HW},${H + TH} ${HW},${TH}`;
  const platRight = `${HW},${TH} ${HW},${H + TH} ${TW},${H + HH} ${TW},${HH}`;

  return (
    <G>
      {/* Ground platform */}
      <Polygon points={platLeft}  fill={platL} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={platRight} fill={platR} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={platform}  fill={plat}  stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      {/* Narrow tower body */}
      <Polygon points={tLeft}  fill={dark2} stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
      <Polygon points={tRight} fill={dark3} stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} />
      {/* Window on right face mid-height */}
      <Rect x={cx + 4} y={H * 0.35 + thh} width={8} height={6} rx={1}
        fill={dc('#FF8F00', d)} opacity={0.7} />
      {/* Narrow roof with merlons */}
      <Polygon points={tRoof} fill={dark1} stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />
      {/* Merlons along roof edges */}
      {[-thw * 0.6, -thw * 0.15, thw * 0.3].map((off, i) => (
        <Rect key={i}
          x={cx + off - 3} y={-(i % 2 === 0 ? 5 : 2)}
          width={6} height={(i % 2 === 0 ? 5 : 2)}
          rx={0.5} fill={dark1}
        />
      ))}
      {/* Torch glow at top */}
      <Circle cx={cx} cy={-3} r={level >= 3 ? 5 : 3.5}
        fill={dc('#FF8F00', d)} opacity={0.55} />
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function MauerSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#90A4AE', d);
  const left  = dc('#78909C', d);
  const right = dc('#607D8B', d);
  const brick = dc('#546E7A', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Brick rows on left face */}
      {[0.3, 0.6].map((t, i) => {
        const y = HH + t * H;
        return (
          <Line key={i} x1={HW * t} y1={y} x2={HW - 1} y2={y + H * 0.09}
            stroke={brick} strokeWidth={0.9} opacity={0.5} />
        );
      })}
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Battlements on roof */}
      {[-20, -7, 6, 19].map((off, i) => (
        <Rect key={i}
          x={HW + off} y={(i % 2 === 0 ? -5 : -2)}
          width={8} height={(i % 2 === 0 ? 5 : 2)}
          rx={0.5} fill={dc('#607D8B', d)}
        />
      ))}
      {level >= 3 && (
        /* Arrow slit on right face */
        <Rect x={HW + 20} y={TH + H * 0.35} width={4} height={9} rx={1}
          fill={dc('#37474F', d)} opacity={0.8} />
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

function StallSprite({ H, level, d }: { H: number; level: number; d: boolean }) {
  const roof  = dc('#A1887F', d);
  const left  = dc('#8D6E63', d);
  const right = dc('#6D4C41', d);
  return (
    <G>
      <Polygon points={lf(H)} fill={left}  stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      <Polygon points={rf(H)} fill={right} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />
      {/* Stable door on right face */}
      <Rect x={HW + 12} y={TH + H * 0.4} width={16} height={H * 0.55} rx={1}
        fill={dc('#4E342E', d)} opacity={0.85} />
      {/* Door divider */}
      <Line x1={HW + 12} y1={TH + H * 0.67} x2={HW + 28} y2={TH + H * 0.67}
        stroke={dc('#3E2723', d)} strokeWidth={0.9} opacity={0.7} />
      <Polygon points={ROOF}  fill={roof}  stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Hay bale on roof */}
      {level >= 2 && (
        <Ellipse cx={HW - 10} cy={HH - 3} rx={10} ry={6}
          fill={dc('#FDD835', d)} opacity={0.82} />
      )}
      {d && <DecayOverlay H={H} />}
    </G>
  );
}

// ── Sprite content selector (shared by both public variants) ─────────────────

function getSpriteContent(type: BuildingType, level: number, H: number, d: boolean): React.ReactElement {
  switch (type) {
    case BuildingType.feld:          return <FeldSprite H={H} level={level} d={d} />;
    case BuildingType.steinbruch:    return <SteinbruchSprite H={H} level={level} d={d} />;
    case BuildingType.proteinfarm:   return <ProteinfarmSprite H={H} level={level} d={d} />;

    case BuildingType.kaserne:       return <KaserneSprite H={H} level={level} d={d} />;
    case BuildingType.tempel:        return <TempelSprite H={H} level={level} d={d} />;
    case BuildingType.bibliothek:    return <BibliothekSprite H={H} level={level} d={d} />;
    case BuildingType.marktplatz:    return <MarktplatzSprite H={H} level={level} d={d} />;
    case BuildingType.stammeshaus:   return <StammeshausSprite H={H} level={level} d={d} />;
    case BuildingType.holzlager:     return <HolzlagerSprite H={H} level={level} d={d} />;
    case BuildingType.steinlager:    return <SteinlagerSprite H={H} level={level} d={d} />;
    case BuildingType.nahrungslager: return <NahrungslagerSprite H={H} level={level} d={d} />;
    case BuildingType.wachturm:      return <WachturmSprite H={H} level={level} d={d} />;
    case BuildingType.mauer:         return <MauerSprite H={H} level={level} d={d} />;
    case BuildingType.stall:
    default:                         return <StallSprite H={H} level={level} d={d} />;
  }
}

// ── Variant A: standalone <Svg> wrapper (previews, BuildingSpriteOverlay) ────

export const IsometricBuildingSprite = React.memo(
  function IsometricBuildingSprite({ type, level, H, isDecayed = false }: IsometricBuildingSpriteProps) {
    const svgH = TH + H;
    return (
      <Svg width={TW} height={svgH} viewBox={`0 0 ${TW} ${svgH}`}>
        {getSpriteContent(type, level, H, isDecayed)}
      </Svg>
    );
  }
);

// ── Variant B: inline <G> for embedding inside the main Svg canvas ───────────
// Translates to tile position: x = gridToScreen x, y = gridToScreen y.
// The G shifts UP by H so the building base sits on the tile surface.

export interface IsometricBuildingSpriteGProps {
  type: BuildingType;
  level: number;
  H: number;
  x: number;          // SVG-canvas x from gridToScreen
  y: number;          // SVG-canvas y from gridToScreen
  isDecayed?: boolean;
}

export const IsometricBuildingSpriteG = React.memo(
  function IsometricBuildingSpriteG({ type, level, H, x, y, isDecayed = false }: IsometricBuildingSpriteGProps) {
    return (
      <G transform={`translate(${x}, ${y - H})`}>
        {getSpriteContent(type, level, H, isDecayed)}
      </G>
    );
  }
);
