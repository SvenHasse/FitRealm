// Grill.tsx — Simplified grill (PERF: 2 flames, no smoke, minimal stone texture)

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
  return progress < 0.5 ? STEAK_COLOR : GRILLED_STEAK_COLOR;
}

function GrillComponent({ grillItems, grillOutputPile, tick, grillActive }: Props) {
  const cx = GRILL.x + GRILL.width / 2;
  const cy = GRILL.y + GRILL.height / 2;

  // 2 flames only
  const flames = [0, 1].map(i => {
    const phase = (tick * 0.08 + i * 0.5) % 1;
    const baseX = cx + (i - 0.5) * 14;
    return {
      x: baseX + Math.sin(tick * 0.15 + i) * 2,
      y: cy - 5 - phase * 18,
      rx: 3 + Math.sin(tick * 0.2 + i * 2) * 1.5,
      ry: 5 + phase * 3,
      opacity: grillActive ? 0.8 * (1 - phase) : 0.3 * (1 - phase),
      color: i % 2 === 0 ? '#ff9800' : '#ffeb3b',
    };
  });

  return (
    <G>
      {/* Grill */}
      <G>
        {/* Shadow */}
        <Ellipse cx={cx} cy={GRILL.y + GRILL.height + 5} rx={30} ry={10} fill="rgba(0,0,0,0.18)" />

        {/* Oven base */}
        <Rect x={GRILL.x} y={GRILL.y} width={GRILL.width} height={GRILL.height} rx={4} fill="#616161" />

        {/* Grill grates — reduced to 3 */}
        {[0, 1, 2].map(i => (
          <Line
            key={`grate-${i}`}
            x1={GRILL.x + 5}
            y1={GRILL.y + 5 + i * 12}
            x2={GRILL.x + GRILL.width - 5}
            y2={GRILL.y + 5 + i * 12}
            stroke="#333"
            strokeWidth={1.5}
          />
        ))}

        {/* Flames (2 only) */}
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
      </G>

      {/* Grill Output — simplified (max 5 visible) */}
      <G>
        <Rect x={GRILL_OUTPUT.x - 20} y={GRILL_OUTPUT.y - 8} width={40} height={20} rx={3} fill="#a1887f" />
        {Array.from({ length: Math.min(grillOutputPile, 5) }).map((_, i) => (
          <Rect
            key={`grill-out-${i}`}
            x={GRILL_OUTPUT.x - 6}
            y={GRILL_OUTPUT.y - 8 + i * -9}
            width={12}
            height={8}
            rx={2}
            fill={GRILLED_STEAK_COLOR}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
          />
        ))}
        {grillOutputPile > 0 && (
          <SvgText
            x={GRILL_OUTPUT.x}
            y={GRILL_OUTPUT.y - 8 + Math.min(grillOutputPile, 5) * -9 - 6}
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
