// UpgradeField.tsx — SVG component for a single upgrade field

import React from 'react';
import { G, Rect, Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { UpgradeDefinition } from '../types';

interface Props {
  upgrade: UpgradeDefinition;
  tick: number;
}

// ─── Icon renderers ──────────────────────────────────────────────────────────

function AxeIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      {/* Handle */}
      <Rect x={cx - 1.5} y={cy - 8} width={3} height={16} rx={1} fill="#8d5524" />
      {/* Head */}
      <Path
        d={`M${cx - 6},${cy - 6} L${cx + 2},${cy - 10} L${cx + 2},${cy - 2} Z`}
        fill="#9e9e9e"
        stroke="#757575"
        strokeWidth={0.5}
      />
    </G>
  );
}

function BackpackIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      {/* Body */}
      <Rect x={cx - 5} y={cy - 6} width={10} height={12} rx={2} fill="#8d5524" stroke="#6d3a0a" strokeWidth={0.5} />
      {/* Straps */}
      <Line x1={cx - 3} y1={cy - 6} x2={cx - 3} y2={cy - 10} stroke="#6d3a0a" strokeWidth={1.5} />
      <Line x1={cx + 3} y1={cy - 6} x2={cx + 3} y2={cy - 10} stroke="#6d3a0a" strokeWidth={1.5} />
      {/* Flap */}
      <Rect x={cx - 4} y={cy - 6} width={8} height={3} rx={1} fill="#a0784a" />
    </G>
  );
}

function ShoeIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Path
      d={`M${cx - 6},${cy + 2} L${cx - 4},${cy - 6} L${cx + 2},${cy - 6} L${cx + 4},${cy - 3} L${cx + 7},${cy - 2} L${cx + 7},${cy + 2} Z`}
      fill="#5d4037"
      stroke="#3e2723"
      strokeWidth={0.5}
    />
  );
}

function GearIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={5} fill="#757575" stroke="#616161" strokeWidth={0.5} />
      <Circle cx={cx} cy={cy} r={2} fill="#9e9e9e" />
      {/* Teeth */}
      <Rect x={cx - 1.5} y={cy - 8} width={3} height={4} rx={0.5} fill="#757575" />
      <Rect x={cx - 1.5} y={cy + 4} width={3} height={4} rx={0.5} fill="#757575" />
      <Rect x={cx - 8} y={cy - 1.5} width={4} height={3} rx={0.5} fill="#757575" />
      <Rect x={cx + 4} y={cy - 1.5} width={4} height={3} rx={0.5} fill="#757575" />
    </G>
  );
}

function FlameIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Path
      d={`M${cx},${cy - 8} Q${cx + 5},${cy - 3} ${cx + 4},${cy + 3} Q${cx + 2},${cy + 6} ${cx},${cy + 5} Q${cx - 2},${cy + 6} ${cx - 4},${cy + 3} Q${cx - 5},${cy - 3} ${cx},${cy - 8} Z`}
      fill="#ff9800"
      stroke="#e65100"
      strokeWidth={0.5}
    />
  );
}

function PeopleIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      {/* Person 1 */}
      <Circle cx={cx - 4} cy={cy - 4} r={3} fill="#1565c0" />
      <Rect x={cx - 6.5} y={cy} width={5} height={6} rx={1.5} fill="#1565c0" />
      {/* Person 2 */}
      <Circle cx={cx + 4} cy={cy - 4} r={3} fill="#c62828" />
      <Rect x={cx + 1.5} y={cy} width={5} height={6} rx={1.5} fill="#c62828" />
    </G>
  );
}

function ConveyorIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <G>
      <Circle cx={cx - 5} cy={cy} r={3} fill="#757575" stroke="#616161" strokeWidth={0.5} />
      <Circle cx={cx + 5} cy={cy} r={3} fill="#757575" stroke="#616161" strokeWidth={0.5} />
      <Line x1={cx - 5} y1={cy - 3} x2={cx + 5} y2={cy - 3} stroke="#616161" strokeWidth={1.5} />
      <Line x1={cx - 5} y1={cy + 3} x2={cx + 5} y2={cy + 3} stroke="#616161" strokeWidth={1.5} />
    </G>
  );
}

function UpgradeIcon({ icon, cx, cy }: { icon: string; cx: number; cy: number }) {
  switch (icon) {
    case 'axe': return <AxeIcon cx={cx} cy={cy} />;
    case 'backpack': return <BackpackIcon cx={cx} cy={cy} />;
    case 'shoe': return <ShoeIcon cx={cx} cy={cy} />;
    case 'gear': return <GearIcon cx={cx} cy={cy} />;
    case 'flame': return <FlameIcon cx={cx} cy={cy} />;
    case 'people': return <PeopleIcon cx={cx} cy={cy} />;
    case 'conveyor': return <ConveyorIcon cx={cx} cy={cy} />;
    default: return null;
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UpgradeField({ upgrade, tick }: Props) {
  if (upgrade.currentLevel >= upgrade.maxLevel) return null;

  const { position, costs, currentLevel, paidAmount, icon, name } = upgrade;
  const cost = costs[currentLevel];
  const remaining = cost - paidAmount;
  const progress = paidAmount / cost;

  const fieldW = 50;
  const fieldH = 40;
  const x = position.x - fieldW / 2;
  const y = position.y - fieldH / 2;

  // Pulsating glow
  const glowOpacity = 0.3 + 0.25 * Math.sin(tick * 0.08);

  return (
    <G>
      {/* Glow ring */}
      <Rect
        x={x - 3} y={y - 3}
        width={fieldW + 6} height={fieldH + 6}
        rx={8} fill="none"
        stroke="rgba(76,175,80,0.8)"
        strokeWidth={2}
        opacity={glowOpacity}
      />

      {/* Background */}
      <Rect
        x={x} y={y}
        width={fieldW} height={fieldH}
        rx={6}
        fill="rgba(76,175,80,0.55)"
        stroke="#ffffff"
        strokeWidth={1}
      />

      {/* Icon */}
      <UpgradeIcon icon={icon} cx={position.x} cy={position.y - 5} />

      {/* Price text */}
      <SvgText
        x={position.x}
        y={position.y + 12}
        fill="#ffffff"
        fontSize={7}
        fontWeight="bold"
        textAnchor="middle"
      >
        ${remaining}
      </SvgText>

      {/* Level indicator */}
      {currentLevel > 0 && (
        <SvgText
          x={x + fieldW - 4}
          y={y + 8}
          fill="#ffd700"
          fontSize={6}
          fontWeight="bold"
          textAnchor="end"
        >
          Lv.{currentLevel}
        </SvgText>
      )}

      {/* Progress bar background */}
      <Rect
        x={x + 4} y={y + fieldH - 6}
        width={fieldW - 8} height={3}
        rx={1.5}
        fill="rgba(0,0,0,0.3)"
      />
      {/* Progress bar fill */}
      {progress > 0 && (
        <Rect
          x={x + 4} y={y + fieldH - 6}
          width={(fieldW - 8) * Math.min(progress, 1)}
          height={3}
          rx={1.5}
          fill="#ffd700"
        />
      )}
    </G>
  );
}
