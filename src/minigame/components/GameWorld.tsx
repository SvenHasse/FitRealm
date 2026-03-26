// GameWorld.tsx — SVG-basierte Spielwelt mit Kamera-System

import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Rect, Ellipse, Line, G, Circle, Text as SvgText } from 'react-native-svg';
import { GameState } from '../types';
import {
  WORLD_WIDTH, WORLD_HEIGHT, SNOW_COLOR_LIGHT, SNOW_COLOR_DARK,
  SAND_COLOR, SAND_COLOR_DARK, FENCE_WOOD, FENCE_TIP_RED,
  GATE_WOOD_DARK, GATE_GOLD,
  BEAR_PEN, BEAR_PEN_GATE,
  CONVEYOR_TABLE, SHREDDER, STEAK_OUTPUT,
  GRILL, GRILL_OUTPUT, SALES_COUNTER, MONEY_PILE, CUSTOMER_ROW_Y,
} from '../constants';
import Player from './Player';
import Snowflakes from './Snowflakes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Aspect-ratio-aware view dimensions in world units
const HEADER_HEIGHT = 50; // approximate header height in screen pixels
const USABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;
const VIEW_ASPECT = SCREEN_WIDTH / USABLE_HEIGHT;
const VIEW_WIDTH_UNITS = 500; // how many world units we see horizontally
const VIEW_HEIGHT_UNITS = VIEW_WIDTH_UNITS / VIEW_ASPECT;

interface Props {
  state: GameState;
}

// ─── Fence drawing helpers ───────────────────────────────────────────────────

function FenceH({ x, y, width }: { x: number; y: number; width: number }) {
  const posts: React.ReactNode[] = [];
  const spacing = 25;
  const count = Math.floor(width / spacing);
  for (let i = 0; i <= count; i++) {
    const px = x + i * spacing;
    posts.push(
      <G key={`fh-${x}-${y}-${i}`}>
        <Rect x={px - 3} y={y - 18} width={6} height={20} rx={1} fill={FENCE_WOOD} />
        <Circle cx={px} cy={y - 18} r={3} fill={FENCE_TIP_RED} />
      </G>
    );
  }
  // Horizontal rails
  return (
    <G>
      <Rect x={x} y={y - 12} width={width} height={3} rx={1} fill={FENCE_WOOD} opacity={0.7} />
      <Rect x={x} y={y - 6} width={width} height={3} rx={1} fill={FENCE_WOOD} opacity={0.7} />
      {posts}
    </G>
  );
}

function FenceV({ x, y, height }: { x: number; y: number; height: number }) {
  const posts: React.ReactNode[] = [];
  const spacing = 25;
  const count = Math.floor(height / spacing);
  for (let i = 0; i <= count; i++) {
    const py = y + i * spacing;
    posts.push(
      <G key={`fv-${x}-${y}-${i}`}>
        <Rect x={x - 3} y={py - 18} width={6} height={20} rx={1} fill={FENCE_WOOD} />
        <Circle cx={x} cy={py - 18} r={3} fill={FENCE_TIP_RED} />
      </G>
    );
  }
  return <G>{posts}</G>;
}

// ─── Gate ────────────────────────────────────────────────────────────────────

