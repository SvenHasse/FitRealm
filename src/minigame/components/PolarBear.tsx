// PolarBear.tsx — SVG-Eisbär mit HP-Badge, Treffer-Effekt, Tod-Animation

import React, { useEffect, useRef } from 'react';
import { G, Ellipse, Circle, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withSequence,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { PolarBear as PolarBearType } from '../types';
import { BEAR_BODY, BEAR_SHADING, BEAR_INNER_EAR } from '../constants';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface Props {
  bear: PolarBearType;
  isBeingAttacked: boolean;
  showHpBadge: boolean;
}

export default function PolarBearSVG({ bear, isBeingAttacked, showHpBadge }: Props) {
  const { position, size, hp, maxHp, alive } = bear;

  // Walk bob
  const walkBob = useSharedValue(0);
  const isWalking = alive && bear.idlePauseTimer <= 0 && bear.walkTimer > 0;
  useEffect(() => {
    if (isWalking) {
      walkBob.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 125 }),
          withTiming(2, { duration: 125 }),
        ),
        -1, false,
      );
    } else {
      walkBob.value = withTiming(0, { duration: 100 });
    }
  }, [isWalking]);

  const bodyGroupProps = useAnimatedProps(() => ({
    transform: [{ translateY: walkBob.value }],
  }));

  // Hit flash
  const hitOpacity = useSharedValue(0);
  const prevAttacked = useRef(false);
  useEffect(() => {
    if (isBeingAttacked && !prevAttacked.current) {
      hitOpacity.value = withSequence(
        withTiming(0.3, { duration: 50 }),
        withTiming(0, { duration: 100 }),
      );
    }
    prevAttacked.current = isBeingAttacked;
  }, [isBeingAttacked]);

  const hitProps = useAnimatedProps(() => ({
    opacity: hitOpacity.value,
  }));

  // Death animation
  const deathOpacity = useSharedValue(1);
  const deathRotation = useSharedValue(0);
  const wasAlive = useRef(alive);
  useEffect(() => {
    if (!alive && wasAlive.current) {
      deathRotation.value = withTiming(90, { duration: 300 });
      deathOpacity.value = withDelay(200, withTiming(0, { duration: 500 }));
    }
    if (alive && !wasAlive.current) {
      // Respawn
      deathOpacity.value = withTiming(1, { duration: 600 });
      deathRotation.value = withTiming(0, { duration: 100 });
    }
    wasAlive.current = alive;
  }, [alive]);

  const outerProps = useAnimatedProps(() => ({
    opacity: deathOpacity.value,
  }));

  if (!alive && deathOpacity.value === 0) return null;

  const hpPercent = hp / maxHp;
  const hpBarWidth = 36;

  // Paw offsets
  const pawRx = size * 0.18;
  const pawRy = size * 0.12;

  return (
    <AnimatedG x={position.x} y={position.y} animatedProps={outerProps}>
      <AnimatedG animatedProps={bodyGroupProps}>
        {/* Shadow */}
        <Ellipse cx={0} cy={size * 0.7} rx={size * 0.7} ry={size * 0.3} fill="rgba(0,0,0,0.15)" />

        {/* Body */}
        <Ellipse cx={0} cy={0} rx={size * 0.85} ry={size} fill={BEAR_BODY} />

        {/* Belly shading */}
        <Ellipse cx={size * 0.15} cy={size * 0.2} rx={size * 0.5} ry={size * 0.6} fill={BEAR_SHADING} />

        {/* Ears */}
        <Circle cx={-size * 0.5} cy={-size * 0.75} r={size * 0.25} fill={BEAR_BODY} />
        <Circle cx={-size * 0.5} cy={-size * 0.75} r={size * 0.15} fill={BEAR_INNER_EAR} />
        <Circle cx={size * 0.5} cy={-size * 0.75} r={size * 0.25} fill={BEAR_BODY} />
        <Circle cx={size * 0.5} cy={-size * 0.75} r={size * 0.15} fill={BEAR_INNER_EAR} />

        {/* Eyes */}
        <Circle cx={-size * 0.2} cy={-size * 0.3} r={2} fill="#333" />
        <Circle cx={size * 0.2} cy={-size * 0.3} r={2} fill="#333" />

        {/* Nose */}
        <Ellipse cx={0} cy={-size * 0.1} rx={3.5} ry={2.5} fill="#333" />

        {/* Paws */}
        <Ellipse cx={-size * 0.4} cy={size * 0.7} rx={pawRx} ry={pawRy} fill="#e8e4dc" />
        <Ellipse cx={size * 0.4} cy={size * 0.7} rx={pawRx} ry={pawRy} fill="#e8e4dc" />
        <Ellipse cx={-size * 0.55} cy={-size * 0.1} rx={pawRx} ry={pawRy} fill="#e8e4dc" />
        <Ellipse cx={size * 0.55} cy={-size * 0.1} rx={pawRx} ry={pawRy} fill="#e8e4dc" />

        {/* Hit overlay */}
        <AnimatedRect
          x={-size}
          y={-size}
          width={size * 2}
          height={size * 2}
          rx={size * 0.5}
          fill="rgba(255,0,0,1)"
          animatedProps={hitProps}
        />
      </AnimatedG>

      {/* HP Badge */}
      {showHpBadge && alive && (
        <G>
          {/* Shadow */}
          <Rect x={-24} y={-size - 27} width={48} height={20} rx={8} fill="rgba(0,0,0,0.08)" />
          {/* Background */}
          <Rect x={-25} y={-size - 28} width={50} height={20} rx={8} fill="white" />
          {/* Mini bear icon */}
          <Circle cx={-14} cy={-size - 20} r={4} fill="#ddd" />
          <Circle cx={-17} cy={-size - 23} r={1.5} fill="#ccc" />
          <Circle cx={-11} cy={-size - 23} r={1.5} fill="#ccc" />
          {/* HP text */}
          <SvgText
            x={4}
            y={-size - 15}
            fill="#c62828"
            fontSize={11}
            fontWeight="bold"
            textAnchor="middle"
          >
            {hp}
          </SvgText>
          {/* HP bar background */}
          <Rect x={-hpBarWidth / 2} y={-size - 10} width={hpBarWidth} height={3} rx={1.5} fill="#e0e0e0" />
          {/* HP bar fill */}
          <Rect
            x={-hpBarWidth / 2}
            y={-size - 10}
            width={hpBarWidth * hpPercent}
            height={3}
            rx={1.5}
            fill={hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#e53935'}
          />
        </G>
      )}
    </AnimatedG>
  );
}
