// DashboardScreen.tsx
// FitRealm – Dashboard:
//   1. Tages-Übersicht  (3 animated metric rings + compact sync button)
//   2. Streak Counter   (tappable → StreakDetailModal)
//   3. Workout Recognition Card
//   4. Progress Projection Widget
//   5. Recent Workouts + Health Trends

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useGameStore } from '../store/useGameStore';
import { useHealthData } from '../hooks/useHealthData';
import {
  AppColors,
  WorkoutRecord,
  HealthSnapshot,
  restingHRTrend,
  vo2MaxTrend,
} from '../models/types';
import { RootStackParamList, MOCK_WORKOUT } from '../navigation/types';

import DailyMetricCard       from '../components/DailyMetricCard';
import StreakCounter          from '../components/StreakCounter';
import StreakDetailModal      from '../components/StreakDetailModal';
import ProgressProjectionWidget from '../components/ProgressProjectionWidget';
import WorkoutRecognitionCard from '../components/WorkoutRecognitionCard';
import WorkoutBreakdownSheet  from '../components/WorkoutBreakdownSheet';
import { getWorkoutIcon }     from '../utils/workoutIcons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Shared components (also imported by WorkerSheet, SettingsScreen) ─────────

export function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
      <Ionicons name={icon as any} size={16} color={AppColors.gold} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: AppColors.textPrimary }}>{title}</Text>
    </View>
  );
}

export function StatTile({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={sharedStyles.statTile}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={sharedStyles.statValue}>{value}</Text>
      <Text style={sharedStyles.statLabel}>{label}</Text>
    </View>
  );
}

export function EmptyDataNotice({ message }: { message: string }) {
  return (
    <View style={sharedStyles.emptyNotice}>
      <Ionicons name="information-circle" size={18} color={AppColors.teal} />
      <Text style={sharedStyles.emptyText}>{message}</Text>
    </View>
  );
}

