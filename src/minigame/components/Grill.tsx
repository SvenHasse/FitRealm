// Grill.tsx — SVG Grill/Ofen mit Feuer-Animation, Rauch, grillende Steaks

import React from 'react';
import { G, Rect, Ellipse, Circle, Line, Text as SvgText } from 'react-native-svg';
import {
  GRILL, GRILL_OUTPUT, STEAK_COLOR, GRILLED_STEAK_COLOR, GRILLED_STEAK_STRIPE,
} from '../constants';
import { ProcessingItem } from '../types';

interface Props {
  grillItems: ProcessingItem[];
  grillOutputPile: number;
  tick: number;
  grillActive: boolean;
}

function lerpColor(progress: number): string {
  // Steak brown → grilled dark brown
  return progress < 0.5 ? STEAK_COLOR : GRILLED_STEAK_COLOR;
}

function GrillComponent({ grillItems, grillOutputPile, tick, grillActive }: Props) {
  const cx = GRILL.x + GRILL.width / 2;
  const cy = GRILL.y + GRILL.height / 2;

  // Flame particles (6 flames with staggered phases)
  const flames = [0, 1, 2, 3, 4, 5].map(i => {
    const phase = (tick * 0.08 + i * 0.17) % 1;
    const baseX = cx + (i - 2.5) * 7;
    return {
      x: baseX + Math.sin(tick * 0.15 + i) * 2,
      y: cy - 5 - phase * 18,
      rx: 3 + Math.sin(tick * 0.2 + i * 2) * 1.5,
      ry: 5 + phase * 3,
      opacity: grillActive ? 0.8 * (1 - phase) : 0.3 * (1 - phase),
      color: i % 2 === 0 ? '#ff9800' : '#ffeb3b',
    };
  });

  // Smoke particles
  const smokeParticles = grillActive ? [0, 1, 2].map(i => {
    const phase = (tick * 0.03 + i * 0.33) % 1;
    return {
      y: -phase * 30,
      opacity: 0.3 * (1 - phase),
      r: 3 + phase * 5,
    };
  }) : [];

  return (
    <G>
      {/* ── Grill ── */}
      <G>
        {/* Shadow */}
        <Ellipse cx={cx} cy={GRILL.y + GRILL.height + 5} rx={30} ry={10} fill="rgba(0,0,0,0.18)" />

        {/* Glow */}
        {grillActive && (
          <Circle cx={cx} cy={cy + 5} r={30} fill="rgba(255,152,0,0.08)" />
        )}

        {/* Wood pile (left side) */}
        <Rect x={GRILL.x - 18} y={GRILL.y + 15} width={14} height={5} rx={1} fill="#6d4c41" transform={`rotate(-8, ${GRILL.x - 11}, ${GRILL.y + 17})`} />
        <Rect x={GRILL.x - 16} y={GRILL.y + 22} width={12} height={5} rx={1} fill="#795548" transform={`rotate(5, ${GRILL.x - 10}, ${GRILL.y + 24})`} />
        <Rect x={GRILL.x - 14} y={GRILL.y + 10} width={10} height={4} rx={1} fill="#5d4037" transform={`rotate(-3, ${GRILL.x - 9}, ${GRILL.y + 12})`} />

        {/* Oven base */}
        <Rect x={GRILL.x} y={GRILL.y} width={GRILL.width} height={GRILL.height} rx={4} fill="#616161" />
        {/* Stone texture */}
        <Rect x={GRILL.x + 4} y={GRILL.y + 3} width={10} height={7} rx={1} fill="#6d6d6d" />
        <Rect x={GRILL.x + 18} y={GRILL.y + 5} width={12} height={6} rx={1} fill="#585858" />
        <Rect x={GRILL.x + 35} y={GRILL.y + 2} width={9} height={8} rx={1} fill="#6d6d6d" />
        <Rect x={GRILL.x + 6} y={GRILL.y + 14} width={14} height={6} rx={1} fill="#585858" />
        <Rect x={GRILL.x + 24} y={GRILL.y + 16} width={11} height={5} rx={1} fill="#6d6d6d" />
        <Rect x={GRILL.x + 38} y={GRILL.y + 14} width={10} height={7} rx={1} fill="#585858" />
        <Rect x={GRILL.x + 8} y={GRILL.y + 26} width={16} height={6} rx={1} fill="#6d6d6d" />
        <Rect x={GRILL.x + 30} y={GRILL.y + 28} width={12} height={5} rx={1} fill="#585858" />

        {/* Grill grates */}
        {[0, 1, 2, 3, 4].map(i => (
          <Line
            key={`grate-${i}`}
            x1={GRILL.x + 5}
            y1={GRILL.y + 5 + i * 8}
            x2={GRILL.x + GRILL.width - 5}
            y2={GRILL.y + 5 + i * 8}
            stroke="#333"
            strokeWidth={1.5}
          />
        ))}

        {/* Flames */}
        {flames.map((f, i) => (
          <Ellipse
            key={`flame-${i}`}
            cx={f.x}
            cy={f.y}
            rx={f.rx}
            ry={f.ry}
            fill={f.color}
            opacity={f.opacity}
          />
        ))}

        {/* Grilling steaks on the grates */}
        {grillItems.slice(0, 3).map((item, i) => {
          const sx = GRILL.x + 12 + i * 14;
          const sy = GRILL.y + 12;
          const col = lerpColor(item.progress);
          return (
            <G key={item.id}>
              <Rect x={sx} y={sy} width={10} height={7} rx={2} fill={col} />
              {item.progress > 0.5 && (
                <>
                  <Line x1={sx + 2} y1={sy + 2} x2={sx + 8} y2={sy + 2} stroke={GRILLED_STEAK_STRIPE} strokeWidth={1} />
                  <Line x1={sx + 2} y1={sy + 5} x2={sx + 8} y2={sy + 5} stroke={GRILLED_STEAK_STRIPE} strokeWidth={1} />
                </>
              )}
              {/* Progress ring */}
              <Circle
                cx={sx + 5}
                cy={sy + 3.5}
                r={6}
                stroke="#4caf50"
                strokeWidth={1.2}
                fill="none"
                strokeDasharray={`${item.progress * 37.7} ${37.7}`}
                opacity={0.6}
              />
            </G>
          );
        })}

        {/* Chimney */}
        <Rect x={GRILL.x + GRILL.width - 7} y={GRILL.y - 22} width={10} height={22} rx={2} fill="#546e7a" />
        {/* Smoke */}
        {smokeParticles.map((p, i) => (
          <Circle
            key={`smoke-${i}`}
            cx={GRILL.x + GRILL.width - 2}
            cy={GRILL.y - 22 + p.y}
            r={p.r}
            fill="#b0bec5"
            opacity={p.opacity}
          />
        ))}
      </G>

      {/* ── Grill Output ── */}
      <G>
        {/* Small table */}
        <Rect x={GRILL_OUTPUT.x - 20} y={GRILL_OUTPUT.y - 8} width={40} height={20} rx={3} fill="#a1887f" />
        <Ellipse cx={GRILL_OUTPUT.x} cy={GRILL_OUTPUT.y + 15} rx={22} ry={6} fill="rgba(0,0,0,0.1)" />

        {/* Stacked grilled steaks */}
        {Array.from({ length: Math.min(grillOutputPile, 10) }).map((_, i) => (
          <G key={`grill-out-${i}`}>
            <Rect
              x={GRILL_OUTPUT.x - 6}
              y={GRILL_OUTPUT.y - 8 + i * -9}
              width={12}
              height={8}
              rx={2}
              fill={GRILLED_STEAK_COLOR}
              stroke="rgba(0,0,0,0.15)"
              strokeWidth={0.5}
            />
            <Line
              x1={GRILL_OUTPUT.x - 4}
              y1={GRILL_OUTPUT.y - 5 + i * -9}
              x2={GRILL_OUTPUT.x + 4}
              y2={GRILL_OUTPUT.y - 5 + i * -9}
              stroke={GRILLED_STEAK_STRIPE}
              strokeWidth={1}
            />
          </G>
        ))}
        {grillOutputPile > 0 && (
          <SvgText
            x={GRILL_OUTPUT.x}
            y={GRILL_OUTPUT.y - 8 + Math.min(grillOutputPile, 10) * -9 - 6}
            fill="white"
            fontSize={9}
            fontWeight="bold"
            textAnchor="middle"
          >
            x{grillOutputPile}
          </SvgText>
        )}
      </G>
    </G>
  );
}

export default React.memo(GrillComponent);
