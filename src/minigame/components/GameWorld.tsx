// GameWorld.tsx — SVG-basierte Spielwelt mit Kamera-System (PERF OPTIMIZED)

import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import Svg, { Rect, Ellipse, G, Circle, Text as SvgText, Path } from 'react-native-svg';
import { GameState, ItemType, Position } from '../types';
import {
  WORLD_WIDTH, WORLD_HEIGHT, SNOW_COLOR_LIGHT,
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

// ─── Fence helpers (batched paths — no individual elements) ─────────────────

function FencePostsPathH(x: number, y: number, width: number): string {
  let d = '';
  const spacing = 25;
  const count = Math.floor(width / spacing);
  for (let i = 0; i <= count; i++) {
    const px = x + i * spacing;
    d += `M${px - 3},${y - 18} h6 v20 h-6 Z `;
  }
  return d;
}

function FenceTipsPathH(x: number, y: number, width: number): string {
  let d = '';
  const spacing = 25;
  const count = Math.floor(width / spacing);
  for (let i = 0; i <= count; i++) {
    const px = x + i * spacing;
    // Approximate circle as small square for perf
    d += `M${px - 3},${y - 21} h6 v6 h-6 Z `;
  }
  return d;
}

function FenceH({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <G>
      <Rect x={x} y={y - 12} width={width} height={3} rx={1} fill={FENCE_WOOD} opacity={0.7} />
      <Rect x={x} y={y - 6} width={width} height={3} rx={1} fill={FENCE_WOOD} opacity={0.7} />
      <Path d={FencePostsPathH(x, y, width)} fill={FENCE_WOOD} />
      <Path d={FenceTipsPathH(x, y, width)} fill={FENCE_TIP_RED} />
    </G>
  );
}

function FencePostsPathV(x: number, y: number, height: number): string {
  let d = '';
  const spacing = 25;
  const count = Math.floor(height / spacing);
  for (let i = 0; i <= count; i++) {
    const py = y + i * spacing;
    d += `M${x - 3},${py - 18} h6 v20 h-6 Z `;
  }
  return d;
}

function FenceTipsPathV(x: number, y: number, height: number): string {
  let d = '';
  const spacing = 25;
  const count = Math.floor(height / spacing);
  for (let i = 0; i <= count; i++) {
    const py = y + i * spacing;
    d += `M${x - 3},${py - 21} h6 v6 h-6 Z `;
  }
  return d;
}

function FenceV({ x, y, height }: { x: number; y: number; height: number }) {
  return (
    <G>
      <Path d={FencePostsPathV(x, y, height)} fill={FENCE_WOOD} />
      <Path d={FenceTipsPathV(x, y, height)} fill={FENCE_TIP_RED} />
    </G>
  );
}

function Gate({ x, y, width }: { x: number; y: number; width: number }) {
  const halfW = width / 2;
  return (
    <G>
      <Rect x={x - 5} y={y - 14} width={10} height={26} fill={GATE_WOOD_DARK} rx={1} />
      <Circle cx={x} cy={y - 14} r={6} fill={GATE_GOLD} />
      <Rect x={x + width - 5} y={y - 14} width={10} height={26} fill={GATE_WOOD_DARK} rx={1} />
      <Circle cx={x + width} cy={y - 14} r={6} fill={GATE_GOLD} />
      <Rect x={x + 8} y={y - 10} width={halfW - 16} height={20} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
      <Rect x={x + halfW + 8} y={y - 10} width={halfW - 16} height={20} rx={1} fill={GATE_WOOD_DARK} opacity={0.7} />
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

// ─── Distance helper ─────────────────────────────────────────────────────────

function distPos(a: Position, b: Position): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

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

  // FIX 2: Limit dropped items to 8 visible
  const visibleDrops = droppedItems.slice(0, 8);

  // FIX 9: Only render the 2 closest upgrade fields
  const visibleUpgrades = useMemo(() => {
    return state.upgrades
      .filter(u => u.currentLevel < u.maxLevel)
      .sort((a, b) => distPos(state.playerPosition, a.position) - distPos(state.playerPosition, b.position))
      .slice(0, 2);
  }, [state.upgrades, Math.round(state.playerPosition.x / 50), Math.round(state.playerPosition.y / 50)]);

  return (
    <Svg width="100%" height="100%" viewBox={viewBox}>
      {/* Background — no snow hills (FIX 3) */}
      <Rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill={SNOW_COLOR_LIGHT} />

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

      {/* Conveyor system */}
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

      {/* Upgrade fields — only nearest 2 (FIX 9) */}
      {visibleUpgrades.map(upg => (
        <UpgradeField key={upg.id} upgrade={upg} tick={tickCount} />
      ))}

      {/* Dropped items — max 8 visible, no pickup arrows (FIX 2) */}
      {visibleDrops.map(item => (
        <G key={item.id}>
          <Ellipse cx={item.position.x} cy={item.position.y + 5} rx={4} ry={2} fill="rgba(0,0,0,0.15)" />
          <Circle
            cx={item.position.x}
            cy={item.position.y}
            r={6}
            fill={itemColor(item.type)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1}
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
