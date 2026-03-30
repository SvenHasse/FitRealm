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

import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useHealthData } from '../hooks/useHealthData';
import {
  AppColors,
  WorkoutRecord,
  HealthSnapshot,
  restingHRTrend,
  vo2MaxTrend,
  FitnessFocus,
} from '../models/types';
import { DAILY_TARGETS, PPMetric } from '../utils/progressPoints';
import { checkDailyFocusTarget } from '../engines/GameEngine';
import { RootStackParamList, WorkoutRewardData } from '../navigation/types';
import { useWorkoutStore, Workout } from '../store/workoutStore';
import { calculateReward } from '../utils/currencyCalculator';

import DailyMetricCard         from '../components/DailyMetricCard';
import StreakCounter            from '../components/StreakCounter';
import StreakDetailModal        from '../components/StreakDetailModal';
import ProgressProjectionWidget from '../components/ProgressProjectionWidget';
import WorkoutQueueCard          from '../components/WorkoutQueueCard';
import WorkoutBreakdownSheet    from '../components/WorkoutBreakdownSheet';
import CurrencyBar              from '../components/CurrencyBar';
import StatsHistoryModal        from '../components/StatsHistoryModal';
import { getWorkoutIcon }       from '../utils/workoutIcons';
import { useGameStore }         from '../store/gameStore';
import { STREAK_MILESTONES }    from '../utils/streakUtils';

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

// ─── Metric ordering by focus ─────────────────────────────────────────────────

interface MetricDef {
  key: PPMetric;
  icon: React.ReactNode;
  value: number;
  label: string;
  unit: string;
  color: string;
  progress: number;
}