function Gate({ x, y, width }: { x: number; y: number; width: number }) {
  const halfW = width / 2;
  return (
    <G>
      {/* Gate posts */}
      <Rect x={x - 8} y={y - 30} width={12} height={35} rx={2} fill={GATE_WOOD_DARK} />
      <Circle cx={x - 2} cy={y - 30} r={6} fill={GATE_GOLD} />
      <Rect x={x + width - 4} y={y - 30} width={12} height={35} rx={2} fill={GATE_WOOD_DARK} />
      <Circle cx={x + width + 2} cy={y - 30} r={6} fill={GATE_GOLD} />
      {/* Gate X-pattern (left door) */}
      <Rect x={x + 4} y={y - 25} width={halfW - 8} height={25} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
      <Line x1={x + 4} y1={y - 25} x2={x + halfW - 4} y2={y} stroke={GATE_GOLD} strokeWidth={1.5} />
      <Line x1={x + halfW - 4} y1={y - 25} x2={x + 4} y2={y} stroke={GATE_GOLD} strokeWidth={1.5} />
      {/* Gate X-pattern (right door) */}
      <Rect x={x + halfW + 4} y={y - 25} width={halfW - 8} height={25} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
      <Line x1={x + halfW + 4} y1={y - 25} x2={x + width - 4} y2={y} stroke={GATE_GOLD} strokeWidth={1.5} />
      <Line x1={x + width - 4} y1={y - 25} x2={x + halfW + 4} y2={y} stroke={GATE_GOLD} strokeWidth={1.5} />
    </G>
  );
}

// ─── Station placeholders ────────────────────────────────────────────────────

