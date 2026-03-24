// WorkoutRewardScreen.tsx
// Full-screen modal: workout stats → reward calculation → "Einsammeln" collect flow.

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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { RootStackParamList, WorkoutRewardData } from '../navigation/types';
import { useWorkoutReward } from '../hooks/useWorkoutReward';
import { hrMultiplier, formatGrams } from '../utils/currencyCalculator';
import { getWorkoutIcon } from '../utils/workoutIcons';
import { AppColors } from '../models/types';
import WorkoutIcon from '../components/WorkoutIcon';
import WorkoutSummaryRow from '../components/WorkoutSummaryRow';
import CurrencyCalculationRow from '../components/CurrencyCalculationRow';
import TotalRewardSummary from '../components/TotalRewardSummary';
import CollectAnimation from '../components/CollectAnimation';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutReward'>;

const GOLD = AppColors.gold;
const TEAL = AppColors.teal;

function hrColor(bpm: number): string {
  if (bpm < 100) return AppColors.textSecondary;
  if (bpm < 130) return '#4CAF50';
  if (bpm < 160) return '#FF9800';
  return '#F44336';
}

export default function WorkoutRewardScreen({ route, navigation }: Props) {
  // Safe fallback if params are somehow undefined
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

  const { phase, reward, collect } = useWorkoutReward(workout);
  const iconInfo = getWorkoutIcon(workout.type);

  // ── Animations ────────────────────────────────────────────────────────────
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

  const dividerOpacity = useSharedValue(0);
  useEffect(() => {
    if (['divider', 'calculations', 'total', 'ready', 'collecting', 'done'].includes(phase)) {
      dividerOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [phase]);
  const dividerStyle = useAnimatedStyle(() => ({ opacity: dividerOpacity.value }));

  const btnScale = useSharedValue(1);
  const btnOpacity = useSharedValue(1);
  useEffect(() => {
    if (phase === 'ready') {
      btnOpacity.value = 1;
      // withRepeat+withSequence is worklet-safe — no JS closures in callbacks
      btnScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 600 }),
          withTiming(1.0,  { duration: 600 }),
        ),
        -1,   // infinite
        false,
      );
    }
    if (phase === 'collecting' || phase === 'done') {
      btnOpacity.value = withTiming(0.4, { duration: 200 });
    }
  }, [phase]);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
    opacity: btnOpacity.value,
  }));

  // ── Phase flags ───────────────────────────────────────────────────────────
  const showSummary = phase !== 'header';
  const showDivider = ['divider', 'calculations', 'total', 'ready', 'collecting', 'done'].includes(phase);
  const showCalcs   = ['calculations', 'total', 'ready', 'collecting', 'done'].includes(phase);
  const showTotal   = ['total', 'ready', 'collecting', 'done'].includes(phase);
  const collecting  = phase === 'collecting' || phase === 'done';

  const workoutDate = new Date(workout.dateISO);
  const isToday = new Date().toDateString() === workoutDate.toDateString();
  const dateStr = isToday
    ? `Heute, ${workoutDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`
    : workoutDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  const mult = hrMultiplier(workout.avgHeartRate);

  const handleCollect = async () => {
    if (phase !== 'ready') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {
      // Haptics not available in Simulator — ignore
    }
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
          <View style={[styles.headerIconWrap, { backgroundColor: `${iconInfo.color}20` }]}>
            <WorkoutIcon workoutType={workout.type} size={52} />
          </View>
          <Text style={styles.headerType}>{workout.type}</Text>
          <Text style={styles.headerDate}>{dateStr}</Text>
        </Animated.View>

        {/* ── 2. Workout Summary ─────────────────────────────────────── */}
        {showSummary && (
          <View style={styles.card}>
            <WorkoutSummaryRow
              icon={<Ionicons name="time-outline" size={18} color={TEAL} />}
              label="Dauer"
              value={`${workout.durationMinutes} Minuten`}
              delayMs={0}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="fire" size={18} color="#FF9800" />}
              label="Kalorien"
              value={`${workout.activeCalories} kcal`}
              delayMs={150}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="shoe-print" size={18} color="#4CAF50" />}
              label="Schritte"
              value={workout.steps.toLocaleString('de-DE')}
              delayMs={300}
            />
            <WorkoutSummaryRow
              icon={<MaterialCommunityIcons name="heart-pulse" size={18} color={hrColor(workout.avgHeartRate)} />}
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
              icon={<Ionicons name="time-outline" size={16} color={TEAL} />}
              title={`${workout.durationMinutes} Min Workout`}
              formula={`${workout.durationMinutes} × 2g × HR-Multiplikator (×${mult.toFixed(1)})`}
              finalValue={reward.muskelmassFromDuration}
              unit="g"
              valueColor={GOLD}
              delayMs={0}
            />
            <CurrencyCalculationRow
              icon={<MaterialCommunityIcons name="fire" size={16} color="#FF9800" />}
              title={`${workout.activeCalories} kcal`}
              formula={`${workout.activeCalories} ÷ 20`}
              finalValue={reward.muskelmassFromCalories}
              unit="g"
              valueColor={GOLD}
              delayMs={200}
            />
            <CurrencyCalculationRow
              icon={<MaterialCommunityIcons name="shoe-print" size={16} color="#4CAF50" />}
              title={`${workout.steps.toLocaleString('de-DE')} Schritte`}
              formula={`${(workout.steps / 1000).toFixed(1)} × 3g`}
              finalValue={reward.muskelmassFromSteps}
              unit="g"
              valueColor={GOLD}
              delayMs={400}
            />
            {reward.protein > 0 && (
              <CurrencyCalculationRow
                icon={<MaterialCommunityIcons name="diamond-stone" size={16} color={TEAL} />}
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

        {/* ── 5. Total ───────────────────────────────────────────────── */}
        <TotalRewardSummary
          totalMuskelmasse={reward.totalMuskelmasse}
          protein={reward.protein}
          streakToken={reward.streakToken}
          visible={showTotal}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 6. Collect Button ──────────────────────────────────────── */}
      <View style={styles.btnContainer}>
        <Animated.View style={btnStyle}>
          <TouchableOpacity
            style={[styles.collectBtn, phase !== 'ready' && styles.collectBtnDisabled]}
            onPress={handleCollect}
            disabled={phase !== 'ready'}
            activeOpacity={0.85}
          >
            <Text style={styles.collectText}>
              {phase === 'ready'
                ? 'Einsammeln'
                : phase === 'collecting'
                ? '...'
                : 'Berechne...'}
            </Text>
            {phase === 'ready' && (
              <MaterialCommunityIcons name="arm-flex" size={20} color="#000" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* ── Collect overlay ────────────────────────────────────────── */}
      <CollectAnimation collecting={collecting} totalMuskelmasse={reward.totalMuskelmasse} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 12 },

  header: { alignItems: 'center', paddingVertical: 28, marginBottom: 20 },
  headerIconWrap: {
    width: 96, height: 96, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  headerType: { fontSize: 30, fontWeight: 'bold', color: AppColors.textPrimary },
  headerDate: { fontSize: 14, color: AppColors.textSecondary, marginTop: 6 },

  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: `${GOLD}40` },
  dividerText: { fontSize: 14, fontWeight: '700', color: GOLD, letterSpacing: 1 },

  btnContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnDisabled: { backgroundColor: 'rgba(245,166,35,0.4)' },
  collectText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
});