function getOrderedMetrics(
  focus: FitnessFocus,
  health: { stepsToday: number; workoutMinutesToday: number; activeCaloriesToday: number; stepsGoal: number; workoutTypeToday: string },
): MetricDef[] {
  const all: MetricDef[] = [
    {
      key: 'steps',
      icon: <MaterialCommunityIcons name="shoe-print" size={18} color="#4CAF50" />,
      value: health.stepsToday,
      label: 'Schritte',
      unit: '',
      color: '#4CAF50',
      progress: health.stepsToday / health.stepsGoal,
    },
    {
      key: 'workouts',
      icon: <Ionicons name="time-outline" size={18} color={AppColors.teal} />,
      value: health.workoutMinutesToday,
      label: health.workoutTypeToday,
      unit: ' min',
      color: AppColors.teal,
      progress: Math.min(health.workoutMinutesToday / 60, 1),
    },
    {
      key: 'calories',
      icon: <MaterialCommunityIcons name="fire" size={18} color="#FF9800" />,
      value: health.activeCaloriesToday,
      label: 'Aktive kcal',
      unit: ' kcal',
      color: '#FF9800',
      progress: Math.min(health.activeCaloriesToday / 600, 1),
    },
  ];
  // Primary (focus) first, then the rest
  const primary = all.find(m => m.key === focus)!;
  const secondary = all.filter(m => m.key !== focus);
  return [primary, ...secondary];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { recentWorkouts, healthSnapshot, isSyncing, syncHealthData } = useEngineStore();
  const userProfile = useEngineStore(s => s.userProfile);
  const fitnessFocus: FitnessFocus = userProfile?.fitnessFocus ?? 'workouts';
  const health = useHealthData();
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();

  const [selectedWorkout,   setSelectedWorkout]   = useState<WorkoutRecord | null>(null);
  const [streakModalOpen,   setStreakModalOpen]    = useState(false);
  const [statsModalOpen,    setStatsModalOpen]     = useState(false);

  // Read streak from global store so Dashboard + StreakDetailModal stay in sync
  const { currentStreak } = useGameStore();
  const streakMilestone   = STREAK_MILESTONES.find(m => m.days > currentStreak)?.days
    ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days;

  // Workout store: unprocessed workouts for queue card, all workouts for recent list
  const allWorkouts = useWorkoutStore((s) => s.workouts);
  const unprocessed = allWorkouts.filter((w) => !w.isProcessed);

  const openQueue = () => {
    if (unprocessed.length === 0) return;
    const first = unprocessed[0];
    const data: WorkoutRewardData = {
      id: first.id,
      type: first.type,
      dateISO: first.date,
      durationMinutes: first.durationMinutes,
      activeCalories: first.activeCalories,
      steps: first.steps,
      avgHeartRate: first.avgHeartRate,
      minutesAbove70HRmax: first.minutesAbove70HRmax,
    };
    navigation.navigate('WorkoutReward', {
      workout: data,
      queueLength: unprocessed.length,
      queueIndex: 0,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 0. Currency Bar ────────────────────────────────────────── */}
        <CurrencyBar />

        {/* (PrimaryMetricHero removed — focus metric is now in Heute card) */}

        {/* ── 1. Tages-Übersicht ─────────────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setStatsModalOpen(true)}>
        <View style={cardBackground}>
          {/* Header row: "Heute" title  +  compact sync button */}
          <View style={styles.heuteHeaderRow}>
            <Ionicons name="sunny" size={16} color={AppColors.gold} />
            <Text style={styles.heuteTitle}>Heute</Text>
            <View style={{ flex: 1 }} />
            <MaterialCommunityIcons name="chart-line" size={14} color={AppColors.textSecondary} style={{ marginRight: 8 }} />
            <CompactSyncButton isSyncing={isSyncing} onPress={syncHealthData} />
          </View>

          {(() => {
            const ordered = getOrderedMetrics(fitnessFocus, health);
            const primary = ordered[0];
            const secondaries = ordered.slice(1);
            const focusTargetMet = checkDailyFocusTarget(
              fitnessFocus,
              {
                stepsToday: health.stepsToday,
                activeCaloriesToday: health.activeCaloriesToday,
                restingHeartRateCurrent: null,
                restingHeartRate30DaysAgo: null,
                vo2MaxCurrent: null,
                vo2Max30DaysAgo: null,
                lastUpdated: new Date().toISOString(),
              },
              health.workoutMinutesToday,
            );
            return (
              <View style={styles.metricsPyramid}>
                {/* Top: large focus metric centered */}
                <View style={styles.focusMetricCol}>
                  <DailyMetricCard
                    icon={primary.icon}
                    value={primary.value}
                    label={primary.label}
                    unit={primary.unit}
                    color={primary.color}
                    progress={primary.progress}
                    ringSize={130}
                  />
                  {focusTargetMet && (
                    <View style={styles.targetBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.targetBadgeText}>{t('dashboard.dailyTargetReached')}</Text>
                    </View>
                  )}
                </View>
                {/* Bottom: two small metrics side by side, offset below */}
                <View style={styles.secondaryMetricRow}>
                  {secondaries.map(m => (
                    <DailyMetricCard
                      key={m.key}
                      icon={m.icon}
                      value={m.value}
                      label={m.label}
                      unit={m.unit}
                      color={m.color}
                      progress={m.progress}
                      ringSize={68}
                    />
                  ))}
                </View>
              </View>
            );
          })()}
        </View>
        </TouchableOpacity>

        {/* ── 2. Streak Counter ──────────────────────────────────────── */}
        <StreakCounter
          streak={currentStreak}
          milestone={streakMilestone}
          fitnessFocus={fitnessFocus}
          onPress={() => setStreakModalOpen(true)}
        />

        {/* ── 3. Workout Queue Card ──────────────────────────────────── */}
        <WorkoutQueueCard workouts={unprocessed} onPress={openQueue} />

        {/* ── 4. Progress Projection ─────────────────────────────────── */}
        <ProgressProjectionWidget stepsToday={health.stepsToday} stepsGoal={health.stepsGoal} />

        {/* ── 5. Recent Workouts ─────────────────────────────────────── */}
        <RecentWorkoutsCard
          workouts={allWorkouts.length > 0
            ? allWorkouts.slice(0, 7).map((w) => {
                const reward = calculateReward({
                  durationMinutes: w.durationMinutes,
                  activeCalories: w.activeCalories,
                  steps: w.steps,
                  avgHeartRate: w.avgHeartRate,
                  minutesAbove70HRmax: w.minutesAbove70HRmax,
                });
                return {
                  id: w.id,
                  workoutType: w.type,
                  date: w.date,
                  durationMinutes: w.durationMinutes,
                  caloriesBurned: w.activeCalories,
                  averageHeartRate: w.avgHeartRate,
                  vitacoinsEarned: reward.totalMuskelmasse,
                } as WorkoutRecord;
              })
            : recentWorkouts.slice(0, 7)
          }
          onSelectWorkout={setSelectedWorkout}
        />

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

      <StatsHistoryModal
        visible={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
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

// (PrimaryMetricHero removed — replaced by asymmetric layout in Heute card)

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

  metricsPyramid: { alignItems: 'center', gap: 3 },
  focusMetricCol: { alignItems: 'center' },
  secondaryMetricRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 5 },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderRadius: 10,
  },
  targetBadgeText: { fontSize: 11, fontWeight: '600', color: '#4CAF50' },

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
