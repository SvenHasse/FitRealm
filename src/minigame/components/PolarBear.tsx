// PolarBear.tsx — Simplified SVG bear (PERF: ~6 elements per bear)

import React, { useEffect, useRef } from 'react';
import { G, Ellipse, Circle, Rect, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps, withRepeat, withSequence,
  withTiming, withDelay,
} from 'react-native-reanimated';
import { PolarBear as PolarBearType } from '../types';
import { BEAR_BODY } from '../constants';

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
  bear: PolarBearType;
  isBeingAttacked: boolean;
  showHpBadge: boolean;
}

function PolarBearInner({ bear, isBeingAttacked, showHpBadge }: Props) {
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

  // Death animation
  const deathOpacity = useSharedValue(1);
  const wasAlive = useRef(alive);
  useEffect(() => {
    if (!alive && wasAlive.current) {
      deathOpacity.value = withDelay(200, withTiming(0, { duration: 500 }));
    }
    if (alive && !wasAlive.current) {
      deathOpacity.value = withTiming(1, { duration: 600 });
    }
    wasAlive.current = alive;
  }, [alive]);

  const outerProps = useAnimatedProps(() => ({
    opacity: deathOpacity.value,
  }));

  if (!alive && deathOpacity.value === 0) return null;

  const hpPercent = hp / maxHp;

  return (
    <AnimatedG x={position.x} y={position.y} animatedProps={outerProps}>
      <AnimatedG animatedProps={bodyGroupProps}>
        {/* Shadow */}
        <Ellipse cx={0} cy={size * 0.7} rx={size * 0.7} ry={size * 0.3} fill="rgba(0,0,0,0.15)" />
        {/* Body (includes head area) */}
        <Ellipse cx={0} cy={0} rx={size * 0.85} ry={size} fill={BEAR_BODY} />
        {/* Head circle (covers ear area) */}
        <Circle cx={0} cy={-size * 0.5} r={size * 0.55} fill={BEAR_BODY} />
        {/* Eyes */}
        <Circle cx={-size * 0.2} cy={-size * 0.3} r={2} fill="#333" />
        <Circle cx={size * 0.2} cy={-size * 0.3} r={2} fill="#333" />
        {/* Nose */}
        <Ellipse cx={0} cy={-size * 0.1} rx={3.5} ry={2.5} fill="#333" />
      </AnimatedG>

      {/* HP Badge — simplified: just background rect + text */}
      {showHpBadge && alive && (
        <G>
          <Rect x={-20} y={-size - 25} width={40} height={16} rx={8} fill="white" />
          <SvgText
            x={0}
            y={-size - 14}
            fill={hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#e53935'}
            fontSize={11}
            fontWeight="bold"
            textAnchor="middle"
          >
            {hp}
          </SvgText>
        </G>
      )}
    </AnimatedG>
  );
}

const PolarBearSVG = React.memo(PolarBearInner, (prev, next) => {
  return (
    prev.bear.hp === next.bear.hp &&
    prev.bear.alive === next.bear.alive &&
    Math.round(prev.bear.position.x) === Math.round(next.bear.position.x) &&
    Math.round(prev.bear.position.y) === Math.round(next.bear.position.y) &&
    prev.isBeingAttacked === next.isBeingAttacked
  );
});

export default PolarBearSVG;
