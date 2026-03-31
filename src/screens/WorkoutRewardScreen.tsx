// WorkoutRewardScreen.tsx
// Workout-Auswertung mit EffKcal-basierter Belohnung.
// Animationssequenz: Header → Stats → Divider → MM-Counter → Streak-Badge → Protein → Progress → Einsammeln
// "EffKcal" erscheint NICHT in der UI — nur MM, Energie und Streak-Begriffe.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { RootStackParamList, WorkoutRewardData } from '../navigation/types';
import { useWorkoutReward } from '../hooks/useWorkoutReward';
import { getWorkoutIcon } from '../utils/workoutIcons';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import { mmUntilNextProtein } from '../utils/effKcalUtils';
import { AppColors, FitnessFocus } from '../models/types';
import WorkoutIcon from '../components/WorkoutIcon';
import WorkoutSummaryRow from '../components/WorkoutSummaryRow';
import CollectAnimation from '../components/CollectAnimation';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutReward'>;

const GOLD = AppColors.gold;
const TEAL = AppColors.teal;
const GREEN = '#4CAF50';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getFocusLabel(focus: FitnessFocus): string {
  switch (focus) {
    case 'ausdauer':     return 'Ausdauer';
    case 'diaet':        return 'Diät';
    case 'muskelaufbau': return 'Muskelaufbau';
  }
}

function hrColor(bpm: number): string {
  if (bpm < 100) return AppColors.textSecondary;
  if (bpm < 130) return '#4CAF50';
  if (bpm < 160) return '#FF9800';
  return '#F44336';
}

// ── Progress Bar ───────────────────────────────────────────────────────────────

