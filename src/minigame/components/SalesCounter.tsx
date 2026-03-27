// SalesCounter.tsx — Simplified sales counter + customers (PERF: 3 elements per customer)

import React from 'react';
import { G, Rect, Ellipse, Circle, Text as SvgText } from 'react-native-svg';
import {
  SALES_COUNTER, MONEY_PILE, CUSTOMER_ROW_Y,
  GRILLED_STEAK_COLOR,
  MONEY_GOLD,
} from '../constants';
import { Customer } from '../types';

interface Props {
  counterSteaks: number;
  moneyPileAmount: number;
  customers: Customer[];
  tick: number;
}

function SalesCounterComponent({ counterSteaks, moneyPileAmount, customers, tick }: Props) {
  const counterX = SALES_COUNTER.x;
  const counterY = SALES_COUNTER.y;
  const counterW = SALES_COUNTER.width;
  const halfW = counterW / 2;

  // Money pile visual count (max 8 coins)
  const coinCount = Math.min(Math.ceil(moneyPileAmount / 10), 8);
  const coinOffsets = Array.from({ length: 8 }, (_, i) => ({
    x: Math.sin(i * 2.7) * 8,
    y: Math.cos(i * 3.1) * 4 - i * 1.5,
  }));

  return (
    <G>
      {/* Counter — simplified */}
      <G>
        <Rect x={counterX} y={counterY + 13} width={counterW} height={15} rx={2} fill="#a0784a" />
        <Rect x={counterX} y={counterY - 12} width={counterW} height={25} rx={3} fill="#d4a06a" />

        {/* Steaks on counter (max 5 visible) */}
        {Array.from({ length: Math.min(counterSteaks, 5) }).map((_, i) => (
          <Rect
            key={`counter-steak-${i}`}
            x={counterX + 15 + i * 28}
            y={counterY - 8}
            width={10}
            height={7}
            rx={2}
            fill={GRILLED_STEAK_COLOR}
          />
        ))}
      </G>

      {/* Customers — 3 elements each: body, head, hat */}
      <G>
        {customers.map((cust, i) => {
          const cx = counterX + 25 + i * 50;
          const cy = CUSTOMER_ROW_Y + 20;

          return (
            <G key={cust.id}>
              {/* Body */}
              <Circle cx={cx} cy={cy} r={10} fill={cust.color} />
              {/* Head */}
              <Circle cx={cx} cy={cy - 7} r={5.5} fill="#ffdbb4" />
              {/* Hat */}
              <Ellipse cx={cx} cy={cy - 11} rx={6} ry={2.5} fill={cust.color} />
            </G>
          );
        })}
      </G>

      {/* Money pile — simplified */}
      {moneyPileAmount > 0 && (
        <G>
          {/* Coins (max 8) */}
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
