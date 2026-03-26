// HUD.tsx — Heads-Up-Display (Geld-Anzeige, Titel) — normale RN-Views, kein SVG

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated';
import { UI_BG_PRIMARY, UI_GOLD, UI_TEXT } from '../constants';
import { ItemType } from '../types';

interface Props {
  totalMoney: number;
  backpackCount: number;
  backpackCapacity: number;
  currentItemType: ItemType | null;
}

const itemLabel: Record<ItemType, { label: string; color: string }> = {
  [ItemType.RAW_MEAT]: { label: 'Fleisch', color: '#e53935' },
  [ItemType.STEAK]: { label: 'Steaks', color: '#8d6e63' },
  [ItemType.GRILLED_STEAK]: { label: 'Grill-Steaks', color: '#5d4037' },
  [ItemType.MONEY]: { label: 'Geld', color: '#4caf50' },
};

export default function HUD({ totalMoney, backpackCount, backpackCapacity, currentItemType }: Props) {
  const moneyScale = useSharedValue(1);

  useEffect(() => {
    if (totalMoney > 0) {
      moneyScale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1.0, { duration: 150 }),
      );
    }
  }, [totalMoney]);

  const moneyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moneyScale.value }],
  }));

  const info = currentItemType ? itemLabel[currentItemType] : null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>EISBÄREN-FABRIK</Text>
      </View>

      {/* Money */}
      <Animated.View style={[styles.moneyContainer, moneyStyle]}>
        <Text style={styles.moneyDollar}>$</Text>
        <Text style={styles.moneyAmount}>{totalMoney}</Text>
      </Animated.View>

      {/* Backpack info */}
      {backpackCount > 0 && info && (
        <View style={styles.backpackInfo}>
          <View style={[styles.dot, { backgroundColor: info.color }]} />
          <Text style={styles.backpackText}>
            {info.label}: {backpackCount}/{backpackCapacity}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  moneyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_BG_PRIMARY,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: UI_GOLD,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  moneyDollar: {
    color: UI_GOLD,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 4,
  },
  moneyAmount: {
    color: UI_GOLD,
    fontSize: 20,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  backpackInfo: {
    position: 'absolute',
    top: 44,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14,16,22,0.85)',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  backpackText: {
    color: UI_TEXT,
    fontSize: 12,
    fontWeight: '600',
  },
});
