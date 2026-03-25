// BuildingCard.tsx
// Flip-card container. Front: icon + costs + benefit + button.
// Back: compact details.

import React, { useState, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate, Easing,
} from 'react-native-reanimated';
import { BuildingType, GameState } from '../../models/types';
import {
  buildCost, rathausRequirement, allowedInstances, maxInstances,
  constructionTime, Production,
  HOLZLAGER_STORAGE, STEINLAGER_STORAGE, NAHRUNGSLAGER_STORAGE,
  ResourceCost, nextInstanceUnlockLevel,
} from '../../config/GameConfig';
import { canAfford } from '../../engines/GameEngine';
import BuildingCardFront from './BuildingCardFront';
import BuildingCardBack from './BuildingCardBack';

export const CARD_HEIGHT = 218;

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface CostLine {
  iconName: string;
  iconColor: string;
  text: string;
  ok: boolean;
  missing: number;
  have: number;
}

export interface BenefitLine {
  iconName: string;
  iconColor: string;
  text: string;
}

export type CardStatus = 'canBuild' | 'tooExpensive' | 'rathausLocked' | 'atMax' | 'slotLocked';

// ─── Building icon mapping ────────────────────────────────────────────────────

export function buildingMCIcon(type: BuildingType): { name: string; color: string } {
  switch (type) {
    case BuildingType.rathaus:       return { name: 'castle',         color: '#F5A623' };
    case BuildingType.holzfaeller:   return { name: 'axe',            color: '#8B7355' };
    case BuildingType.feld:          return { name: 'sprout',          color: '#4CAF50' };
    case BuildingType.kornkammer:    return { name: 'barrel',          color: '#F5A623' };
    case BuildingType.holzlager:     return { name: 'warehouse',       color: '#607D8B' };
    case BuildingType.steinlager:    return { name: 'warehouse',       color: '#78909C' };
    case BuildingType.nahrungslager: return { name: 'warehouse',       color: '#8D6E63' };
    case BuildingType.kaserne:       return { name: 'shield-sword',    color: '#4CAF50' };
    case BuildingType.proteinfarm:   return { name: 'diamond',         color: '#9B59B6' };
    case BuildingType.tempel:        return { name: 'church',          color: '#E8C948' };
    case BuildingType.bibliothek:    return { name: 'bookshelf',       color: '#5C8A6A' };
    case BuildingType.marktplatz:    return { name: 'store',           color: '#FF7043' };
    case BuildingType.stammeshaus:   return { name: 'account-group',   color: '#2196F3' };
    case BuildingType.steinbruch:    return { name: 'pickaxe',         color: '#9E9E9E' };
    default:                         return { name: 'home-city',        color: '#F5A623' };
  }
}

// ─── Cost Lines ───────────────────────────────────────────────────────────────

export function computeCostLines(cost: ResourceCost, gs: GameState): CostLine[] {
  const lines: CostLine[] = [];
  const add = (iconName: string, iconColor: string, needed: number, have: number, suffix = '') => {
    if (needed <= 0) return;
    lines.push({
      iconName, iconColor,
      text: `${needed}${suffix}`,
      ok: have >= needed,
      missing: Math.max(0, needed - have),
      have: Math.floor(have),
    });
  };
  add('dumbbell',      '#F5A623', cost.muskelmasse,  gs.muskelmasse,  'g');
  add('diamond',       '#9B59B6', cost.protein,      gs.protein);
  add('fire',          '#E53935', cost.streakTokens, gs.streakTokens);
  add('tree',          '#8B7355', cost.wood,         gs.wood);
  add('cube-outline',  '#9E9E9E', cost.stone,        gs.stone);
  add('leaf',          '#4CAF50', cost.food,         gs.food);
  return lines;
}

// ─── Benefit Lines ────────────────────────────────────────────────────────────

