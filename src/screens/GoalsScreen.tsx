// GoalsScreen.tsx
// FitRealm - Fitness goals with real HealthKit progress
// Ported from GoalsView.swift

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AppColors, Goal, goalProgressFraction } from '../models/types';

export default function GoalsScreen() {
  const { healthSnapshot, workoutsThisMonth } = useGameStore();
  const { t } = useTranslation();

  // Goal 1: Lower Resting Heart Rate by 5 bpm
  const rhrStart = healthSnapshot.restingHeartRate30DaysAgo ?? healthSnapshot.restingHeartRateCurrent ?? 70;
  const rhrCurrent = healthSnapshot.restingHeartRateCurrent ?? rhrStart;
  const rhrGoal: Goal = {
    id: '00000000-0000-0000-0000-000000000001',
    title: t('goals.lowerRHR'),
    description: t('goals.lowerRHRDesc'),
    rewardVitacoins: 500,
    currentValue: rhrStart - rhrCurrent,
    startValue: 0,
    targetValue: 5,
    isAchieved: (rhrStart - rhrCurrent) >= 5,
  };

  // Goal 2: Improve VO2 Max by 2 points
  const vo2Start = healthSnapshot.vo2Max30DaysAgo ?? healthSnapshot.vo2MaxCurrent ?? 40;
  const vo2Current = healthSnapshot.vo2MaxCurrent ?? vo2Start;
  const vo2Goal: Goal = {
    id: '00000000-0000-0000-0000-000000000002',
    title: t('goals.improveVO2'),
    description: t('goals.improveVO2Desc'),
    rewardVitacoins: 300,
    currentValue: vo2Current - vo2Start,
    startValue: 0,
    targetValue: 2,
    isAchieved: (vo2Current - vo2Start) >= 2,
  };

  // Goal 3: Complete 20 workouts this month
  const workoutGoal: Goal = {
    id: '00000000-0000-0000-0000-000000000003',
    title: t('goals.complete20'),
    description: t('goals.complete20Desc'),
    rewardVitacoins: 200,
    currentValue: workoutsThisMonth,
    startValue: 0,
    targetValue: 20,
    isAchieved: workoutsThisMonth >= 20,
  };

  const goals = [rhrGoal, vo2Goal, workoutGoal];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} />
      ))}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const fraction = goalProgressFraction(goal);
  const progressDisplay = goal.targetValue === 20
    ? t('goals.workoutsCount', { count: Math.floor(goal.currentValue) })
    : `${goal.currentValue.toFixed(1)} / ${goal.targetValue.toFixed(1)}`;
  const currentLabel = goal.targetValue === 20
    ? t('goals.workoutsThisMonth', { count: Math.floor(goal.currentValue) })
    : goal.title === t('goals.lowerRHR')
      ? t('goals.bpmImprovement', { value: goal.currentValue.toFixed(1) })
      : t('goals.pointsImprovement', { value: goal.currentValue.toFixed(1) });

  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {goal.isAchieved && <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />}
            <Text style={styles.goalTitle}>{goal.title}</Text>
          </View>
          <Text style={styles.goalDesc}>{goal.description}</Text>
        </View>
        <RewardBadge coins={goal.rewardVitacoins} achieved={goal.isAchieved} />
      </View>

      {/* Current value */}
      <Text style={styles.currentLabel}>{currentLabel}</Text>

      {/* Progress bar */}
      <View>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{t('goals.progress')}</Text>
          <Text style={styles.progressValue}>{progressDisplay}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[
            styles.progressFill,
            {
              width: `${Math.min(fraction * 100, 100)}%`,
              backgroundColor: goal.isAchieved ? '#4CAF50' : AppColors.gold,
            },
          ]} />
        </View>
      </View>

      {goal.isAchieved && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="gift" size={16} color="#4CAF50" />
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#4CAF50' }}>{t('goals.goalAchieved')}</Text>
        </View>
      )}
    </View>
  );
}

function RewardBadge({ coins, achieved }: { coins: number; achieved: boolean }) {
  const color = achieved ? '#4CAF50' : AppColors.gold;
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}26` }]}>
      <Ionicons name="ellipse" size={10} color={color} />
      <Text style={[styles.badgeText, { color }]}>{coins}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  goalTitle: { fontSize: 17, fontWeight: 'bold', color: AppColors.textPrimary },
  goalDesc: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
  currentLabel: { fontSize: 13, fontWeight: '500', color: AppColors.teal },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: AppColors.textSecondary },
  progressValue: { fontSize: 12, fontWeight: '600', color: AppColors.textPrimary },
  progressBg: { height: 10, backgroundColor: AppColors.background, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 10, borderRadius: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 13, fontWeight: 'bold' },
});
