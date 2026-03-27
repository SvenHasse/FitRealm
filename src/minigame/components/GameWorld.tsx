// GameWorld.tsx — SVG-basierte Spielwelt mit Kamera-System

import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Rect, Ellipse, Line, G, Circle, Text as SvgText, Path } from 'react-native-svg';
import { GameState, ItemType } from '../types';
import {
  WORLD_WIDTH, WORLD_HEIGHT, SNOW_COLOR_LIGHT, SNOW_COLOR_DARK,
  SAND_COLOR, SAND_COLOR_DARK, FENCE_WOOD, FENCE_TIP_RED,
  GATE_WOOD_DARK, GATE_GOLD, RAW_MEAT_COLOR, STEAK_COLOR,
  GRILLED_STEAK_COLOR, MONEY_COLOR,
  BEAR_PEN, BEAR_PEN_GATE,
  CONVEYOR_TABLE, SHREDDER, STEAK_OUTPUT,
  GRILL, GRILL_OUTPUT, SALES_COUNTER, MONEY_PILE, CUSTOMER_ROW_Y,
} from '../constants';
import Player from './Player';
import PolarBearSVG from './PolarBear';
import ConveyorBeltComponent from './ConveyorBelt';
import GrillComponent from './Grill';
import SalesCounterComponent from './SalesCounter';
import FloatingTextLayer from './FloatingText';
import Snowflakes from './Snowflakes';
import UpgradeField from './UpgradeField';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HEADER_HEIGHT = 50;
const USABLE_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT;
const VIEW_ASPECT = SCREEN_WIDTH / USABLE_HEIGHT;
const VIEW_WIDTH_UNITS = 500;
const VIEW_HEIGHT_UNITS = VIEW_WIDTH_UNITS / VIEW_ASPECT;

interface Props {
  state: GameState;
}

// ─── Fence helpers ───────────────────────────────────────────────────────────

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

function Gate({ x, y, width }: { x: number; y: number; width: number }) {
  const halfW = width / 2;
  return (
    <G>
      <Rect x={x - 5} y={y - 14} width={10} height={26} fill={GATE_WOOD_DARK} rx={1} />
      <Circle cx={x} cy={y - 14} r={6} fill={GATE_GOLD} />
      <Rect x={x + width - 5} y={y - 14} width={10} height={26} fill={GATE_WOOD_DARK} rx={1} />
      <Circle cx={x + width} cy={y - 14} r={6} fill={GATE_GOLD} />
      {/* Left door X */}
      <Rect x={x + 8} y={y - 10} width={halfW - 16} height={20} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
      <Line x1={x + 8} y1={y - 10} x2={x + halfW - 8} y2={y + 10} stroke="#a0784a" strokeWidth={2.5} />
      <Line x1={x + halfW - 8} y1={y - 10} x2={x + 8} y2={y + 10} stroke="#a0784a" strokeWidth={2.5} />
      {/* Right door X */}
      <Rect x={x + halfW + 8} y={y - 10} width={halfW - 16} height={20} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
      <Line x1={x + halfW + 8} y1={y - 10} x2={x + width - 8} y2={y + 10} stroke="#a0784a" strokeWidth={2.5} />
      <Line x1={x + width - 8} y1={y - 10} x2={x + halfW + 8} y2={y + 10} stroke="#a0784a" strokeWidth={2.5} />
    </G>
  );
}