export function computeBenefitLines(type: BuildingType): BenefitLine[] {
  switch (type) {
    case BuildingType.rathaus:       return [{ iconName: 'lock-open-outline', iconColor: '#F5A623', text: 'Neue Gebäude' }];
    case BuildingType.kornkammer:    return [{ iconName: 'dumbbell',          iconColor: '#F5A623', text: `+${Production.kornkammer}g/h` }];
    case BuildingType.proteinfarm:   return [{ iconName: 'diamond',           iconColor: '#9B59B6', text: '+1.0/Tag' }];
    case BuildingType.holzfaeller:   return [{ iconName: 'tree',              iconColor: '#8B7355', text: `+${Production.holzfaeller}/h` }];
    case BuildingType.steinbruch:    return [{ iconName: 'cube-outline',       iconColor: '#9E9E9E', text: `+${Production.steinbruch}/h` }];
    case BuildingType.feld:          return [{ iconName: 'leaf',               iconColor: '#4CAF50', text: `+${Production.feld}/h` }];
    case BuildingType.holzlager:     return [{ iconName: 'package-variant',    iconColor: '#607D8B', text: `+${HOLZLAGER_STORAGE[0]} Holz` }];
    case BuildingType.steinlager:    return [{ iconName: 'package-variant',    iconColor: '#78909C', text: `+${STEINLAGER_STORAGE[0]} Stein` }];
    case BuildingType.nahrungslager: return [{ iconName: 'package-variant',    iconColor: '#8D6E63', text: `+${NAHRUNGSLAGER_STORAGE[0]} Nahr.` }];
    case BuildingType.kaserne:       return [{ iconName: 'account-hard-hat',   iconColor: '#4CAF50', text: '+1 Worker' }];
    case BuildingType.tempel:        return [{ iconName: 'lightning-bolt',     iconColor: '#E8C948', text: 'Streak-Boost' }];
    case BuildingType.bibliothek:    return [{ iconName: 'school',             iconColor: '#5C8A6A', text: 'Forschung' }];
    case BuildingType.marktplatz:    return [{ iconName: 'swap-horizontal',    iconColor: '#FF7043', text: 'Tauschen' }];
    case BuildingType.stammeshaus:   return [{ iconName: 'home-group',         iconColor: '#2196F3', text: 'Stammesbonus' }];
    default:                         return [];
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  type: BuildingType;
  gameState: GameState;
  rathausLevel: number;
  existing: number;
  allowed: number;
  onBuild: () => void;
  hasIdleWorker: boolean;
  hasAnyWorker: boolean;
}

function BuildingCard({
  type, gameState, rathausLevel, existing, allowed, onBuild, hasIdleWorker, hasAnyWorker,
}: Props) {
  const [showingBack, setShowingBack] = useState(false);
  const rotation = useSharedValue(0);

  const cost          = buildCost(type);
  const totalMax      = maxInstances(type);
  const rathausReq    = rathausRequirement(type);
  const notUnlocked   = allowed === 0;
  const atMax         = existing >= totalMax;
  const slotLocked    = !notUnlocked && !atMax && existing >= allowed;
  const affordable    = canAfford(gameState, cost);
  const nextSlotLvl   = nextInstanceUnlockLevel(type, existing);
  const buildTimeSecs = constructionTime(type, 1);

  const status: CardStatus =
    (notUnlocked || rathausLevel < rathausReq) ? 'rathausLocked' :
    atMax        ? 'atMax' :
    slotLocked   ? 'slotLocked' :
    !affordable  ? 'tooExpensive' :
    'canBuild';

  const costLines    = computeCostLines(cost, gameState);
  const benefitLines = computeBenefitLines(type);
  const icon         = buildingMCIcon(type);

  const flip = (toBack: boolean) => {
    rotation.value = withTiming(toBack ? 1 : 0, {
      duration: 420,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
    setShowingBack(toBack);
  };

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` },
    ],
    opacity: rotation.value < 0.5 ? 1 : 0,
    position: 'absolute', width: '100%', height: '100%',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [-90, 0])}deg` },
    ],
    opacity: rotation.value >= 0.5 ? 1 : 0,
    position: 'absolute', width: '100%', height: '100%',
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={frontStyle} pointerEvents={showingBack ? 'none' : 'auto'}>
        <BuildingCardFront
          type={type}
          status={status}
          costLines={costLines}
          benefitLines={benefitLines}
          rathausReq={rathausReq}
          iconName={icon.name}
          iconColor={icon.color}
          buildTimeSecs={buildTimeSecs}
          hasIdleWorker={hasIdleWorker}
          onFlip={() => flip(true)}
          onBuild={onBuild}
        />
      </Animated.View>
      <Animated.View style={backStyle} pointerEvents={showingBack ? 'auto' : 'none'}>
        <BuildingCardBack
          type={type}
          costLines={costLines}
          status={status}
          rathausLevel={rathausLevel}
          rathausReq={rathausReq}
          existing={existing}
          totalMax={totalMax}
          buildTimeSecs={buildTimeSecs}
          nextSlotLevel={nextSlotLvl}
          onFlip={() => flip(false)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '47%',
    height: CARD_HEIGHT,
  },
});

export default memo(BuildingCard);
