// SalesCounter.tsx — Verkaufstheke, Kunden, Geld-Haufen

import React from 'react';
import { G, Rect, Ellipse, Circle, Line, Text as SvgText } from 'react-native-svg';
import {
  SALES_COUNTER, MONEY_PILE, CUSTOMER_ROW_Y,
  GRILLED_STEAK_COLOR, GRILLED_STEAK_STRIPE,
  MONEY_GOLD, PLAYER_SKIN,
} from '../constants';
import { Customer } from '../types';

interface Props {
  counterSteaks: number;
  moneyPileAmount: number;
  customers: Customer[];
  tick: number;
}

const CUSTOMER_COLORS = ['#1565c0', '#c62828', '#2e7d32', '#f9a825', '#6a1b9a', '#e65100'];
const SPEECH_LINES = ['Lecker!', 'Yummy!', 'Mehr!', 'Mmh!', 'Wow!', 'Top!'];

function SalesCounterComponent({ counterSteaks, moneyPileAmount, customers, tick }: Props) {
  const counterX = SALES_COUNTER.x;
  const counterY = SALES_COUNTER.y;
  const counterW = SALES_COUNTER.width;
  const halfW = counterW / 2;

  // Money pile visual count (max 15 coins)
  const coinCount = Math.min(Math.ceil(moneyPileAmount / 10), 15);
  // Deterministic "random" positions for coins
  const coinOffsets = Array.from({ length: 15 }, (_, i) => ({
    x: Math.sin(i * 2.7) * 8,
    y: Math.cos(i * 3.1) * 4 - i * 1.5,
  }));

  return (
    <G>
      {/* ── Verkaufstheke ── */}
      <G>
        {/* Counter shadow */}
        <Ellipse cx={counterX + halfW} cy={counterY + 20} rx={halfW + 10} ry={8} fill="rgba(0,0,0,0.1)" />

        {/* Counter front (perspective) */}
        <Rect x={counterX} y={counterY + 13} width={counterW} height={15} rx={2} fill="#a0784a" />
        {/* Wood grain */}
        <Line x1={counterX + 5} y1={counterY + 18} x2={counterX + counterW - 5} y2={counterY + 18} stroke="#8d6b3e" strokeWidth={0.5} opacity={0.6} />
        <Line x1={counterX + 5} y1={counterY + 22} x2={counterX + counterW - 5} y2={counterY + 22} stroke="#947045" strokeWidth={0.5} opacity={0.5} />
        <Line x1={counterX + 5} y1={counterY + 25} x2={counterX + counterW - 5} y2={counterY + 25} stroke="#8d6b3e" strokeWidth={0.5} opacity={0.4} />

        {/* Counter top */}
        <Rect x={counterX} y={counterY - 12} width={counterW} height={25} rx={3} fill="#d4a06a" />
        <Rect x={counterX + 3} y={counterY - 10} width={counterW - 6} height={21} rx={2} fill="#ddb07a" opacity={0.4} />

        {/* Steaks on counter */}
        {Array.from({ length: Math.min(counterSteaks, 10) }).map((_, i) => (
          <G key={`counter-steak-${i}`}>
            <Rect
              x={counterX + 15 + i * 28}
              y={counterY - 8}
              width={10}
              height={7}
              rx={2}
              fill={GRILLED_STEAK_COLOR}
            />
            <Line
              x1={counterX + 17 + i * 28}
              y1={counterY - 5}
              x2={counterX + 23 + i * 28}
              y2={counterY - 5}
              stroke={GRILLED_STEAK_STRIPE}
              strokeWidth={0.8}
            />
          </G>
        ))}
      </G>

      {/* ── Kunden ── */}
      <G>
        {customers.map((cust, i) => {
          const cx = counterX + 25 + i * 50;
          const cy = CUSTOMER_ROW_Y + 20;
          const bob = Math.sin(tick * 0.05 + i * 1.2) * 1;
          const isHappy = cust.happyTimer > 0;
          const happyBob = isHappy ? Math.sin(tick * 0.3) * 3 : 0;
          const speechIdx = (i + Math.floor(tick / 40)) % SPEECH_LINES.length;

          return (
            <G key={cust.id}>
              {/* Shadow */}
              <Ellipse cx={cx} cy={cy + 12} rx={7} ry={3} fill="rgba(0,0,0,0.12)" />

              {/* Body */}
              <Circle cx={cx} cy={cy + bob + happyBob} r={10} fill={cust.color} />

              {/* Head */}
              <Circle cx={cx} cy={cy - 7 + bob + happyBob} r={5.5} fill={PLAYER_SKIN} />

              {/* Eyes */}
              <Circle cx={cx - 2} cy={cy - 8 + bob + happyBob} r={1.2} fill="#333" />
              <Circle cx={cx + 2} cy={cy - 8 + bob + happyBob} r={1.2} fill="#333" />

              {/* Hat */}
              <Ellipse cx={cx} cy={cy - 11 + bob + happyBob} rx={6} ry={2.5} fill={cust.color} />

              {/* Happy effects */}
              {isHappy && (
                <G>
                  {/* Heart */}
                  <SvgText
                    x={cx + 8}
                    y={cy - 18 + bob}
                    fontSize={10}
                    opacity={cust.happyTimer > 10 ? 1 : cust.happyTimer / 10}
                  >
                    ❤️
                  </SvgText>
                  {/* Speech bubble */}
                  {cust.happyTimer > 10 && (
                    <G>
                      <Rect x={cx - 18} y={cy - 32 + bob} width={36} height={14} rx={6} fill="white" />
                      <SvgText
                        x={cx}
                        y={cy - 22 + bob}
                        fill="#333"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {SPEECH_LINES[speechIdx]}
                      </SvgText>
                    </G>
                  )}
                </G>
              )}
            </G>
          );
        })}
      </G>

      {/* ── Geld-Haufen ── */}
      {moneyPileAmount > 0 && (
        <G>
          {/* Base glow */}
          <Ellipse
            cx={MONEY_PILE.x}
            cy={MONEY_PILE.y + 5}
            rx={15 + coinCount * 0.8}
            ry={8 + coinCount * 0.4}
            fill={MONEY_GOLD}
            opacity={0.3}
          />

          {/* Coins */}
          {Array.from({ length: coinCount }).map((_, i) => {
            const off = coinOffsets[i];
            return (
              <Circle
                key={`coin-${i}`}
                cx={MONEY_PILE.x + off.x}
                cy={MONEY_PILE.y + off.y}
                r={4}
                fill={MONEY_GOLD}
                stroke="#c88a00"
                strokeWidth={0.8}
              />
            );
          })}

          {/* Sparkle */}
          {[0, 1, 2].map(i => {
            const sparklePhase = (tick * 0.06 + i * 0.33) % 1;
            const sparkleOpacity = sparklePhase < 0.3 ? sparklePhase / 0.3 : (sparklePhase < 0.5 ? 1 : Math.max(0, 1 - (sparklePhase - 0.5) * 4));
            return (
              <Circle
                key={`sparkle-${i}`}
                cx={MONEY_PILE.x + Math.sin(i * 3.7) * 12}
                cy={MONEY_PILE.y + Math.cos(i * 2.3) * 8 - 5}
                r={1.5}
                fill="white"
                opacity={sparkleOpacity * 0.7}
              />
            );
          })}

          {/* Amount label */}
          <SvgText
            x={MONEY_PILE.x}
            y={MONEY_PILE.y - coinCount * 1.5 - 10}
            fill="white"
            fontSize={10}
            fontWeight="bold"
            textAnchor="middle"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.5}
          >
            ${moneyPileAmount}
          </SvgText>
        </G>
      )}
    </G>
  );
}

export default React.memo(SalesCounterComponent);
