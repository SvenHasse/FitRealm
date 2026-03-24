// WorkoutBreakdownSheet.tsx
// Bottom-sheet modal showing full stat + reward breakdown for a past workout.
// No animations — just clean, readable info.

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors, WorkoutRecord } from '../models/types';
import WorkoutIcon from './WorkoutIcon';
import { calculateReward, formatGrams, hrMultiplier } from '../utils/currencyCalculator';
import { getWorkoutIcon } from '../utils/workoutIcons';

const GOLD = AppColors.gold;
const TEAL = AppColors.teal;
const STREAK_COLOR = '#FF6B35';

function hrColor(bpm: number): string {
  if (bpm < 100) return AppColors.textSecondary;
  if (bpm < 130) return '#4CAF50';
  if (bpm < 160) return '#FF9800';
  return '#F44336';
}

interface StatRowProps {
  label: string;
  value: string;
  valueColor?: string;
  iconName?: string;
  iconLib?: 'mci' | 'ion';
  iconColor?: string;
}

function StatRow({ label, value, valueColor, iconName, iconLib = 'mci', iconColor }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        {iconName && iconLib === 'mci' && (
          <MaterialCommunityIcons name={iconName as any} size={16} color={iconColor ?? AppColors.textSecondary} style={{ marginRight: 6 }} />
        )}
        {iconName && iconLib === 'ion' && (
          <Ionicons name={iconName as any} size={16} color={iconColor ?? AppColors.textSecondary} style={{ marginRight: 6 }} />
        )}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

interface Props {
  workout: WorkoutRecord | null;
  visible: boolean;
  onClose: () => void;
}

export default function WorkoutBreakdownSheet({ workout, visible, onClose }: Props) {
  if (!workout) return null;

  // Build a reward estimate from what we know
  // WorkoutRecord doesn't have steps/minutesAbove70HRmax, so we estimate
  const avgHR = workout.averageHeartRate ?? 120;
  const estimatedSteps = Math.round(workout.durationMinutes * 100); // rough estimate
  const estimatedMinAbove70 = avgHR >= 126 ? Math.round(workout.durationMinutes * 0.6) : 0; // 70% of 180bpm HRmax

  const reward = calculateReward({
    durationMinutes: workout.durationMinutes,
    activeCalories: workout.caloriesBurned,
    steps: estimatedSteps,
    avgHeartRate: avgHR,
    minutesAbove70HRmax: estimatedMinAbove70,
  });

  const mult = hrMultiplier(avgHR);
  const date = new Date(workout.date);
  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const iconInfo = getWorkoutIcon(workout.workoutType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconInfo.color}20` }]}>
            <WorkoutIcon workoutType={workout.workoutType} size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workoutType}>{workout.workoutType}</Text>
            <Text style={styles.dateText}>{dateStr} · {timeStr} Uhr</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={28} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Workout Stats */}
          <View style={styles.card}>
            <StatRow
              label="Dauer"
              value={`${Math.floor(workout.durationMinutes)} Min`}
              iconName="timer-outline"
              iconLib="ion"
              iconColor={AppColors.teal}
            />
            <StatRow
              label="Kalorien"
              value={`${Math.floor(workout.caloriesBurned)} kcal`}
              iconName="fire"
              iconColor="#FF9800"
            />
            <StatRow
              label="Schritte (geschätzt)"
              value={estimatedSteps.toLocaleString('de-DE')}
              iconName="shoe-print"
              iconColor="#4CAF50"
            />
            {workout.averageHeartRate != null && (
              <StatRow
                label="Ø Herzfrequenz"
                value={`${Math.floor(workout.averageHeartRate)} bpm`}
                valueColor={hrColor(workout.averageHeartRate)}
                iconName="heart-pulse"
                iconColor={hrColor(workout.averageHeartRate)}
              />
            )}
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Punkteberechnung</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Calculation rows */}
          <View style={styles.card}>
            <View style={styles.calcRow}>
              <Text style={styles.calcFormula}>
                {Math.floor(workout.durationMinutes)} Min × 2g × HR-Faktor (×{mult.toFixed(1)})
              </Text>
              <Text style={[styles.calcResult, { color: GOLD }]}>
                = {formatGrams(reward.muskelmassFromDuration)}
              </Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcFormula}>
                {Math.floor(workout.caloriesBurned)} kcal ÷ 20
              </Text>
              <Text style={[styles.calcResult, { color: GOLD }]}>
                = {formatGrams(reward.muskelmassFromCalories)}
              </Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcFormula}>
                {(estimatedSteps / 1000).toFixed(1)}k Schritte × 3g
              </Text>
              <Text style={[styles.calcResult, { color: GOLD }]}>
                = {formatGrams(reward.muskelmassFromSteps)}
              </Text>
            </View>
            {reward.protein > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcFormula}>
                  {estimatedMinAbove70} Min bei ≥70% HRmax
                </Text>
                <Text style={[styles.calcResult, { color: TEAL }]}>
                  = +{reward.protein} Protein
                </Text>
              </View>
            )}
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Gesamt</Text>
            <Text style={styles.totalMuscle}>{formatGrams(reward.totalMuskelmasse)} Muskelmasse</Text>
            {reward.protein > 0 && (
              <Text style={styles.totalProtein}>+ {reward.protein} Protein</Text>
            )}
            <Text style={styles.totalStreak}>+ 1 Streak Token 🔥</Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Close button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutType: { fontSize: 20, fontWeight: 'bold', color: AppColors.textPrimary },
  dateText: { fontSize: 13, color: AppColors.textSecondary, marginTop: 3 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statLeft: { flexDirection: 'row', alignItems: 'center' },
  statLabel: { fontSize: 14, color: AppColors.textSecondary },
  statValue: { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: `${GOLD}35` },
  dividerText: { fontSize: 13, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  calcFormula: { flex: 1, fontSize: 13, color: AppColors.textSecondary, lineHeight: 18 },
  calcResult: { fontSize: 14, fontWeight: '700' },
  totalCard: {
    backgroundColor: `${GOLD}12`,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: `${GOLD}30`,
  },
  totalLabel: { fontSize: 12, color: AppColors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  totalMuscle: { fontSize: 24, fontWeight: 'bold', color: GOLD },
  totalProtein: { fontSize: 16, fontWeight: '600', color: TEAL },
  totalStreak: { fontSize: 14, color: STREAK_COLOR },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  closeBtn: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeBtnText: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary },
});