function StationPlaceholder({ x, y, w, h, label, color }: { x: number; y: number; w: number; h: number; label: string; color: string }) {
  return (
    <G>
      <Rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={5} fill={color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
      <SvgText x={x} y={y + 3} fill="white" fontSize={8} fontWeight="bold" textAnchor="middle">{label}</SvgText>
    </G>
  );
}

// ─── Dropped item color ──────────────────────────────────────────────────────

function itemColor(type: ItemType): string {
  switch (type) {
    case ItemType.RAW_MEAT: return RAW_MEAT_COLOR;
    case ItemType.STEAK: return STEAK_COLOR;
    case ItemType.GRILLED_STEAK: return GRILLED_STEAK_COLOR;
    case ItemType.MONEY: return MONEY_COLOR;
  }
}

// ─── Snow hills ──────────────────────────────────────────────────────────────

const snowHills = [
  { cx: 100, cy: 30, rx: 80, ry: 25 },
  { cx: 500, cy: 20, rx: 70, ry: 20 },
  { cx: 350, cy: 10, rx: 60, ry: 15 },
  { cx: 650, cy: 150, rx: 60, ry: 20 },
  { cx: 30, cy: 250, rx: 50, ry: 18 },
  { cx: 600, cy: 300, rx: 45, ry: 14 },
  { cx: 150, cy: 800, rx: 80, ry: 22 },
  { cx: 500, cy: 900, rx: 70, ry: 20 },
  { cx: 350, cy: 950, rx: 90, ry: 25 },
];

// ─── Main component ──────────────────────────────────────────────────────────

function GameWorldInner({ state }: Props) {
  const { playerPosition, backpack, isAttacking, isMoving, tickCount, attackTarget,
          bears, droppedItems, floatingTexts,
          conveyorItems, shredderProcessing, steakOutputPile,
          grillItems, grillOutputPile, counterSteaks, moneyPileAmount, customers } = state;

  // Camera
  const camX = playerPosition.x - VIEW_WIDTH_UNITS / 2;
  const camY = playerPosition.y - VIEW_HEIGHT_UNITS / 2;
  const clampedCamX = Math.max(0, Math.min(WORLD_WIDTH - VIEW_WIDTH_UNITS, camX));
  const clampedCamY = Math.max(0, Math.min(WORLD_HEIGHT - VIEW_HEIGHT_UNITS, camY));
  const viewBox = `${clampedCamX} ${clampedCamY} ${VIEW_WIDTH_UNITS} ${VIEW_HEIGHT_UNITS}`;

  const workX = 50, workY = 280, workW = 600, workH = 450;

  // Sort bears + player by Y for depth
  const sortedBears = [...bears].filter(b => b.alive || b.respawnTimer > 50).sort((a, b) => a.position.y - b.position.y);

  // Pulse scale for dropped items (simple sin-based, per tick)
  const pulseFactor = 0.95 + 0.1 * Math.sin(tickCount * 0.06);

  return (
    <Svg width="100%" height="100%" viewBox={viewBox}>
      {/* Background */}
      <Rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill={SNOW_COLOR_LIGHT} />
      {snowHills.map((h, i) => (
        <Ellipse key={`hill-${i}`} cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} fill={SNOW_COLOR_DARK} opacity={0.5} />
      ))}

      {/* Work area */}
      <Rect x={workX} y={workY} width={workW} height={workH} rx={8} fill={SAND_COLOR} />
      <Rect x={workX + 4} y={workY + 4} width={workW - 8} height={workH - 8} rx={6} fill={SAND_COLOR_DARK} opacity={0.3} />
      <FenceH x={workX} y={workY} width={workW} />
      <FenceH x={workX} y={workY + workH} width={workW} />
      <FenceV x={workX} y={workY} height={workH} />
      <FenceV x={workX + workW} y={workY} height={workH} />

      {/* Bear pen */}
      <G>
        <Rect x={BEAR_PEN.x} y={BEAR_PEN.y} width={BEAR_PEN.width} height={BEAR_PEN.height} rx={6} fill="#f0f5f8" />
        <FenceH x={BEAR_PEN.x} y={BEAR_PEN.y} width={BEAR_PEN.width} />
        <FenceH x={BEAR_PEN.x} y={BEAR_PEN.y + BEAR_PEN.height} width={BEAR_PEN_GATE.x - BEAR_PEN.x} />
        <FenceH x={BEAR_PEN_GATE.x + BEAR_PEN_GATE.width} y={BEAR_PEN.y + BEAR_PEN.height} width={(BEAR_PEN.x + BEAR_PEN.width) - (BEAR_PEN_GATE.x + BEAR_PEN_GATE.width)} />
        <FenceV x={BEAR_PEN.x} y={BEAR_PEN.y} height={BEAR_PEN.height} />
        <FenceV x={BEAR_PEN.x + BEAR_PEN.width} y={BEAR_PEN.y} height={BEAR_PEN.height} />
        <Gate x={BEAR_PEN_GATE.x} y={BEAR_PEN.y + BEAR_PEN.height} width={BEAR_PEN_GATE.width} />
      </G>

      {/* Conveyor system (table + belt + shredder + steak output) */}
      <ConveyorBeltComponent
        conveyorItems={conveyorItems}
        shredderProcessing={shredderProcessing}
        steakOutputPile={steakOutputPile}
        tick={tickCount}
        machineActive={shredderProcessing.length > 0}
      />
      {/* Grill system */}
      <GrillComponent
        grillItems={grillItems}
        grillOutputPile={grillOutputPile}
        tick={tickCount}
        grillActive={grillItems.length > 0}
      />

      {/* Sales counter, customers, money pile */}
      <SalesCounterComponent
        counterSteaks={counterSteaks}
        moneyPileAmount={moneyPileAmount}
        customers={customers}
        tick={tickCount}
      />

      {/* Upgrade fields */}
      {state.upgrades.filter(u => u.currentLevel < u.maxLevel).map(upg => (
        <UpgradeField key={upg.id} upgrade={upg} tick={tickCount} />
      ))}

      {/* Dropped items */}
      {droppedItems.map(item => (
        <G key={item.id}>
          <Ellipse cx={item.position.x} cy={item.position.y + 5} rx={4} ry={2} fill="rgba(0,0,0,0.15)" />
          <Circle
            cx={item.position.x}
            cy={item.position.y}
            r={6 * pulseFactor}
            fill={itemColor(item.type)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
          />
          {/* Pickup arrow indicator */}
          <Path
            d={`M${item.position.x},${item.position.y - 14} L${item.position.x - 3},${item.position.y - 10} L${item.position.x + 3},${item.position.y - 10} Z`}
            fill="rgba(255,255,255,0.6)"
          />
        </G>
      ))}

      {/* Bears (depth-sorted) */}
      {sortedBears.map(bear => (
        <PolarBearSVG
          key={bear.id}
          bear={bear}
          isBeingAttacked={attackTarget === bear.id && isAttacking}
          showHpBadge={attackTarget === bear.id || bear.hp < bear.maxHp}
        />
      ))}

      {/* Player */}
      <Player
        x={playerPosition.x}
        y={playerPosition.y}
        backpackItems={backpack}
        isAttacking={isAttacking}
        isMoving={isMoving}
      />

      {/* Floating texts */}
      <FloatingTextLayer texts={floatingTexts} />

      {/* Snowflakes */}
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

const GameWorld = React.memo(GameWorldInner);
export default GameWorld;
