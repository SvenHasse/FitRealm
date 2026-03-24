// WorkoutRewardScreen.tsx
// Full-screen modal: workout stats → reward calculation → "Einsammeln" collect flow.
// Opened via navigation.navigate('WorkoutReward', { workout }) from Dashboard.

import React, { useEffect } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

import { RootStackParamList } from '../navigation/types';
import { useWorkoutReward } from '../hooks/useWorkoutReward';
import { hrMultiplier, formatGrams } from '../utils/currencyCalculator';
import { AppColors } from '../models/types';
import WorkoutSummaryRow from '../components/WorkoutSummaryRow';
import CurrencyCalculationRow from '../components/CurrencyCalculationRow';
import TotalRewardSummary from '../components/TotalRewardSummary';
import CollectAnimation from '../components/CollectAnimation';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutReward'>;

const GOLD = AppColors.gold;
const TEAL = AppColors.teal;

// Heart rate color coding
function hrColor(bpm: number): string {
  if (bpm < 100) return AppColors.textSecondary;
  if (bpm < 130) return '#4CAF50';
  if (bpm < 160) return '#FF9800';
  return '#F44336';
}

function workoutEmoji(type: string): string {
  switch (type.toLowerCase()) {
    case 'laufen':
    case 'running': return '🏃';
    case 'radfahren':
    case 'cycling': return '🚴';
    case 'schwimmen':
    case 'swimming': return '🏊';
    case 'krafttraining':
    case 'strength training': return '🏋️';
    case 'wandern':
    case 'hiking': return '🥾';
    case 'yoga': return '🧘';
    default: return '💪';
  }
}

