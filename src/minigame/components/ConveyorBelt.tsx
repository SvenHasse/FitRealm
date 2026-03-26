// ConveyorBelt.tsx — Ablage-Tisch, Förderband mit animierten Streifen, Schredder-Maschine

import React from 'react';
import { G, Rect, Ellipse, Circle, Line, Polygon, Text as SvgText, Path } from 'react-native-svg';
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

export default function ConveyorBeltComponent({
  conveyorItems, shredderProcessing, steakOutputPile, tick, machineActive,
}: Props) {
  const halfW = CONVEYOR_BELT.width / 2;

  // Machine vibration offset
  const vibeX = machineActive ? Math.sin(tick * 1.2) * 1 : 0;
  const vibeY = machineActive ? Math.cos(tick * 1.5) * 0.5 : 0;

  // Steam particles (3 particles cycling)
  const steamParticles = machineActive ? [0, 1, 2].map(i => {
    const phase = (tick * 0.04 + i * 0.33) % 1;
    return {
      y: -phase * 25,
      opacity: 0.35 * (1 - phase),
      r: 3 + phase * 4,
    };
  }) : [];

  // Belt stripe positions (animated)
  const stripeCount = 7;
  const stripeSpacing = beltLen / stripeCount;

  return (
    <G>
      {/* ── Ablage-Tisch ── */}
      <G>
        <Ellipse cx={CONVEYOR_TABLE.x} cy={CONVEYOR_TABLE.y + 20} rx={35} ry={8} fill="rgba(0,0,0,0.12)" />
        {/* Legs */}
        <Rect x={CONVEYOR_TABLE.x - 27} y={CONVEYOR_TABLE.y + 12} width={4} height={8} fill="#8d6e63" />
        <Rect x={CONVEYOR_TABLE.x + 23} y={CONVEYOR_TABLE.y + 12} width={4} height={8} fill="#8d6e63" />
        <Rect x={CONVEYOR_TABLE.x - 27} y={CONVEYOR_TABLE.y - 2} width={4} height={8} fill="#8d6e63" />
        <Rect x={CONVEYOR_TABLE.x + 23} y={CONVEYOR_TABLE.y - 2} width={4} height={8} fill="#8d6e63" />
        {/* Table top */}
        <Rect x={CONVEYOR_TABLE.x - 30} y={CONVEYOR_TABLE.y - 15} width={60} height={30} rx={3} fill="#c4a06a" />
        <Rect x={CONVEYOR_TABLE.x - 28} y={CONVEYOR_TABLE.y - 13} width={56} height={26} rx={2} fill="#d4b07a" opacity={0.5} />
        {/* Meat icon */}
        <Circle cx={CONVEYOR_TABLE.x} cy={CONVEYOR_TABLE.y - 3} r={7} fill={RAW_MEAT_COLOR} opacity={0.6} />
        <Path
          d={`M${CONVEYOR_TABLE.x},${CONVEYOR_TABLE.y + 2} L${CONVEYOR_TABLE.x - 3},${CONVEYOR_TABLE.y - 2} L${CONVEYOR_TABLE.x + 3},${CONVEYOR_TABLE.y - 2} Z`}
          fill="white"
          opacity={0.7}
          rotation={180}
          origin={`${CONVEYOR_TABLE.x}, ${CONVEYOR_TABLE.y}`}
        />
      </G>

      {/* ── Förderband ── */}
      <G>
        {/* Belt body */}
        <G transform={`translate(${beltMidX}, ${beltMidY}) rotate(${beltAngle})`}>
          {/* Side walls */}
          <Rect x={-beltLen / 2} y={-halfW - 3} width={beltLen} height={3} rx={1} fill="#78909c" />
          <Rect x={-beltLen / 2} y={halfW} width={beltLen} height={3} rx={1} fill="#78909c" />
          {/* Belt surface */}
          <Rect x={-beltLen / 2} y={-halfW} width={beltLen} height={CONVEYOR_BELT.width} fill="#546e7a" />
          {/* Animated stripes */}
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
        {/* Rollers at endpoints */}
        <Circle cx={CONVEYOR_BELT.startX} cy={CONVEYOR_BELT.startY} r={6} fill="#78909c" stroke="#546e7a" strokeWidth={1.5} />
        <Circle cx={CONVEYOR_BELT.endX} cy={CONVEYOR_BELT.endY} r={6} fill="#78909c" stroke="#546e7a" strokeWidth={1.5} />
      </G>

      {/* Items on conveyor */}
      {conveyorItems.map(item => {
        const px = lerp(CONVEYOR_BELT.startX, CONVEYOR_BELT.endX, item.progress);
        const py = lerp(CONVEYOR_BELT.startY, CONVEYOR_BELT.endY, item.progress);
        return (
          <G key={item.id}>
            <Ellipse cx={px} cy={py + 4} rx={4} ry={1.5} fill="rgba(0,0,0,0.12)" />
            <Circle cx={px} cy={py} r={5} fill={RAW_MEAT_COLOR} />
          </G>
        );
      })}

      {/* ── Schredder-Maschine ── */}
      <G transform={`translate(${vibeX}, ${vibeY})`}>
        {/* Shadow */}
        <Ellipse
          cx={SHREDDER.x + SHREDDER.width / 2}
          cy={SHREDDER.y + SHREDDER.height + 5}
          rx={SHREDDER.width * 0.6}
          ry={10}
          fill="rgba(0,0,0,0.12)"
        />
        {/* Main body */}
        <Rect
          x={SHREDDER.x}
          y={SHREDDER.y}
          width={SHREDDER.width}
          height={SHREDDER.height}
          rx={5}
          fill="#455a64"
        />
        {/* Side groove */}
        <Rect x={SHREDDER.x + 4} y={SHREDDER.y + 8} width={4} height={40} fill="#37474f" rx={1} />
        {/* Trichter */}
        <Polygon
          points={`${SHREDDER.x + 10},${SHREDDER.y} ${SHREDDER.x + SHREDDER.width - 10},${SHREDDER.y} ${SHREDDER.x + SHREDDER.width - 15},${SHREDDER.y - 12} ${SHREDDER.x + 15},${SHREDDER.y - 12}`}
          fill="#607d8b"
        />
        {/* Warning stripes (yellow on dark) */}
        <Rect x={SHREDDER.x + 12} y={SHREDDER.y + 15} width={SHREDDER.width - 24} height={20} rx={2} fill="#333" />
        <Line
          x1={SHREDDER.x + 14}
          y1={SHREDDER.y + 17}
          x2={SHREDDER.x + 28}
          y2={SHREDDER.y + 33}
          stroke="#F5A623"
          strokeWidth={3}
        />
        <Line
          x1={SHREDDER.x + 26}
          y1={SHREDDER.y + 17}
          x2={SHREDDER.x + 40}
          y2={SHREDDER.y + 33}
          stroke="#F5A623"
          strokeWidth={3}
        />
        <Line
          x1={SHREDDER.x + 38}
          y1={SHREDDER.y + 17}
          x2={SHREDDER.x + 52}
          y2={SHREDDER.y + 33}
          stroke="#F5A623"
          strokeWidth={3}
        />
        {/* Screws */}
        <Circle cx={SHREDDER.x + 6} cy={SHREDDER.y + 6} r={2} fill="#333" />
        <Circle cx={SHREDDER.x + SHREDDER.width - 6} cy={SHREDDER.y + 6} r={2} fill="#333" />
        <Circle cx={SHREDDER.x + 6} cy={SHREDDER.y + SHREDDER.height - 6} r={2} fill="#333" />
        <Circle cx={SHREDDER.x + SHREDDER.width - 6} cy={SHREDDER.y + SHREDDER.height - 6} r={2} fill="#333" />
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
        {/* Steam */}
        {steamParticles.map((p, i) => (
          <Circle
            key={`steam-${i}`}
            cx={SHREDDER.x + SHREDDER.width / 2}
            cy={SHREDDER.y - 22 + p.y}
            r={p.r}
            fill="#b0bec5"
            opacity={p.opacity}
          />
        ))}
        {/* Processing indicator */}
        {shredderProcessing.length > 0 && (
          <G>
            {/* Progress bar inside machine */}
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

      {/* ── Steak-Output-Stapel ── */}
      <G>
        <Ellipse cx={STEAK_OUTPUT.x} cy={STEAK_OUTPUT.y + 12} rx={20} ry={6} fill="rgba(0,0,0,0.1)" />
        {Array.from({ length: Math.min(steakOutputPile, 10) }).map((_, i) => (
          <G key={`steak-out-${i}`}>
            <Rect
              x={STEAK_OUTPUT.x - 6}
              y={STEAK_OUTPUT.y - 5 + i * -9}
              width={12}
              height={8}
              rx={2}
              fill={STEAK_COLOR}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth={0.5}
            />
            {/* Bone */}
            <Circle cx={STEAK_OUTPUT.x + 7} cy={STEAK_OUTPUT.y - 1 + i * -9} r={2} fill="white" />
          </G>
        ))}
        {steakOutputPile > 0 && (
          <SvgText
            x={STEAK_OUTPUT.x}
            y={STEAK_OUTPUT.y - 5 + Math.min(steakOutputPile, 10) * -9 - 6}
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
