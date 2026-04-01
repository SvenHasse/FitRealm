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
  Modal,
  Pressable,
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
import { DAILY_TARGETS } from '../utils/progressPoints';
import {
  getProteinFromEffKcal,
  mmUntilNextProtein,
  isStreakGoalReached,
} from '../utils/effKcalUtils';
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
import GameIcon from '../components/GameIcon';
import ProteinDots from '../components/ProteinDots';
import { useFriendsStore } from '../store/useFriendsStore';
import { getActiveBuffs, ActiveBuff } from '../utils/buffUtils';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const FOCUS_CONFIG: Record<FitnessFocus, { label: string; color: string }> = {
  ausdauer:     { label: 'Ausdauer',     color: '#4A90D9' },
  diaet:        { label: 'Diät',         color: '#E8A838' },
  muskelaufbau: { label: 'Muskelaufbau', color: '#C0392B' },
};

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

// ─── StatCard — compact number card with count-up animation ──────────────────

function useStatCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = 50;
    const ms = duration / steps;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3); // cubic ease-out
      setVal(Math.min(Math.round(eased * target), target));
      if (step >= steps) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [target]);
  return val;
}

function StatCard({ label, numericValue, suffix, color }: {
  label: string; numericValue: number; suffix?: string; color: string;
}) {
  const display = useStatCountUp(numericValue);
  const formatted = display.toLocaleString('de-DE') + (suffix ?? '');

  return (
    <View style={[statCardStyles.container, {
      backgroundColor: `${color}18`,
      borderColor: `${color}55`,
    }]}>
      <Text style={[statCardStyles.value, { color }]}>{formatted}</Text>
      <Text style={statCardStyles.label}>{label}</Text>
    </View>
  );
}

const statCardStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  value: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  label: { fontSize: 11, color: AppColors.textSecondary, marginTop: 3, textAlign: 'center' },
});

