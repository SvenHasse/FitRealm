// CollectRewardPopup.tsx
// FitRealm - Animated reward popup shown after collecting all building resources

import React, { useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, withSpring,
  Easing,
} from 'react-native-reanimated';
import type { CollectResult } from '../engines/GameEngine';

// MARK: - Resource display config
type ResourceConfig = {
  key: keyof Omit<CollectResult, 'totalBuildings'>;
  nameKey: string;
  icon: string;
  color: string;
};

const RESOURCES: ResourceConfig[] = [
  { key: 'muskelmasse', nameKey: 'resources.muskelmasse', icon: 'barbell',  color: '#F5A623' },
  { key: 'protein',     nameKey: 'resources.protein',     icon: 'medkit',   color: '#A78BFA' },
  { key: 'wood',        nameKey: 'resources.wood',         icon: 'hammer',   color: '#6EBF8B' },
  { key: 'stone',       nameKey: 'resources.stone',        icon: 'cube',     color: '#94A3B8' },
  { key: 'food',        nameKey: 'resources.food',         icon: 'leaf',     color: '#FB923C' },
];

const PARTICLE_COLORS = ['#F5A623', '#A78BFA', '#00BCD4', '#6EBF8B', '#FB923C'];

// MARK: - Props
interface Props {
  result: CollectResult;
  onClose: () => void;
}

// MARK: - Main popup
export default function CollectRewardPopup({ result, onClose }: Props) {
  const { t } = useTranslation();
  const activeResources = RESOURCES.filter(r => result[r.key] > 0);

  // Stable particle configs per render cycle
  const particles = useMemo(() => {
    const count = 14;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + (i % 3) * 0.25,
      distance: 55 + (i % 4) * 18,
      size: 5 + (i % 3) * 2,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
  }, []);

  // Trophy bounce in
  const trophyScale = useSharedValue(0);
  useEffect(() => {
    trophyScale.value = withSpring(1, { damping: 7, stiffness: 130 });
  }, []);
  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trophyScale.value }],
  }));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        {/* Inner touch stopper so tapping the card doesn't dismiss */}
        <TouchableOpacity activeOpacity={1} style={styles.cardTouch}>
          <View style={styles.card}>

            {/* Burst particles (positioned from card center) */}
            <View style={styles.particleOrigin} pointerEvents="none">
              {particles.map(p => (
                <Particle key={p.id} angle={p.angle} distance={p.distance} size={p.size} color={p.color} />
              ))}
            </View>

            {/* Trophy */}
            <Animated.View style={trophyStyle}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </Animated.View>

            {/* Titles */}
            <Text style={styles.title}>{t('collect.title')}</Text>
            <Text style={styles.subtitle}>
              {t('collect.subtitle', { count: result.totalBuildings })}
            </Text>

            {/* Resource rows */}
            <View style={styles.rowsContainer}>
              {activeResources.map((res, i) => (
                <ResourceRow
                  key={res.key}
                  res={res}
                  amount={result[res.key]}
                  index={i}
                  isLast={i === activeResources.length - 1}
                />
              ))}
            </View>

            {/* CTA button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>{t('collect.closeButton')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// MARK: - Resource Row (staggered slide-in from right)
function ResourceRow({
  res,
  amount,
  index,
  isLast,
}: {
  res: ResourceConfig;
  amount: number;
  index: number;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const translateX = useSharedValue(55);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;
    translateX.value = withDelay(delay, withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }));
    opacity.value    = withDelay(delay, withTiming(1, { duration: 280 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const display =
    res.key === 'muskelmasse'
      ? `+${Math.floor(amount)}g`
      : `+${Math.floor(amount)}`;

  return (
    <Animated.View style={animStyle}>
      <View style={styles.resourceRow}>
        <View style={[styles.iconCircle, { backgroundColor: `${res.color}22` }]}>
          <Ionicons name={res.icon as any} size={20} color={res.color} />
        </View>
        <Text style={styles.resourceName}>{t(res.nameKey)}</Text>
        <Text style={[styles.resourceAmount, { color: res.color }]}>{display}</Text>
      </View>
      {!isLast && <View style={styles.separator} />}
    </Animated.View>
  );
}

// MARK: - Particle
function Particle({
  angle,
  distance,
  size,
  color,
}: {
  angle: number;
  distance: number;
  size: number;
  color: string;
}) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const ex = Math.cos(angle) * distance;
    const ey = Math.sin(angle) * distance;
    x.value       = withTiming(ex, { duration: 800, easing: Easing.out(Easing.cubic) });
    y.value       = withTiming(ey, { duration: 800, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(200, withTiming(0, { duration: 600 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: -size / 2,
    top:  -size / 2,
    width:  size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={animStyle} />;
}

// MARK: - Styles
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouch: {
    width: '85%',
    maxWidth: 360,
  },
  card: {
    backgroundColor: '#1E1E3A',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    overflow: 'visible',
  },
  // The origin point for particles — 0×0 absolutely positioned at visual center
  particleOrigin: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 0,
    height: 0,
  },
  trophyEmoji: { fontSize: 52, marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginBottom: 20,
  },
  rowsContainer: { width: '100%', marginBottom: 22 },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#fff' },
  resourceAmount: { fontSize: 18, fontWeight: 'bold' },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 48,
  },
  closeBtn: {
    width: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1A1A2E' },
});
