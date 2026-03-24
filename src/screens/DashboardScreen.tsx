// DashboardScreen.tsx
// FitRealm – redesigned Dashboard:
//   1. Tages-Übersicht  (3 animated metric rings)
//   2. Streak Counter
//   3. Workout Recognition Card
//   4. Progress Projection Widget
//   5. Recent Workouts + Health Trends
//   6. Sync button

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

import DailyMetricCard from '../components/DailyMetricCard';
import StreakCounter from '../components/StreakCounter';
import ProgressProjectionWidget from '../components/ProgressProjectionWidget';
import WorkoutRecognitionCard from '../components/WorkoutRecognitionCard';
import WorkoutIcon from '../components/WorkoutIcon';
import WorkoutBreakdownSheet from '../components/WorkoutBreakdownSheet';

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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { recentWorkouts, healthSnapshot, isSyncing, syncHealthData } = useGameStore();
  const health = useHealthData();
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutRecord | null>(null);

  const openReward = () => {
    navigation.navigate('WorkoutReward', { workout: MOCK_WORKOUT });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Tages-Übersicht ─────────────────────────────────────── */}
        <View style={cardBackground}>
          <SectionHeader title="Heute" icon="sunny" />
          <View style={styles.metricsRow}>
            <DailyMetricCard
              icon="footsteps"
              value={health.stepsToday}
              label="Schritte"
              color="#4CAF50"
              progress={health.stepsToday / health.stepsGoal}
            />
            <DailyMetricCard
              icon="flame"
              value={health.activeCaloriesToday}
              label="Aktive kcal"
              unit=" kcal"
              color="#FF9800"
              progress={Math.min(health.activeCaloriesToday / 600, 1)}
            />
            <DailyMetricCard
              icon="time"
              value={health.workoutMinutesToday}
              label={health.workoutTypeToday}
              unit=" min"
              color={AppColors.teal}
              progress={Math.min(health.workoutMinutesToday / 60, 1)}
            />
          </View>
        </View>

        {/* ── 2. Streak Counter ──────────────────────────────────────── */}
        <StreakCounter streak={health.currentStreak} milestone={health.streakMilestone} />

        {/* ── 3. Workout Recognition Card ────────────────────────────── */}
        <WorkoutRecognitionCard onPress={openReward} />

        {/* ── 4. Progress Projection ─────────────────────────────────── */}
        <ProgressProjectionWidget stepsToday={health.stepsToday} stepsGoal={health.stepsGoal} />

        {/* ── 5. Recent Workouts ─────────────────────────────────────── */}
        <RecentWorkoutsCard workouts={recentWorkouts.slice(0, 7)} onSelectWorkout={setSelectedWorkout} />

        {/* ── 6. Health Trends ───────────────────────────────────────── */}
        <HealthTrendsCard snapshot={healthSnapshot} />

        {/* ── 7. Sync button ─────────────────────────────────────────── */}
        <SyncButton isSyncing={isSyncing} onPress={syncHealthData} />

        <View style={{ height: 24 }} />
      </ScrollView>

      <WorkoutBreakdownSheet
        workout={selectedWorkout}
        visible={selectedWorkout !== null}
        onClose={() => setSelectedWorkout(null)}
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
  const dateStr = new Date(workout.date).toLocaleDateString('de-DE');
  return (
    <TouchableOpacity style={styles.workoutRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.workoutIconWrap}>
        <WorkoutIcon workoutType={workout.workoutType} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.workoutType}>{workout.workoutType}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.workoutDetail}>{Math.floor(workout.durationMinutes)} {t('dashboard.min')}</Text>
          <Text style={styles.workoutDetail}>{Math.floor(workout.caloriesBurned)} kcal</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.workoutCoins}>+{Math.floor(workout.vitacoinsEarned)}g 💪</Text>
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
  const trendStr = trend != null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}` : '';
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

// ─── Sync button ──────────────────────────────────────────────────────────────

function SyncButton({ isSyncing, onPress }: { isSyncing: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.syncBtn} onPress={onPress} disabled={isSyncing}>
      {isSyncing ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <Ionicons name="refresh" size={16} color="#000" />
      )}
      <Text style={styles.syncText}>
        {isSyncing ? t('dashboard.syncing') : t('dashboard.syncHealthData')}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },

  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  workoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutType: { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
  workoutDetail: { fontSize: 12, color: AppColors.textSecondary },
  workoutCoins: { fontSize: 14, fontWeight: 'bold', color: AppColors.gold },
  workoutDate: { fontSize: 11, color: AppColors.textSecondary },

  trendTile: {
    flex: 1,
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  trendTitle: { fontSize: 12, fontWeight: '500', color: AppColors.textSecondary },
  trendValue: { fontSize: 22, fontWeight: 'bold', color: AppColors.textPrimary },

  syncBtn: {
    backgroundColor: AppColors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  syncText: { fontSize: 16, fontWeight: '600', color: '#000' },
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