export default function WorkoutRewardScreen({ route, navigation }: Props) {
  const { workout } = route.params;
  const { phase, reward, collect } = useWorkoutReward(workout);

  // Header slide-in from top
  const headerY = useSharedValue(-60);
  const headerOpacity = useSharedValue(0);
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400 });
    headerY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  // Divider fade-in
  const dividerOpacity = useSharedValue(0);
  useEffect(() => {
    if (phase === 'divider' || phase === 'calculations' || phase === 'total' || phase === 'ready') {
      dividerOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [phase]);
  const dividerStyle = useAnimatedStyle(() => ({ opacity: dividerOpacity.value }));

  // Button pulse
  const btnScale = useSharedValue(1);
  useEffect(() => {
    if (phase === 'ready') {
      const pulse = () => {
        btnScale.value = withTiming(1.03, { duration: 600 }, () => {
          btnScale.value = withTiming(1.0, { duration: 600 }, pulse);
        });
      };
      pulse();
    }
  }, [phase]);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    opacity: phase === 'collecting' || phase === 'done' ? 0.4 : 1,
  }));

  const showSummary = phase !== 'header';
  const showDivider = ['divider', 'calculations', 'total', 'ready', 'collecting', 'done'].includes(phase);
  const showCalcs = ['calculations', 'total', 'ready', 'collecting', 'done'].includes(phase);
  const showTotal = ['total', 'ready', 'collecting', 'done'].includes(phase);
  const collecting = phase === 'collecting' || phase === 'done';

  const workoutDate = new Date(workout.dateISO);
  const isToday = new Date().toDateString() === workoutDate.toDateString();
  const dateStr = isToday
    ? `Heute, ${workoutDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : workoutDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const mult = hrMultiplier(workout.avgHeartRate);

  const handleCollect = async () => {
    if (phase !== 'ready') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await collect();
    setTimeout(() => navigation.goBack(), 950);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Header ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.headerEmoji}>{workoutEmoji(workout.type)}</Text>
          <Text style={styles.headerType}>{workout.type}</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </Animated.View>

        {/* ── 2. Workout Summary ─────────────────────────────────────── */}
        {showSummary && (
          <View style={styles.card}>
            <WorkoutSummaryRow
              emoji="⏱️"
              label="Dauer"
              value={`${workout.durationMinutes} Minuten`}
              delayMs={0}
            />
            <WorkoutSummaryRow
              emoji="🔥"
              label="Kalorien"
              value={`${workout.activeCalories} kcal`}
              delayMs={150}
            />
            <WorkoutSummaryRow
              emoji="👣"
              label="Schritte"
              value={workout.steps.toLocaleString('de-DE')}
              delayMs={300}
            />
            <WorkoutSummaryRow
              emoji="❤️"
              label="Ø Herzfrequenz"
              value={`${workout.avgHeartRate} bpm`}
              valueColor={hrColor(workout.avgHeartRate)}
              delayMs={450}
            />
          </View>
        )}

        {/* ── 3. Divider ─────────────────────────────────────────────── */}
        {showDivider && (
          <Animated.View style={[styles.dividerRow, dividerStyle]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Deine Belohnung</Text>
            <View style={styles.dividerLine} />
          </Animated.View>
        )}

        {/* ── 4. Currency Calculations ───────────────────────────────── */}
        {showCalcs && (
          <View style={styles.card}>
            <CurrencyCalculationRow
              emoji="⏱️"
              title={`${workout.durationMinutes} Min Workout`}
              formula={`${workout.durationMinutes} × 2g × HR-Multiplikator (×${mult.toFixed(1)})`}
              finalValue={reward.muskelmassFromDuration}
              unit="g"
              valueColor={GOLD}
              delayMs={0}
            />
            <CurrencyCalculationRow
              emoji="🔥"
              title={`${workout.activeCalories} kcal`}
              formula={`${workout.activeCalories} ÷ 20`}
              finalValue={reward.muskelmassFromCalories}
              unit="g"
              valueColor={GOLD}
              delayMs={200}
            />
            <CurrencyCalculationRow
              emoji="👣"
              title={`${workout.steps.toLocaleString('de-DE')} Schritte`}
              formula={`${(workout.steps / 1000).toFixed(1)} × 3g`}
              finalValue={reward.muskelmassFromSteps}
              unit="g"
              valueColor={GOLD}
              delayMs={400}
            />
            {reward.protein > 0 && (
              <CurrencyCalculationRow
                emoji="💎"
                title={`${workout.minutesAbove70HRmax} Min bei ≥70% HRmax`}
                formula={`Basis (20 Min) + Extra (${workout.minutesAbove70HRmax - 20} Min)`}
                finalValue={reward.protein}
                unit=" Protein"
                valueColor={TEAL}
                delayMs={600}
              />
            )}
          </View>
        )}

        {/* ── 5. Total Summary ───────────────────────────────────────── */}
        <TotalRewardSummary
          totalMuskelmasse={reward.totalMuskelmasse}
          protein={reward.protein}
          streakToken={reward.streakToken}
          visible={showTotal}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 6. Collect Button (fixed bottom) ───────────────────────── */}
      <View style={styles.btnContainer}>
        <Animated.View style={btnStyle}>
          <TouchableOpacity
            style={[styles.collectBtn, phase !== 'ready' && styles.collectBtnDisabled]}
            onPress={handleCollect}
            disabled={phase !== 'ready'}
            activeOpacity={0.85}
          >
            <Text style={styles.collectText}>
              {phase === 'ready' ? 'Einsammeln 💪' : phase === 'collecting' ? '...' : 'Berechne...'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Collect animation overlay ──────────────────────────────── */}
      <CollectAnimation collecting={collecting} totalMuskelmasse={reward.totalMuskelmasse} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },

  header: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 20,
  },
  headerEmoji: { fontSize: 64, marginBottom: 8 },
  headerType: { fontSize: 30, fontWeight: 'bold', color: AppColors.textPrimary },
  headerDate: { fontSize: 14, color: AppColors.textSecondary, marginTop: 6 },

  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${GOLD}40`,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },

  btnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    backgroundColor: AppColors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  collectBtn: {
    backgroundColor: GOLD,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  collectBtnDisabled: {
    backgroundColor: 'rgba(245,166,35,0.4)',
  },
  collectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