/** Re-usable card background style object (also used by SettingsScreen) */
export const cardBackground = {
  backgroundColor: AppColors.cardBackground,
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

// ─── Compact sync button (Heute header) ───────────────────────────────────────

function CompactSyncButton({
  isSyncing,
  onPress,
}: {
  isSyncing: boolean;
  onPress: () => void;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  }, [isSyncing]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      style={styles.syncCircle}
      onPress={onPress}
      disabled={isSyncing}
      activeOpacity={0.7}
    >
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons
          name="sync"
          size={18}
          color={isSyncing ? AppColors.gold : AppColors.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { recentWorkouts, healthSnapshot, isSyncing, syncHealthData } = useGameStore();
  const health = useHealthData();
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();

  const [selectedWorkout,  setSelectedWorkout]  = useState<WorkoutRecord | null>(null);
  const [streakModalOpen,  setStreakModalOpen]   = useState(false);

  const openReward = () => navigation.navigate('WorkoutReward', { workout: MOCK_WORKOUT });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Tages-Übersicht ─────────────────────────────────────── */}
        <View style={cardBackground}>
          {/* Header row: "Heute" title  +  compact sync button */}
          <View style={styles.heuteHeaderRow}>
            <Ionicons name="sunny" size={16} color={AppColors.gold} />
            <Text style={styles.heuteTitle}>Heute</Text>
            <View style={{ flex: 1 }} />
            <CompactSyncButton isSyncing={isSyncing} onPress={syncHealthData} />
          </View>

          <View style={styles.metricsRow}>
            <DailyMetricCard
              icon={<MaterialCommunityIcons name="shoe-print" size={18} color="#4CAF50" />}
              value={health.stepsToday}
              label="Schritte"
              color="#4CAF50"
              progress={health.stepsToday / health.stepsGoal}
            />
            <DailyMetricCard
              icon={<MaterialCommunityIcons name="fire" size={18} color="#FF9800" />}
              value={health.activeCaloriesToday}
              label="Aktive kcal"
              unit=" kcal"
              color="#FF9800"
              progress={Math.min(health.activeCaloriesToday / 600, 1)}
            />
            <DailyMetricCard
              icon={<Ionicons name="time-outline" size={18} color={AppColors.teal} />}
              value={health.workoutMinutesToday}
              label={health.workoutTypeToday}
              unit=" min"
              color={AppColors.teal}
              progress={Math.min(health.workoutMinutesToday / 60, 1)}
            />
          </View>
        </View>

        {/* ── 2. Streak Counter ──────────────────────────────────────── */}
        <StreakCounter
          streak={health.currentStreak}
          milestone={health.streakMilestone}
          onPress={() => setStreakModalOpen(true)}
        />

        {/* ── 3. Workout Recognition Card ────────────────────────────── */}
        <WorkoutRecognitionCard onPress={openReward} />

        {/* ── 4. Progress Projection ─────────────────────────────────── */}
        <ProgressProjectionWidget stepsToday={health.stepsToday} stepsGoal={health.stepsGoal} />

        {/* ── 5. Recent Workouts ─────────────────────────────────────── */}
        <RecentWorkoutsCard workouts={recentWorkouts.slice(0, 7)} onSelectWorkout={setSelectedWorkout} />

        {/* ── 6. Health Trends ───────────────────────────────────────── */}
        <HealthTrendsCard snapshot={healthSnapshot} />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Sheets & Modals ────────────────────────────────────────── */}
      <WorkoutBreakdownSheet
        workout={selectedWorkout}
        visible={selectedWorkout !== null}
        onClose={() => setSelectedWorkout(null)}
      />

      <StreakDetailModal
        visible={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─── Recent Workouts ──────────────────────────────────────────────────────────

function RecentWorkoutsCard({
  workouts,
  onSelectWorkout,
}: {
  workouts: WorkoutRecord[];
  onSelectWorkout: (w: WorkoutRecord) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={cardBackground}>
      <SectionHeader title={t('dashboard.recentWorkouts')} icon="time" />
      {workouts.length === 0 ? (
        <EmptyDataNotice message={t('dashboard.noHealthData')} />
      ) : (
        workouts.map(w => (
          <WorkoutRow key={w.id} workout={w} onPress={() => onSelectWorkout(w)} />
        ))
      )}
    </View>
  );
}

function WorkoutRow({ workout, onPress }: { workout: WorkoutRecord; onPress: () => void }) {
  const { t } = useTranslation();
  const dateStr  = new Date(workout.date).toLocaleDateString('de-DE');
  const iconInfo = getWorkoutIcon(workout.workoutType);
  return (
    <TouchableOpacity style={styles.workoutRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.workoutIconWrap, { backgroundColor: `${iconInfo.color}20` }]}>
        <MaterialCommunityIcons name={iconInfo.name as any} size={22} color={iconInfo.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.workoutType}>{workout.workoutType}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.workoutDetail}>{Math.floor(workout.durationMinutes)} {t('dashboard.min')}</Text>
          <Text style={styles.workoutDetail}>{Math.floor(workout.caloriesBurned)} kcal</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.workoutCoins}>+{Math.floor(workout.vitacoinsEarned)}g</Text>
        <Text style={styles.workoutDate}>{dateStr}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ─── Health Trends ────────────────────────────────────────────────────────────

function HealthTrendsCard({ snapshot }: { snapshot: HealthSnapshot }) {
  const { t } = useTranslation();
  return (
    <View style={cardBackground}>
      <SectionHeader title={t('dashboard.healthTrends')} icon="pulse" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TrendTile
          title={t('dashboard.restingHR')}
          value={
            snapshot.restingHeartRateCurrent != null
              ? `${Math.floor(snapshot.restingHeartRateCurrent)} ${t('dashboard.bpm')}`
              : '--'
          }
          trend={restingHRTrend(snapshot)}
          lowerIsBetter
          icon="heart"
          color="#F44336"
        />
        <TrendTile
          title={t('dashboard.vo2Max')}
          value={snapshot.vo2MaxCurrent != null ? snapshot.vo2MaxCurrent.toFixed(1) : '--'}
          trend={vo2MaxTrend(snapshot)}
          lowerIsBetter={false}
          icon="fitness"
          color={AppColors.teal}
        />
      </View>
    </View>
  );
}

function TrendTile({
  title,
  value,
  trend,
  lowerIsBetter,
  icon,
  color,
}: {
  title: string;
  value: string;
  trend: number | null;
  lowerIsBetter: boolean;
  icon: string;
  color: string;
}) {
  const { t } = useTranslation();
  const improving = trend != null ? (lowerIsBetter ? trend < 0 : trend > 0) : null;
  const trendStr  = trend != null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}` : '';
  return (
    <View style={styles.trendTile}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={styles.trendTitle}>{title}</Text>
      </View>
      <Text style={styles.trendValue}>{value}</Text>
      {improving != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons
            name={improving ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={13}
            color={improving ? '#4CAF50' : '#F44336'}
          />
          <Text style={{ fontSize: 12, fontWeight: '600', color: improving ? '#4CAF50' : '#F44336' }}>
            {trendStr}
          </Text>
          <Text style={{ fontSize: 11, color: AppColors.textSecondary }}>
            {t('dashboard.vs30dAgo')}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: AppColors.background },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  // Heute header row
  heuteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  heuteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  // Compact circular sync button
  syncCircle: {
    width:  36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },

  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  workoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutType:   { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  workoutDetail: { fontSize: 12, color: AppColors.textSecondary },
  workoutCoins:  { fontSize: 14, fontWeight: 'bold', color: AppColors.gold },
  workoutDate:   { fontSize: 11, color: AppColors.textSecondary },

  trendTile: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  trendTitle: { fontSize: 12, fontWeight: '500', color: AppColors.textSecondary },
  trendValue: { fontSize: 22, fontWeight: 'bold', color: AppColors.textPrimary },
});

// Shared styles for the exported SectionHeader / StatTile / EmptyDataNotice
const sharedStyles = StyleSheet.create({
  statTile: {
    width: '47%',
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: AppColors.textPrimary },
  statLabel: { fontSize: 12, color: AppColors.textSecondary },
  emptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(0,180,216,0.1)',
    borderRadius: 10,
  },
  emptyText: { fontSize: 13, color: AppColors.textSecondary, flex: 1 },
});