function StreakProgressBar({ effKcal, visible }: { effKcal: number; visible: boolean }) {
  const pct = Math.min(effKcal / 300, 1);
  const width = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      width.value = withTiming(pct, { duration: 900, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const barColor = pct >= 1 ? GREEN : GOLD;
  const label    = pct >= 1 ? 'Streak-Ziel erreicht 🎯' : `${Math.round(effKcal)} / 300 MM`;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>Tages-Energie</Text>
        <Text style={[styles.progressValue, { color: pct >= 1 ? GREEN : GOLD }]}>{label}</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { backgroundColor: barColor }, barStyle]} />
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function WorkoutRewardScreen({ route, navigation }: Props) {
  const workout: WorkoutRewardData = route?.params?.workout ?? {
    id: 'fallback',
    type: 'Workout',
    dateISO: new Date().toISOString(),
    durationMinutes: 30,
    activeCalories: 200,
    steps: 3000,
    avgHeartRate: 130,
    minutesAbove70HRmax: 0,
  };

  const queueLength   = route?.params?.queueLength ?? 1;
  const queueIndex    = route?.params?.queueIndex  ?? 0;
  const isQueue       = queueLength > 1;
  const isLastInQueue = queueIndex >= queueLength - 1;

  const { phase, reward, collect, getNextWorkout } = useWorkoutReward(workout, queueIndex, queueLength);
  const fitnessFocus = useEngineStore(s => s.userProfile?.fitnessFocus ?? 'diaet');
  const iconInfo     = getWorkoutIcon(workout.type);

  const { effKcal, mmEarned, proteinEarned, streakAchieved } = reward;
  const untilNext = mmUntilNextProtein(effKcal);

  // ── Phase flags ────────────────────────────────────────────────────────────
  const showStats    = phase !== 'header';
  const showReward   = !['header', 'stats'].includes(phase);
  const showCounter  = !['header', 'stats', 'reward'].includes(phase);
  const showStreak   = !['header', 'stats', 'reward', 'counter'].includes(phase);
  const showProtein  = !['header', 'stats', 'reward', 'counter', 'streak'].includes(phase);
  const showProgress = !['header', 'stats', 'reward', 'counter', 'streak', 'protein'].includes(phase);
  const collecting   = phase === 'collecting' || phase === 'done';

  // ── MM counter ────────────────────────────────────────────────────────────
  const [displayMM, setDisplayMM] = useState(0);
  const counterRunning = useRef(false);
  useEffect(() => {
    if (phase === 'counter' && !counterRunning.current) {
      counterRunning.current = true;
      const duration = 1200;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayMM(Math.round(eased * mmEarned));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, [phase, mmEarned]);

  // ── Header animation ──────────────────────────────────────────────────────
  const headerY       = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value       = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity:   headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  // ── Divider animation ─────────────────────────────────────────────────────
  const dividerOpacity = useSharedValue(0);
  useEffect(() => {
    if (showReward) dividerOpacity.value = withTiming(1, { duration: 400 });
  }, [showReward]);
  const dividerStyle = useAnimatedStyle(() => ({ opacity: dividerOpacity.value }));

  // ── MM card animation ─────────────────────────────────────────────────────
  const mmScale   = useSharedValue(0.7);
  const mmOpacity = useSharedValue(0);
  useEffect(() => {
    if (showCounter) {
      mmOpacity.value = withTiming(1, { duration: 300 });
      mmScale.value   = withSpring(1, { damping: 12, stiffness: 160 });
    }
  }, [showCounter]);
  const mmCardStyle = useAnimatedStyle(() => ({
    opacity:   mmOpacity.value,
    transform: [{ scale: mmScale.value }],
  }));

  // ── Streak badge animation ────────────────────────────────────────────────
  const streakOpacity = useSharedValue(0);
  const streakScale   = useSharedValue(0.5);
  const streakBounce  = useSharedValue(1);
  useEffect(() => {
    if (showStreak) {
      streakOpacity.value = withTiming(1, { duration: 250 });
      streakScale.value   = withSequence(
        withSpring(1.18, { damping: 6, stiffness: 200 }),
        withSpring(0.95, { damping: 8, stiffness: 200 }),
        withSpring(1.0,  { damping: 10, stiffness: 200 }),
      );
      if (streakAchieved) {
        setTimeout(() => {
          streakBounce.value = withRepeat(
            withSequence(
              withTiming(1.04, { duration: 500 }),
              withTiming(1.00, { duration: 500 }),
            ),
            -1, false,
          );
        }, 600);
      }
    }
  }, [showStreak]);
  const streakStyle = useAnimatedStyle(() => ({
    opacity:   streakOpacity.value,
    transform: [{ scale: streakScale.value * streakBounce.value }],
  }));

  // ── Collect button animation ───────────────────────────────────────────────
  const btnScale   = useSharedValue(1);
  const btnOpacity = useSharedValue(0);
  useEffect(() => {
    if (phase === 'ready') {
      btnOpacity.value = withTiming(1, { duration: 300 });
      btnScale.value   = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 700 }),
          withTiming(1.00, { duration: 700 }),
        ),
        -1, false,
      );
    }
    if (phase === 'collecting' || phase === 'done') {
      btnOpacity.value = withTiming(0.3, { duration: 200 });
    }
  }, [phase]);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    opacity:   btnOpacity.value,
  }));

  // ── Collect handler ────────────────────────────────────────────────────────
  const handleCollect = async () => {
    if (phase !== 'ready') return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    await collect();
    setTimeout(() => {
      const next = getNextWorkout();
      if (next) {
        navigation.replace('WorkoutReward', {
          workout:     next.workout,
          queueLength: next.queueLength,
          queueIndex:  next.queueIndex,
        });
      } else {
        navigation.goBack();
      }
    }, 950);
  };

  // ── Date string ────────────────────────────────────────────────────────────
  const workoutDate = new Date(workout.dateISO);
  const isToday     = new Date().toDateString() === workoutDate.toDateString();
  const dateStr     = isToday
    ? `Heute, ${workoutDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : workoutDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const getButtonText = () => {
    if (phase === 'collecting') return '...';
    if (phase !== 'ready')      return 'Berechne...';
    if (isQueue && !isLastInQueue) return 'Einsammeln & Weiter →';
    return 'Einsammeln 💪';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Queue Pill ──────────────────────────────────────────────────── */}
        {isQueue && (
          <View style={styles.queuePillRow}>
            <View style={styles.queuePill}>
              <Ionicons name="layers" size={14} color={GOLD} />
              <Text style={styles.queuePillText}>{queueIndex + 1} / {queueLength} Workouts</Text>
            </View>
          </View>
        )}

        {/* ── 1. Header ───────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={[styles.headerIconWrap, { backgroundColor: `${iconInfo.color}22` }]}>
            <WorkoutIcon workoutType={workout.type} size={52} />
          </View>
          <Text style={styles.headerType}>{workout.type}</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </Animated.View>

        {/* ── 2. Workout Stats ────────────────────────────────────────────── */}
        {showStats && (
          <View style={styles.card}>
            <WorkoutSummaryRow
              icon={<Ionicons name="time-outline" size={18} color={TEAL} />}
              label="Dauer"
              value={`${workout.durationMinutes} Min`}
              delayMs={0}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="fire" size={18} color="#FF9800" />}
              label="Verbrannte Kalorien"
              value={`${workout.activeCalories} kcal`}
              delayMs={120}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="shoe-print" size={18} color={GREEN} />}
              label="Schritte"
              value={workout.steps.toLocaleString('de-DE')}
              delayMs={240}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="heart-pulse" size={18} color={hrColor(workout.avgHeartRate)} />}
              label="Ø Herzfrequenz"
              value={`${workout.avgHeartRate} bpm`}
              valueColor={hrColor(workout.avgHeartRate)}
              delayMs={360}
            />
          </View>
        )}

        {/* ── Divider ─────────────────────────────────────────────────────── */}
        {showReward && (
          <Animated.View style={[styles.dividerRow, dividerStyle]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEINE BELOHNUNG</Text>
            <View style={styles.dividerLine} />
          </Animated.View>
        )}

        {/* ── 3. MM Counter Card ──────────────────────────────────────────── */}
        {showCounter && (
          <Animated.View style={[styles.mmCard, mmCardStyle]}>
            <Text style={styles.mmFocusLabel}>Fokus: {getFocusLabel(fitnessFocus)}</Text>
            <View style={styles.mmRow}>
              <MaterialCommunityIcons name="arm-flex" size={36} color={GOLD} style={{ marginRight: 10 }} />
              <Text style={styles.mmCounter}>{displayMM}</Text>
              <Text style={styles.mmUnit}> MM</Text>
            </View>
            <Text style={styles.mmSubLabel}>Muskelmasse verdient</Text>
          </Animated.View>
        )}

        {/* ── 4. Streak Badge ─────────────────────────────────────────────── */}
        {showStreak && (
          <Animated.View style={[
            styles.streakBadge,
            streakAchieved ? styles.streakBadgeGreen : styles.streakBadgeMuted,
            streakStyle,
          ]}>
            <Text style={styles.streakIcon}>{streakAchieved ? '🔥' : '⚡'}</Text>
            <View style={styles.streakTextWrap}>
              <Text style={[styles.streakTitle, { color: streakAchieved ? GREEN : AppColors.textSecondary }]}>
                {streakAchieved ? 'Streak-Ziel erfüllt!' : 'Weiter so!'}
              </Text>
              <Text style={styles.streakSub}>
                {streakAchieved
                  ? 'Heute läuft deine Streak weiter 🎯'
                  : `Noch ${Math.max(0, Math.ceil(300 - effKcal))} MM bis zum Streak-Ziel`}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── 5. Protein ──────────────────────────────────────────────────── */}
        {showProtein && (
          <View style={styles.card}>
            {proteinEarned > 0 ? (
              <Text style={styles.proteinHint}>🧬 {proteinEarned} Protein verdient</Text>
            ) : untilNext !== null && untilNext > 0 ? (
              <Text style={styles.proteinHint}>Noch {untilNext} MM bis zum nächsten Protein</Text>
            ) : null}
          </View>
        )}

        {/* ── 6. Progress Bar ─────────────────────────────────────────────── */}
        {showProgress && (
          <View style={styles.card}>
            <StreakProgressBar effKcal={effKcal} visible={showProgress} />
          </View>
        )}

        <View style={{ height: 130 }} />
      </ScrollView>

      {/* ── Collect Button ────────────────────────────────────────────────── */}
      <View style={styles.btnContainer}>
        <Animated.View style={btnStyle}>
          <TouchableOpacity
            style={[styles.collectBtn, phase !== 'ready' && styles.collectBtnDisabled]}
            onPress={handleCollect}
            disabled={phase !== 'ready'}
            activeOpacity={0.85}
          >
            <Text style={[styles.collectText, phase !== 'ready' && styles.collectTextDisabled]}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Collect Overlay ───────────────────────────────────────────────── */}
      <CollectAnimation collecting={collecting} totalMuskelmasse={mmEarned} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: AppColors.background },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingTop: 12 },

  // Queue pill
  queuePillRow: { alignItems: 'center', marginBottom: 8 },
  queuePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: `${GOLD}20`, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: `${GOLD}40`,
  },
  queuePillText: { fontSize: 13, fontWeight: '700', color: GOLD },

  // Header
  header: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
  headerIconWrap: {
    width: 88, height: 88, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  headerType: { fontSize: 28, fontWeight: 'bold', color: AppColors.textPrimary },
  headerDate: { fontSize: 14, color: AppColors.textSecondary, marginTop: 5 },

  // Card
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: `${GOLD}35` },
  dividerText: { fontSize: 12, fontWeight: '800', color: GOLD, letterSpacing: 1.5 },

  // MM Counter Card
  mmCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 24,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${GOLD}30`,
  },
  mmFocusLabel: {
    fontSize: 13, color: AppColors.textSecondary, fontWeight: '600',
    marginBottom: 12, letterSpacing: 0.5,
  },
  mmRow: { flexDirection: 'row', alignItems: 'flex-end' },
  mmCounter: {
    fontSize: 72, fontWeight: '900', color: GOLD,
    lineHeight: 78,
    textShadowColor: `${GOLD}60`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  mmUnit: {
    fontSize: 28, fontWeight: '700', color: GOLD,
    lineHeight: 78, opacity: 0.85,
  },
  mmSubLabel: {
    fontSize: 14, color: AppColors.textSecondary,
    marginTop: 10, fontWeight: '500',
  },

  // Streak badge
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1,
  },
  streakBadgeGreen: {
    backgroundColor: `${GREEN}18`,
    borderColor: `${GREEN}40`,
  },
  streakBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  streakIcon: { fontSize: 30 },
  streakTextWrap: { flex: 1 },
  streakTitle: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  streakSub:   { fontSize: 13, color: AppColors.textSecondary },

  // Protein
  proteinHint: { fontSize: 13, color: AppColors.textSecondary, textAlign: 'center', paddingVertical: 8 },

  // Progress bar
  progressWrap: { gap: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:  { fontSize: 14, color: AppColors.textSecondary, fontWeight: '600' },
  progressValue:  { fontSize: 13, fontWeight: '700' },
  progressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },

  // Collect button
  btnContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: AppColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  collectBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnDisabled: { backgroundColor: 'rgba(245,166,35,0.25)' },
  collectText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  collectTextDisabled: { color: 'rgba(0,0,0,0.4)' },
});
