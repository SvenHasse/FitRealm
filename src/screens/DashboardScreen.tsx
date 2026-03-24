// DashboardScreen.tsx
// FitRealm - Main dashboard: Vitacoin balance, today's summary, recent workouts, health trends
// Ported from DashboardView.swift

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AppColors, WorkoutRecord, HealthSnapshot, workoutIconName, restingHRTrend, vo2MaxTrend } from '../models/types';

export default function DashboardScreen() {
  const {
    totalVitacoins, workoutsToday, vitacoinsEarnedToday, healthSnapshot,
    recentWorkouts, isSyncing, syncHealthData,
  } = useGameStore();
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <VitacoinHeroCard total={totalVitacoins} />
      <TodaySummaryCard
        workoutsToday={workoutsToday}
        vitacoinsToday={vitacoinsEarnedToday}
        stepsToday={healthSnapshot.stepsToday}
        activeKcal={healthSnapshot.activeCaloriesToday}
      />
      <RecentWorkoutsCard workouts={recentWorkouts.slice(0, 7)} />
      <HealthTrendsCard snapshot={healthSnapshot} />
      <SyncButton isSyncing={isSyncing} onPress={() => syncHealthData()} />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// MARK: - VitacoinHeroCard
function VitacoinHeroCard({ total }: { total: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.heroCard}>
      <View style={styles.heroRow}>
        <Ionicons name="ellipse" size={44} color={AppColors.gold} />
        <Text style={styles.heroValue}>{Math.floor(total)}</Text>
      </View>
      <Text style={styles.heroLabel}>{t('dashboard.vitacoins')}</Text>
    </View>
  );
}

// MARK: - TodaySummaryCard
function TodaySummaryCard({ workoutsToday, vitacoinsToday, stepsToday, activeKcal }: {
  workoutsToday: number; vitacoinsToday: number; stepsToday: number; activeKcal: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <SectionHeader title={t('dashboard.today')} icon="sunny" />
      <View style={styles.statGrid}>
        <StatTile value={`${workoutsToday}`} label={t('dashboard.workouts')} icon="walk" color={AppColors.teal} />
        <StatTile value={`${Math.floor(vitacoinsToday)}`} label={t('dashboard.coinsEarned')} icon="ellipse" color={AppColors.gold} />
        <StatTile value={`${Math.floor(stepsToday)}`} label={t('dashboard.steps')} icon="footsteps" color="#4CAF50" />
        <StatTile value={`${Math.floor(activeKcal)}`} label={t('dashboard.activeKcal')} icon="flame" color="#FF9800" />
      </View>
    </View>
  );
}

// MARK: - RecentWorkoutsCard
function RecentWorkoutsCard({ workouts }: { workouts: WorkoutRecord[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <SectionHeader title={t('dashboard.recentWorkouts')} icon="time" />
      {workouts.length === 0 ? (
        <EmptyNotice message={t('dashboard.noHealthData')} />
      ) : (
        workouts.map(w => <WorkoutRow key={w.id} workout={w} />)
      )}
    </View>
  );
}

function WorkoutRow({ workout }: { workout: WorkoutRecord }) {
  const { t } = useTranslation();
  const dateStr = new Date(workout.date).toLocaleDateString();
  return (
    <View style={styles.workoutRow}>
      <View style={styles.workoutIcon}>
        <Ionicons name={workoutIconName(workout.workoutType) as any} size={22} color={AppColors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.workoutType}>{workout.workoutType}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={styles.workoutDetail}>{Math.floor(workout.durationMinutes)} {t('dashboard.min')}</Text>
          <Text style={styles.workoutDetail}>{Math.floor(workout.caloriesBurned)} {t('dashboard.kcal')}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="ellipse" size={10} color={AppColors.gold} />
          <Text style={styles.workoutCoins}>+{Math.floor(workout.vitacoinsEarned)}</Text>
        </View>
        <Text style={styles.workoutDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

// MARK: - HealthTrendsCard
function HealthTrendsCard({ snapshot }: { snapshot: HealthSnapshot }) {
  const { t } = useTranslation();
  const rhrT = restingHRTrend(snapshot);
  const vo2T = vo2MaxTrend(snapshot);
  return (
    <View style={styles.card}>
      <SectionHeader title={t('dashboard.healthTrends')} icon="pulse" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TrendTile
          title={t('dashboard.restingHR')}
          value={snapshot.restingHeartRateCurrent != null ? `${Math.floor(snapshot.restingHeartRateCurrent)} ${t('dashboard.bpm')}` : '--'}
          trend={rhrT}
          lowerIsBetter={true}
          icon="heart"
          color="#F44336"
        />
        <TrendTile
          title={t('dashboard.vo2Max')}
          value={snapshot.vo2MaxCurrent != null ? snapshot.vo2MaxCurrent.toFixed(1) : '--'}
          trend={vo2T}
          lowerIsBetter={false}
          icon="fitness"
          color={AppColors.teal}
        />
      </View>
    </View>
  );
}

function TrendTile({ title, value, trend, lowerIsBetter, icon, color }: {
  title: string; value: string; trend: number | null; lowerIsBetter: boolean; icon: string; color: string;
}) {
  const { t } = useTranslation();
  const isImproving = trend != null ? (lowerIsBetter ? trend < 0 : trend > 0) : null;
  const trendText = trend != null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}` : '';
  return (
    <View style={styles.trendTile}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name={icon as any} size={14} color={color} />
        <Text style={styles.trendTitle}>{title}</Text>
      </View>
      <Text style={styles.trendValue}>{value}</Text>
      {isImproving != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={isImproving ? 'arrow-up-circle' : 'arrow-down-circle'} size={13} color={isImproving ? '#4CAF50' : '#F44336'} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: isImproving ? '#4CAF50' : '#F44336' }}>{trendText}</Text>
          <Text style={{ fontSize: 11, color: AppColors.textSecondary }}>{t('dashboard.vs30dAgo')}</Text>
        </View>
      )}
    </View>
  );
}

// MARK: - SyncButton
function SyncButton({ isSyncing, onPress }: { isSyncing: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.syncButton} onPress={onPress} disabled={isSyncing}>
      {isSyncing ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <Ionicons name="refresh" size={16} color="#000" />
      )}
      <Text style={styles.syncText}>{isSyncing ? t('dashboard.syncing') : t('dashboard.syncHealthData')}</Text>
    </TouchableOpacity>
  );
}

// MARK: - Reusable components
function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
      <Ionicons name={icon as any} size={16} color={AppColors.gold} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: AppColors.textPrimary }}>{title}</Text>
    </View>
  );
}

function StatTile({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <View style={styles.statTile}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function EmptyNotice({ message }: { message: string }) {
  return (
    <View style={styles.emptyNotice}>
      <Ionicons name="information-circle" size={18} color={AppColors.teal} />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// MARK: - Styles
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
  },
  heroCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: AppColors.gold, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroValue: { fontSize: 52, fontWeight: 'bold', color: AppColors.gold },
  heroLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 2, color: AppColors.textSecondary, marginTop: 8 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: {
    width: '47%',
    backgroundColor: 'rgba(26,26,46,0.6)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: AppColors.textPrimary },
  statLabel: { fontSize: 12, color: AppColors.textSecondary },
  workoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  workoutIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: 'rgba(0,180,216,0.15)',
    alignItems: 'center', justifyContent: 'center',
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
  syncButton: {
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