function StationPlaceholder({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  return (
    <G>
      <Rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={5} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
      <SvgText x={x} y={y + 3} fill="white" fontSize={8} fontWeight="bold" textAnchor="middle">{label}</SvgText>
    </G>
  );
}

// ─── Snow hills ──────────────────────────────────────────────────────────────

const snowHills = [
  { cx: 150, cy: 50, rx: 120, ry: 35 },
  { cx: 750, cy: 30, rx: 100, ry: 25 },
  { cx: 450, cy: 10, rx: 80, ry: 20 },
  { cx: 900, cy: 200, rx: 90, ry: 28 },
  { cx: 50, cy: 300, rx: 70, ry: 22 },
  { cx: 850, cy: 400, rx: 60, ry: 18 },
  { cx: 200, cy: 1200, rx: 110, ry: 30 },
  { cx: 700, cy: 1400, rx: 95, ry: 26 },
  { cx: 500, cy: 1500, rx: 130, ry: 35 },
];

// ─── Main component ──────────────────────────────────────────────────────────

export default function GameWorld({ state }: Props) {
  const { playerPosition, backpack, isAttacking, tickCount } = state;
  const isMoving = state.playerSpeed > 0 && (
    // We detect "moving" if position changed — simplified: if joystick is active
    // This is passed from the tick logic; for now approximate
    true // will be refined when movement vector is available
  );

  // Camera calculation
  const camX = playerPosition.x - VIEW_WIDTH_UNITS / 2;
  const camY = playerPosition.y - VIEW_HEIGHT_UNITS / 2;

  // Clamp camera to world bounds
  const clampedCamX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH_UNITS, camX));
  const clampedCamY = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT_UNITS, camY));

  const viewBox = `${clampedCamX} ${clampedCamY} ${VIEW_WIDTH_UNITS} ${VIEW_HEIGHT_UNITS}`;

  // Work area bounds
  const workX = 50;
  const workY = 420;
  const workW = 900;
  const workH = 660;

  return (
    <Svg width="100%" height="100%" viewBox={viewBox}>
      {/* 1. Snow background */}
      <Rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill={SNOW_COLOR_LIGHT} />

      {/* 2. Snow hills */}
      {snowHills.map((h, i) => (
        <Ellipse key={`hill-${i}`} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill={SNOW_COLOR_DARK} opacity={0.5} />
      ))}

      {/* 3. Work area floor */}
      <Rect x={workX} y={workY} width={workW} height={workH} rx={8} fill={SAND_COLOR} />
      <Rect x={workX + 4} y={workY + 4} width={workW - 8} height={workH - 8} rx={6} fill={SAND_COLOR_DARK} opacity={0.3} />

      {/* 4. Fence around work area */}
      <FenceH x={workX} y={workY} width={workW} />
      <FenceH x={workX} y={workY + workH} width={workW} />
      <FenceV x={workX} y={workY} height={workH} />
      <FenceV x={workX + workW} y={workY} height={workH} />

      {/* 5. Bear pen */}
      <G>
        {/* Pen floor (snow) */}
        <Rect
          x={BEAR_PEN.x}
          y={BEAR_PEN.y}
          width={BEAR_PEN.width}
          height={BEAR_PEN.height}
          rx={6}
          fill={SNOW_COLOR_DARK}
          opacity={0.6}
        />
        {/* Pen fences */}
        <FenceH x={BEAR_PEN.x} y={BEAR_PEN.y} width={BEAR_PEN.width} />
        <FenceH x={BEAR_PEN.x} y={BEAR_PEN.y + BEAR_PEN.height} width={BEAR_PEN_GATE.x - BEAR_PEN.x} />
        <FenceH x={BEAR_PEN_GATE.x + BEAR_PEN_GATE.width} y={BEAR_PEN.y + BEAR_PEN.height} width={(BEAR_PEN.x + BEAR_PEN.width) - (BEAR_PEN_GATE.x + BEAR_PEN_GATE.width)} />
        <FenceV x={BEAR_PEN.x} y={BEAR_PEN.y} height={BEAR_PEN.height} />
        <FenceV x={BEAR_PEN.x + BEAR_PEN.width} y={BEAR_PEN.y} height={BEAR_PEN.height} />
        {/* Gate */}
        <Gate x={BEAR_PEN_GATE.x} y={BEAR_PEN.y + BEAR_PEN.height} width={BEAR_PEN_GATE.width} />
      </G>

      {/* 6. Station placeholders (will be replaced with full SVGs in Phase 2+) */}
      <StationPlaceholder x={CONVEYOR_TABLE.x} y={CONVEYOR_TABLE.y} w={60} h={30} label="Ablage" color="#a1887f" />
      <StationPlaceholder x={SHREDDER.x + SHREDDER.width / 2} y={SHREDDER.y + SHREDDER.height / 2} w={SHREDDER.width} h={SHREDDER.height} label="Schredder" color="#78909c" />
      <StationPlaceholder x={STEAK_OUTPUT.x} y={STEAK_OUTPUT.y} w={40} h={25} label="Steaks" color="#8d6e63" />
      <StationPlaceholder x={GRILL.x + GRILL.width / 2} y={GRILL.y + GRILL.height / 2} w={GRILL.width} h={GRILL.height} label="Grill" color="#d84315" />
      <StationPlaceholder x={GRILL_OUTPUT.x} y={GRILL_OUTPUT.y} w={40} h={25} label="Fertig" color="#5d4037" />
      <StationPlaceholder x={SALES_COUNTER.x + SALES_COUNTER.width / 2} y={SALES_COUNTER.y} w={SALES_COUNTER.width} h={30} label="Verkaufstheke" color="#6d4c41" />
      <StationPlaceholder x={MONEY_PILE.x} y={MONEY_PILE.y} w={35} h={25} label="$" color="#388e3c" />

      {/* 7. Customer row placeholder */}
      <G>
        {[0, 1, 2, 3, 4, 5].map(i => (
          <G key={`cust-${i}`}>
            <Circle cx={300 + i * 55} cy={CUSTOMER_ROW_Y + 20} r={10} fill="#42a5f5" />
            <Circle cx={300 + i * 55} cy={CUSTOMER_ROW_Y + 8} r={6} fill="#ffcc80" />
          </G>
        ))}
      </G>

      {/* 8. Player */}
      <Player
        x={playerPosition.x}
        y={playerPosition.y}
        backpackItems={backpack}
        isAttacking={isAttacking}
        isMoving={isMoving}
      />

      {/* 9. Snowflakes (top layer) */}
      <Snowflakes
        tick={tickCount}
        cameraX={clampedCamX}
        cameraY={clampedCamY}
        viewWidth={VIEW_WIDTH_UNITS}
        viewHeight={VIEW_HEIGHT_UNITS}
      />
    </Svg>
  );
}