function getBonusTypeLabel(type: string): string {
  if (type === 'mm') return 'MM';
  if (type === 'storage') return 'Lagerkapazität';
  if (type === 'speed') return 'Produktion';
  return 'Global';
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { recentWorkouts, healthSnapshot, isSyncing, syncHealthData } = useEngineStore();
  const userProfile = useEngineStore(s => s.userProfile);
  const fitnessFocus: FitnessFocus = userProfile?.fitnessFocus ?? 'diaet';
  const health = useHealthData();
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();

  const [selectedWorkout,   setSelectedWorkout]   = useState<WorkoutRecord | null>(null);
  const [streakModalOpen,   setStreakModalOpen]    = useState(false);
  const [statsModalOpen,    setStatsModalOpen]     = useState(false);
  const [currencyInfoOpen,  setCurrencyInfoOpen]   = useState(false);

  // Tribe + active buffs
  const tribe = useFriendsStore(s => s.tribe);
  const activeBuffs = React.useMemo(
    () => getActiveBuffs(useEngineStore.getState().gameState, tribe ?? null),
    [tribe]
  );

  // Read streak + focus goal tracking from global store
  const { currentStreak, lastFocusGoalAchievedAt, streakShields, dailyEffKcal } = useGameStore();
  const { label: focusLabel, color: focusColor } = FOCUS_CONFIG[fitnessFocus];
  const effKcalProgress = Math.min(dailyEffKcal / 300, 1);
  const streakDone      = isStreakGoalReached(dailyEffKcal);
  const proteinCount    = getProteinFromEffKcal(dailyEffKcal);
  const mmToNextProtein = mmUntilNextProtein(dailyEffKcal);
  const focusGoalDoneToday = lastFocusGoalAchievedAt !== null &&
    (Date.now() - lastFocusGoalAchievedAt) < 24 * 60 * 60 * 1000;
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
        <CurrencyBar onInfoPress={() => setCurrencyInfoOpen(true)} />

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

              <View style={styles.metricsPyramid}>
                {/* Top row: EffKcal ring left, text right */}
                <View style={styles.focusRow}>
                  <DailyMetricCard
                    icon={<MaterialCommunityIcons name="arm-flex" size={18} color={focusColor} />}
                    value={Math.round(dailyEffKcal)}
                    label=""
                    unit=" MM"
                    color={focusColor}
                    progress={effKcalProgress}
                    ringSize={110}
                  />
                  <View style={styles.focusTextCol}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: focusColor,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      {focusLabel}
                    </Text>
                    <Text style={styles.focusGoalLabel}>
                      {'STREAK-ZIEL  '}
                      <Text style={{ color: AppColors.gold, fontWeight: '700' }}>300 MM</Text>
                    </Text>
                    {streakDone && (
                      <Text style={styles.streakSafeText}>✓ Streak gesichert</Text>
                    )}
                    {/* Protein-Indikator */}
                    <View style={styles.proteinRow}>
                      <ProteinDots earned={proteinCount} size={18} />
                    </View>
                    {proteinCount < 3 && mmToNextProtein !== null && mmToNextProtein > 0 && (
                      <Text style={{ fontSize: 11, color: AppColors.textSecondary }}>
                        Noch {mmToNextProtein} MM
                      </Text>
                    )}
                  </View>
                </View>

                {/* Bottom: drei feste Stat-Cards */}
                <View style={styles.secondaryMetricsRow}>
                  <StatCard
                    label="Schritte"
                    numericValue={health.stepsToday}
                    color="#4CAF50"
                  />
                  <StatCard
                    label="Verbrannte Kalorien"
                    numericValue={health.activeCaloriesToday}
                    suffix=" kcal"
                    color="#FF9800"
                  />
                  <StatCard
                    label="Workout-Zeit"
                    numericValue={health.workoutMinutesToday}
                    suffix=" min"
                    color={AppColors.teal}
                  />
                </View>
              </View>
        </View>
        </TouchableOpacity>

        {/* ── 2. Streak Counter ──────────────────────────────────────── */}
        {(() => {
          const shieldIsActive = streakShields.activeShield !== null &&
            Date.now() <= (streakShields.activeShield?.expiresAt ?? 0);
          return (
            <StreakCounter
              streak={currentStreak}
              milestone={streakMilestone}
              fitnessFocus={fitnessFocus}
              onPress={() => setStreakModalOpen(true)}
              shieldActive={shieldIsActive}
              shieldExpiresAt={shieldIsActive ? streakShields.activeShield!.expiresAt : undefined}
              shieldCount={streakShields.count}
            />
          );
        })()}

        {/* ── 2b. Aktuelle Buffs ───────────────────────────────────── */}
        {activeBuffs.length > 0 && (
          <View style={cardBackground}>
            <SectionHeader title="Aktuelle Buffs" icon="flash" />
            <View style={styles.buffGrid}>
              {activeBuffs.map((buff: ActiveBuff) => (
                <View
                  key={buff.id}
                  style={[styles.buffChip, {
                    borderColor: `${buff.sourceColor}40`,
                    backgroundColor: `${buff.sourceColor}12`,
                  }]}
                >
                  <MaterialCommunityIcons name={buff.sourceIcon as any} size={16} color={buff.sourceColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.buffChipValue, { color: buff.sourceColor }]}>
                      +{buff.bonusPercent}% {getBonusTypeLabel(buff.bonusType)}
                    </Text>
                    <Text style={styles.buffChipSource}>{buff.label}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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

      {/* ── Currency Info Modal ────────────────────────────────────── */}
      <Modal
        visible={currencyInfoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyInfoOpen(false)}
      >
        <Pressable style={infoModalStyles.backdrop} onPress={() => setCurrencyInfoOpen(false)}>
          <Pressable style={infoModalStyles.card} onPress={() => {}}>
            <Text style={infoModalStyles.title}>Wie wird MM berechnet?</Text>

            <View style={infoModalStyles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="run-fast" size={16} color="#4A90D9" />
                <Text style={infoModalStyles.sectionTitle}>Ausdauer</Text>
              </View>
              <Text style={infoModalStyles.text}>
                MM = kcal × (Minuten / 40)^0,7{'\n'}
                Belohnt lange, ausdauerbasierte Einheiten.
              </Text>
            </View>

            <View style={infoModalStyles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <GameIcon name="streak" size={16} color="#E8A838" />
                <Text style={infoModalStyles.sectionTitle}>Diät</Text>
              </View>
              <Text style={infoModalStyles.text}>
                MM = kcal{'\n'}
                Jede aktive Kalorie zählt direkt – egal wie lang das Training.
              </Text>
            </View>

            <View style={infoModalStyles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <GameIcon name="mm" size={16} />
                <Text style={infoModalStyles.sectionTitle}>Muskelaufbau</Text>
              </View>
              <Text style={infoModalStyles.text}>
                MM = kcal × (kcal / Minuten / 8)^0,7{'\n'}
                Belohnt intensive Einheiten mit hoher Kalorienrate.
              </Text>
            </View>

            <View style={infoModalStyles.divider} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <GameIcon name="protein" size={16} />
              <Text style={infoModalStyles.sectionTitle}>Protein-Schwellen</Text>
            </View>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={infoModalStyles.text}>450 MM → 1</Text>
                <GameIcon name="protein" size={13} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={infoModalStyles.text}>525 MM → 2</Text>
                <GameIcon name="protein" size={13} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={infoModalStyles.text}>600 MM → 3</Text>
                <GameIcon name="protein" size={13} />
              </View>
              <Text style={infoModalStyles.text}>Erreichst du 300 MM, ist dein Streak für heute gesichert.</Text>
            </View>

            <TouchableOpacity
              style={infoModalStyles.closeButton}
              onPress={() => setCurrencyInfoOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={infoModalStyles.closeText}>Verstanden</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  content: { padding: 16, paddingTop: 0 },

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

  metricsPyramid: { alignSelf: 'stretch' },

  // Ring (left) + label stack (right), whole block centred in the card
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 4,
  },
  focusTextCol: {
    justifyContent: 'center',
    gap: 4,
    maxWidth: 180,
  },
  proteinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
    marginBottom: 2,
  },
  proteinHint: {
    fontSize: 10,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },
  focusLabelText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  focusGoalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  streakSafeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5FAF57',
    marginTop: 4,
  },

  // Two compact StatCards below the ring row
  secondaryMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },

  buffGrid: {
    gap: 8,
  },
  buffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buffChipValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  buffChipSource: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginTop: 1,
  },

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

// ─── Currency Info Modal styles ───────────────────────────────────────────────

const infoModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.gold,
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: AppColors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
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
