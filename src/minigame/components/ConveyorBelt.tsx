// ConveyorBelt.tsx — Simplified conveyor + shredder (PERF: reduced SVG elements)

import React from 'react';
import { G, Rect, Ellipse, Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import {
  CONVEYOR_TABLE, CONVEYOR_BELT, SHREDDER, STEAK_OUTPUT,
  RAW_MEAT_COLOR, STEAK_COLOR,
} from '../constants';
import { ConveyorItem, ProcessingItem } from '../types';

interface Props {
  conveyorItems: ConveyorItem[];
  shredderProcessing: ProcessingItem[];
  steakOutputPile: number;
  tick: number;
  machineActive: boolean;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Belt geometry
const beltDx = CONVEYOR_BELT.endX - CONVEYOR_BELT.startX;
const beltDy = CONVEYOR_BELT.endY - CONVEYOR_BELT.startY;
const beltLen = Math.sqrt(beltDx * beltDx + beltDy * beltDy);
const beltAngle = Math.atan2(beltDy, beltDx) * (180 / Math.PI);
const beltMidX = (CONVEYOR_BELT.startX + CONVEYOR_BELT.endX) / 2;
const beltMidY = (CONVEYOR_BELT.startY + CONVEYOR_BELT.endY) / 2;

function ConveyorBeltComponent({
  conveyorItems, shredderProcessing, steakOutputPile, tick, machineActive,
}: Props) {
  const halfW = CONVEYOR_BELT.width / 2;

  // Machine vibration offset
  const vibeX = machineActive ? Math.sin(tick * 1.2) * 1 : 0;
  const vibeY = machineActive ? Math.cos(tick * 1.5) * 0.5 : 0;

  // Belt stripes reduced to 3
  const stripeCount = 3;
  const stripeSpacing = beltLen / stripeCount;

  return (
    <G>
      {/* Table — simplified */}
      <G>
        <Rect x={CONVEYOR_TABLE.x - 30} y={CONVEYOR_TABLE.y - 15} width={60} height={30} rx={3} fill="#c4a06a" />
        <Circle cx={CONVEYOR_TABLE.x} cy={CONVEYOR_TABLE.y - 3} r={7} fill={RAW_MEAT_COLOR} opacity={0.6} />
      </G>

      {/* Belt — simplified */}
      <G>
        <G transform={`translate(${beltMidX}, ${beltMidY}) rotate(${beltAngle})`}>
          <Rect x={-beltLen / 2} y={-halfW - 3} width={beltLen} height={3} rx={1} fill="#78909c" />
          <Rect x={-beltLen / 2} y={halfW} width={beltLen} height={3} rx={1} fill="#78909c" />
          <Rect x={-beltLen / 2} y={-halfW} width={beltLen} height={CONVEYOR_BELT.width} fill="#546e7a" />
          {/* 3 animated stripes */}
          {Array.from({ length: stripeCount }).map((_, i) => {
            const offset = ((tick * 1.5 + i * stripeSpacing) % beltLen) - beltLen / 2;
            return (
              <Line
                key={`stripe-${i}`}
                x1={offset}
                y1={-halfW + 2}
                x2={offset}
                y2={halfW - 2}
                stroke="#90a4ae"
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })}
        </G>
        <Circle cx={CONVEYOR_BELT.startX} cy={CONVEYOR_BELT.startY} r={6} fill="#78909c" stroke="#546e7a" strokeWidth={1.5} />
        <Circle cx={CONVEYOR_BELT.endX} cy={CONVEYOR_BELT.endY} r={6} fill="#78909c" stroke="#546e7a" strokeWidth={1.5} />
      </G>

      {/* Items on conveyor */}
      {conveyorItems.map(item => {
        const px = lerp(CONVEYOR_BELT.startX, CONVEYOR_BELT.endX, item.progress);
        const py = lerp(CONVEYOR_BELT.startY, CONVEYOR_BELT.endY, item.progress);
        return (
          <Circle key={item.id} cx={px} cy={py} r={5} fill={RAW_MEAT_COLOR} />
        );
      })}

      {/* Shredder — simplified (no screws, no warning stripes detail) */}
      <G transform={`translate(${vibeX}, ${vibeY})`}>
        {/* Main body */}
        <Rect
          x={SHREDDER.x}
          y={SHREDDER.y}
          width={SHREDDER.width}
          height={SHREDDER.height}
          rx={5}
          fill="#455a64"
        />
        {/* Funnel */}
        <Polygon
          points={`${SHREDDER.x + 10},${SHREDDER.y} ${SHREDDER.x + SHREDDER.width - 10},${SHREDDER.y} ${SHREDDER.x + SHREDDER.width - 15},${SHREDDER.y - 12} ${SHREDDER.x + 15},${SHREDDER.y - 12}`}
          fill="#607d8b"
        />
        {/* Warning area */}
        <Rect x={SHREDDER.x + 12} y={SHREDDER.y + 15} width={SHREDDER.width - 24} height={20} rx={2} fill="#F5A623" opacity={0.5} />
        {/* Outlet */}
        <Rect
          x={SHREDDER.x + SHREDDER.width - 8}
          y={SHREDDER.y + SHREDDER.height - 18}
          width={15}
          height={12}
          rx={2}
          fill="#37474f"
        />
        {/* Chimney */}
        <Rect
          x={SHREDDER.x + SHREDDER.width / 2 - 5}
          y={SHREDDER.y - 22}
          width={10}
          height={12}
          rx={2}
          fill="#546e7a"
        />
        {/* Processing indicator */}
        {shredderProcessing.length > 0 && (
          <G>
            <Rect x={SHREDDER.x + 12} y={SHREDDER.y + 40} width={SHREDDER.width - 24} height={4} rx={2} fill="#333" />
            <Rect
              x={SHREDDER.x + 12}
              y={SHREDDER.y + 40}
              width={(SHREDDER.width - 24) * (shredderProcessing[0]?.progress ?? 0)}
              height={4}
              rx={2}
              fill="#4caf50"
            />
          </G>
        )}
      </G>

      {/* Steak output — simplified (max 5 visible, no bone circles) */}
      <G>
        <Ellipse cx={STEAK_OUTPUT.x} cy={STEAK_OUTPUT.y + 12} rx={20} ry={6} fill="rgba(0,0,0,0.1)" />
        {Array.from({ length: Math.min(steakOutputPile, 5) }).map((_, i) => (
          <Rect
            key={`steak-out-${i}`}
            x={STEAK_OUTPUT.x - 6}
            y={STEAK_OUTPUT.y - 5 + i * -9}
            width={12}
            height={8}
            rx={2}
            fill={STEAK_COLOR}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
        ))}
        {steakOutputPile > 0 && (
          <SvgText
            x={STEAK_OUTPUT.x}
            y={STEAK_OUTPUT.y - 5 + Math.min(steakOutputPile, 5) * -9 - 6}
            fill="white"
            fontSize={9}
            fontWeight="bold"
            textAnchor="middle"
          >
            x{steakOutputPile}
          </SvgText>
        )}
      </G>
    </G>
  );
}

export default React.memo(ConveyorBeltComponent);
