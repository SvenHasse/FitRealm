// Player.tsx — SVG-Spieler-Charakter mit Rucksack-Stapel und Animationen

import React from 'react';
import { G, Circle, Ellipse, Rect, Path, Text as SvgText, Line } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withSequence, withTiming,
  withSpring, useDerivedValue, Easing,
} from 'react-native-reanimated';
import { BackpackItem, ItemType } from '../types';
import {
  PLAYER_JACKET, PLAYER_JACKET_LIGHT, PLAYER_SKIN, PLAYER_HAT,
  PLAYER_SELECTION_RING, RAW_MEAT_COLOR, STEAK_COLOR, GRILLED_STEAK_COLOR,
  GRILLED_STEAK_STRIPE, MONEY_COLOR,
  BACKPACK_ITEM_WIDTH, BACKPACK_ITEM_HEIGHT, BACKPACK_STACK_OFFSET_Y,
} from '../constants';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  x: number;
  y: number;
  backpackItems: BackpackItem[];
  isAttacking: boolean;
  isMoving: boolean;
}

function itemColor(type: ItemType): string {
  switch (type) {
    case ItemType.RAW_MEAT: return RAW_MEAT_COLOR;
    case ItemType.STEAK: return STEAK_COLOR;
    case ItemType.GRILLED_STEAK: return GRILLED_STEAK_COLOR;
    case ItemType.MONEY: return MONEY_COLOR;
  }
}

function PlayerInner({ x, y, backpackItems, isAttacking, isMoving }: Props) {
  // Selection ring pulse
  const ringPulse = useSharedValue(21);
  React.useEffect(() => {
    ringPulse.value = withRepeat(
      withSequence(
        withTiming(23, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(21, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const ringProps = useAnimatedProps(() => ({
    r: ringPulse.value,
  }));

  // Walk bob — heavier load = more bounce, slower
  const walkBob = useSharedValue(0);
  const heavyLoad = backpackItems.length > 3;
  React.useEffect(() => {
    if (isMoving) {
      const amp = heavyLoad ? 3 : 2;
      const dur = heavyLoad ? 175 : 125;
      walkBob.value = withRepeat(
        withSequence(
          withTiming(-amp, { duration: dur }),
          withTiming(amp, { duration: dur }),
        ),
        -1,
        false,
      );
    } else {
      walkBob.value = withSpring(0, { damping: 12 });
    }
  }, [isMoving, heavyLoad]);

  const bodyProps = useAnimatedProps(() => ({
    transform: [{ translateY: walkBob.value }],
  }));

  // Backpack tilt (simplified — slight rotation when moving)
  const backpackTilt = useSharedValue(0);
  React.useEffect(() => {
    if (isMoving) {
      backpackTilt.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 200 }),
          withTiming(3, { duration: 200 }),
        ),
        -1,
        true,
      );
    } else {
      backpackTilt.value = withSpring(0, { damping: 10 });
    }
  }, [isMoving]);

  // Axe attack animation
  const axeRotation = useSharedValue(0);
  React.useEffect(() => {
    if (isAttacking) {
      axeRotation.value = withSequence(
        withTiming(-45, { duration: 100 }),
        withTiming(0, { duration: 200 }),
      );
    }
  }, [isAttacking]);

  const count = backpackItems.length;

  // Adaptive sizing for large backpacks
  const isLargeStack = count > 10;
  const itemW = isLargeStack ? 8 : BACKPACK_ITEM_WIDTH;
  const itemH = isLargeStack ? 6 : BACKPACK_ITEM_HEIGHT;
  const stackOffset = isLargeStack ? -5 : BACKPACK_STACK_OFFSET_Y;

  // Pseudo-random offsets for stack (deterministic per index)
  const offsets = [0, 1, -1, 0.5, -0.5, 1.5, -1.5, 0, 1, -1, 0.5, -0.5, 1, -1, 0.5];

  return (
    <G x={x} y={y}>
      {/* Shadow */}
      <Ellipse cx={0} cy={10} rx={16} ry={6} fill="rgba(0,0,0,0.2)" />

      {/* Selection ring */}
      <AnimatedCircle
        cx={0}
        cy={0}
        animatedProps={ringProps}
        stroke={PLAYER_SELECTION_RING}
        strokeWidth={2.5}
        fill="none"
      />

      {/* Body group with walk bob */}
      <AnimatedG animatedProps={bodyProps}>
        {/* Body */}
        <Circle cx={0} cy={0} r={14} fill={PLAYER_JACKET} />
        {/* Shoulders */}
        <Circle cx={0} cy={-3} r={11} fill={PLAYER_JACKET_LIGHT} />
        {/* Face */}
        <Circle cx={0} cy={-5} r={7} fill={PLAYER_SKIN} />
        {/* Eyes */}
        <Circle cx={-2.5} cy={-6} r={1.5} fill="#333" />
        <Circle cx={2.5} cy={-6} r={1.5} fill="#333" />
        {/* Hat brim */}
        <Ellipse cx={0} cy={-10} rx={8} ry={3.5} fill={PLAYER_HAT} />
        {/* Hat top */}
        <Rect x={-5} y={-14} width={10} height={5} rx={2} fill={PLAYER_HAT} />

        {/* Axe */}
        <G x={12} y={-8}>
          {/* Stiel */}
          <Rect x={0} y={0} width={3} height={14} rx={1} fill="#8d6e63" />
          {/* Kopf */}
          <Path d="M1,-2 L8,-6 L8,2 Z" fill="#90a4ae" />
        </G>

        {/* Backpack stack */}
        {count > 0 && (
          <G>
            {backpackItems.map((item, i) => {
              const bx = offsets[i % offsets.length];
              const by = -20 + i * stackOffset;
              const w = itemW;
              const h = itemH;
              return (
                <G key={item.id}>
                  <Rect
                    x={-w / 2 + bx}
                    y={by - h}
                    width={w}
                    height={h}
                    rx={2}
                    fill={itemColor(item.type)}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth={0.5}
                  />
                  {/* Grilled steak stripes */}
                  {item.type === ItemType.GRILLED_STEAK && (
                    <>
                      <Line
                        x1={-w / 2 + bx + 2}
                        y1={by - h + 3}
                        x2={w / 2 + bx - 2}
                        y2={by - h + 3}
                        stroke={GRILLED_STEAK_STRIPE}
                        strokeWidth={1}
                      />
                      <Line
                        x1={-w / 2 + bx + 2}
                        y1={by - h + 6}
                        x2={w / 2 + bx - 2}
                        y2={by - h + 6}
                        stroke={GRILLED_STEAK_STRIPE}
                        strokeWidth={1}
                      />
                    </>
                  )}
                  {/* Money "$" */}
                  {item.type === ItemType.MONEY && (
                    <SvgText
                      x={bx}
                      y={by - h / 2 + 1}
                      fill="#fff"
                      fontSize={isLargeStack ? 4 : 6}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="central"
                    >
                      $
                    </SvgText>
                  )}
                </G>
              );
            })}
            {/* Count label — always above the topmost block */}
            <SvgText
              x={0}
              y={-20 + count * stackOffset - itemH - 4}
              fill="white"
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              x{count}
            </SvgText>
          </G>
        )}
      </AnimatedG>
    </G>
  );
}

const Player = React.memo(PlayerInner, (prev, next) => {
  return (
    Math.round(prev.x) === Math.round(next.x) &&
    Math.round(prev.y) === Math.round(next.y) &&
    prev.backpackItems.length === next.backpackItems.length &&
    prev.isAttacking === next.isAttacking &&
    prev.isMoving === next.isMoving
  );
});

export default Player;
