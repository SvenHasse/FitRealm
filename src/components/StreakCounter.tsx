// StreakCounter.tsx
// Compact animated streak number + progress bar.
// Tappable — pass onPress to open the StreakDetailModal.

import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon from './GameIcon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { AppColors, FitnessFocus } from '../models/types';
import { useTranslation } from 'react-i18next';
import { formatShieldCountdown } from '../utils/streakUtils';

const STREAK_COLOR = '#FF6B35';

interface Props {
  streak: number;
  milestone: number; // next target day count (e.g. 7, 14, 21 …)
  fitnessFocus?: FitnessFocus;
  onPress?: () => void;
  /** Set when a shield is currently active */
  shieldActive?: boolean;
  shieldExpiresAt?: number;
  /** Count of shields in inventory (not yet activated) */
  shieldCount?: number;
}

export default function StreakCounter({ streak, milestone, fitnessFocus, onPress, shieldActive, shieldExpiresAt, shieldCount = 0 }: Props) {
  const { t } = useTranslation();
  const scale    = useSharedValue(1);
  const progress = milestone > 0 ? Math.min(streak / milestone, 1) : 0;
  const daysLeft = Math.max(milestone - streak, 0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 200 }),
      withSpring(1.0, { damping: 8, stiffness: 160 }),
    );
  }, [streak]);

  const flameAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.row}>
        <Animated.View style={flameAnim}>
          <MaterialCommunityIcons name="fire" size={36} color={STREAK_COLOR} />
        </Animated.View>
        <View style={styles.info}>
          <View style={styles.numberRow}>
            <Text style={styles.number}>{streak}</Text>
            <Text style={styles.numberSuffix}> Tage</Text>
          </View>
          {/* Shield status — inline below number */}
          {shieldActive && shieldExpiresAt ? (
            <View style={styles.shieldActivePill}>
              <GameIcon name="shield-active" size={11} />
              <Text style={styles.shieldActiveText}>
                Geschützt · {formatShieldCountdown(shieldExpiresAt)}
              </Text>
            </View>
          ) : shieldCount > 0 ? (
            <View style={styles.shieldReadyPill}>
              <GameIcon name="shield-active" size={10} />
              <Text style={styles.shieldReadyText}>{shieldCount}× bereit</Text>
            </View>
          ) : null}
          <Text style={styles.sub}>
            {fitnessFocus
              ? t(`dashboard.streakLabel_${fitnessFocus}`)
              : 'Workout-Streak'}
          </Text>
        </View>
        {/* Chevron hint */}
        {onPress && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={`${STREAK_COLOR}60`}
          />
        )}
      </View>

      {/* Progress towards next milestone */}
      <View style={styles.progressWrap}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={styles.hint}>
          {daysLeft > 0
            ? `Noch ${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} bis nächstem Meilenstein`
            : 'Meilenstein erreicht — tippe für Details'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    paddingVertical:   12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${STREAK_COLOR}30`,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  info: { flex: 1 },
  numberRow: { flexDirection: 'row', alignItems: 'baseline' },
  number: {
    fontSize: 36,
    fontWeight: 'bold',
    color: STREAK_COLOR,
    lineHeight: 42,
  },
  numberSuffix: { fontSize: 16, color: AppColors.textSecondary },
  sub: { fontSize: 12, color: AppColors.textSecondary, marginTop: 3 },
  shieldActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(196,98,45,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(196,98,45,0.45)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 4,
  },
  shieldActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C4622D',
  },
  shieldReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  shieldReadyText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  progressWrap: { gap: 6 },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: STREAK_COLOR,
    borderRadius: 3,
  },
  hint: { fontSize: 11, color: AppColors.textSecondary, lineHeight: 16 },
});
