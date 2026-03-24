// StatsHistoryModal.tsx
// Activity history modal: SVG line chart + average stats.
// Uses react-native-svg (already installed) — no additional dependencies.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppColors } from '../models/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type TimeRange = '7T' | '1M' | '3M' | '1J';
const RANGE_DAYS: Record<TimeRange, number> = { '7T': 7, '1M': 30, '3M': 90, '1J': 365 };

const SERIES_COLORS = {
  steps:    '#4CAF50',
  calories: '#FF9800',
  workout:  '#2196F3',
} as const;

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD    = 32;
const CHART_W  = SCREEN_W - H_PAD * 2;
const CHART_H  = 160;
const Y_PAD    = 12;
const X_LABEL_H = 20;

// ─── Mock data ────────────────────────────────────────────────────────────────

interface DayData {
  date:           Date;
  steps:          number;
  calories:       number;
  workoutMinutes: number;
}

function generateMockData(days: number): DayData[] {
  // Seed-stable: use index to keep values consistent across renders
  return Array.from({ length: days }, (_, i) => {
    const seed        = (i * 7 + 13) % 100;
    const isRestDay   = seed % 3 === 0;
    return {
      date:           new Date(Date.now() - (days - i) * 86_400_000),
      steps:          Math.floor(5000 + (seed / 100) * 8000),
      calories:       Math.floor(200  + (seed / 100) * 400),
      workoutMinutes: isRestDay ? 0 : Math.floor(20 + (seed / 100) * 60),
    };
  });
}

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function dataToPath(
  data: DayData[],
  key:  keyof Pick<DayData, 'steps' | 'calories' | 'workoutMinutes'>,
  minV: number,
  maxV: number,
): string {
  if (data.length < 2) return '';
  const xStep = CHART_W / (data.length - 1);
  return data
    .map((d, i) => {
      const x = i * xStep;
      const y = CHART_H - Y_PAD - ((d[key] - minV) / Math.max(maxV - minV, 1)) * (CHART_H - Y_PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function xLabelForRange(date: Date, range: TimeRange): string {
  const d = date.getDate();
  const m = date.getMonth();
  const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  if (range === '7T') return DOW[date.getDay()];
  if (range === '1M') return `${d}.`;
  if (range === '3M') return `${d}.${m + 1}`;
  return MON[m];
}

function pickXLabels(data: DayData[], range: TimeRange): Array<{ x: number; label: string }> {
  if (data.length === 0) return [];
  const xStep = CHART_W / (data.length - 1);
  const maxLabels = range === '7T' ? 7 : range === '1M' ? 8 : range === '3M' ? 9 : 12;
  const step = Math.max(1, Math.floor(data.length / maxLabels));
  return data
    .filter((_, i) => i % step === 0 || i === data.length - 1)
    .map((d, _i, arr) => {
      const origIndex = data.indexOf(d);
      return { x: origIndex * xStep, label: xLabelForRange(d.date, range) };
    });
}

// ─── Animated SVG clip rect ───────────────────────────────────────────────────

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// ─── Series toggle button ─────────────────────────────────────────────────────

function SeriesToggle({
  color,
  label,
  active,
  onPress,
}: {
  color:   string;
  label:   string;
  active:  boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.seriesBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.seriesDot, { backgroundColor: active ? color : 'rgba(255,255,255,0.2)' }]} />
      <Text style={[styles.seriesLabel, { opacity: active ? 1 : 0.4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Average stats ────────────────────────────────────────────────────────────

interface AvgStats {
  avgSteps:       number;
  avgCalories:    number;
  trainingDays:   number;
  totalDays:      number;
  avgWorkoutMins: number;
  longestStreak:  number;
  busiestWeekStr: string;
}

function computeStats(data: DayData[]): AvgStats {
  if (data.length === 0) {
    return { avgSteps: 0, avgCalories: 0, trainingDays: 0, totalDays: 0, avgWorkoutMins: 0, longestStreak: 0, busiestWeekStr: '—' };
  }
  const trainingDays   = data.filter(d => d.workoutMinutes > 0).length;
  const avgSteps       = Math.round(data.reduce((s, d) => s + d.steps, 0)    / data.length);
  const avgCalories    = Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);
  const workoutDays    = data.filter(d => d.workoutMinutes > 0);
  const avgWorkoutMins = workoutDays.length
    ? Math.round(workoutDays.reduce((s, d) => s + d.workoutMinutes, 0) / workoutDays.length)
    : 0;

  // Longest streak
  let longest = 0, cur = 0;
  data.forEach(d => {
    if (d.workoutMinutes > 0) { cur++; longest = Math.max(longest, cur); }
    else cur = 0;
  });

  // Busiest week (7-day window with most total steps)
  let bestWeekStart = data[0].date;
  let bestWeekSteps = 0;
  for (let i = 0; i <= data.length - 7; i++) {
    const weekSteps = data.slice(i, i + 7).reduce((s, d) => s + d.steps, 0);
    if (weekSteps > bestWeekSteps) {
      bestWeekSteps  = weekSteps;
      bestWeekStart  = data[i].date;
    }
  }
  const fmt = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}`;
  const end  = new Date(bestWeekStart.getTime() + 6 * 86_400_000);
  const busiestWeekStr = `${fmt(bestWeekStart)}–${fmt(end)}`;

  return { avgSteps, avgCalories, trainingDays, totalDays: data.length, avgWorkoutMins, longestStreak: longest, busiestWeekStr };
}

function StatPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statPair}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function StatsHistoryModal({ visible, onClose }: Props) {
  const [range,       setRange]       = useState<TimeRange>('7T');
  const [showSteps,   setShowSteps]   = useState(true);
  const [showCals,    setShowCals]    = useState(true);
  const [showWorkout, setShowWorkout] = useState(true);

  // Stable mock data per range (recreate on range change)
  const data = useMemo(() => generateMockData(RANGE_DAYS[range]), [range]);

  // Compute global min/max across all visible series for shared Y axis
  const allValues = useMemo(() => {
    const vals: number[] = [];
    if (showSteps)   data.forEach(d => vals.push(d.steps));
    if (showCals)    data.forEach(d => vals.push(d.calories));
    if (showWorkout) data.forEach(d => vals.push(d.workoutMinutes));
    return vals.length ? vals : [0, 1];
  }, [data, showSteps, showCals, showWorkout]);

  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);

  const xLabels = useMemo(() => pickXLabels(data, range), [data, range]);
  const stats   = useMemo(() => computeStats(data), [data]);

  // Animate chart draw on range change
  const clipW = useSharedValue(0);
  const changeRange = useCallback((r: TimeRange) => {
    setRange(r);
    cancelAnimation(clipW);
    clipW.value = 0;
    clipW.value = withTiming(CHART_W, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, []);

  useEffect(() => {
    if (visible) {
      clipW.value = 0;
      clipW.value = withTiming(CHART_W, { duration: 700, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const clipProps = useAnimatedProps(() => ({ width: clipW.value }));

  // Grid Y lines
  const gridYValues = [0, 0.25, 0.5, 0.75, 1].map(f =>
    CHART_H - Y_PAD - f * (CHART_H - Y_PAD * 2),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Aktivitätsverlauf</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Time range pills ───────────────────────────────────────── */}
        <View style={styles.rangeRow}>
          {(['7T', '1M', '3M', '1J'] as TimeRange[]).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangePill, range === r && styles.rangePillActive]}
              onPress={() => changeRange(r)}
            >
              <Text style={[styles.rangePillText, range === r && styles.rangePillTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Series toggles ─────────────────────────────────────────── */}
        <View style={styles.seriesRow}>
          <SeriesToggle color={SERIES_COLORS.steps}    label="Schritte"     active={showSteps}   onPress={() => setShowSteps(v => !v)} />
          <SeriesToggle color={SERIES_COLORS.calories} label="Kalorien"     active={showCals}    onPress={() => setShowCals(v => !v)} />
          <SeriesToggle color={SERIES_COLORS.workout}  label="Workout-Zeit" active={showWorkout} onPress={() => setShowWorkout(v => !v)} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── SVG Line Chart ─────────────────────────────────────── */}
          <View style={styles.chartWrap}>
            <Svg width={CHART_W} height={CHART_H + X_LABEL_H}>
              <Defs>
                <ClipPath id="chartClip">
                  <AnimatedRect x={0} y={0} height={CHART_H + X_LABEL_H} animatedProps={clipProps} />
                </ClipPath>
              </Defs>

              {/* Grid lines */}
              {gridYValues.map((y, i) => (
                <Line key={i} x1={0} y1={y} x2={CHART_W} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              ))}

              {/* Clipped lines */}
              {showSteps && (
                <Path
                  d={dataToPath(data, 'steps', minV, maxV)}
                  stroke={SERIES_COLORS.steps}
                  strokeWidth={2}
                  fill="none"
                  clipPath="url(#chartClip)"
                />
              )}
              {showCals && (
                <Path
                  d={dataToPath(data, 'calories', minV, maxV)}
                  stroke={SERIES_COLORS.calories}
                  strokeWidth={2}
                  fill="none"
                  clipPath="url(#chartClip)"
                />
              )}
              {showWorkout && (
                <Path
                  d={dataToPath(data, 'workoutMinutes', minV, maxV)}
                  stroke={SERIES_COLORS.workout}
                  strokeWidth={2}
                  fill="none"
                  clipPath="url(#chartClip)"
                />
              )}

              {/* Data dots (last data point only, for clarity) */}
              {data.length > 0 && (() => {
                const last = data[data.length - 1];
                const x    = CHART_W;
                const mkDot = (val: number, color: string) => {
                  const y = CHART_H - Y_PAD - ((val - minV) / Math.max(maxV - minV, 1)) * (CHART_H - Y_PAD * 2);
                  return <Circle key={color} cx={x} cy={y} r={4} fill={color} />;
                };
                return (
                  <>
                    {showSteps   && mkDot(last.steps,          SERIES_COLORS.steps)}
                    {showCals    && mkDot(last.calories,        SERIES_COLORS.calories)}
                    {showWorkout && mkDot(last.workoutMinutes,  SERIES_COLORS.workout)}
                  </>
                );
              })()}

              {/* X-axis labels */}
              {xLabels.map((l, i) => (
                <SvgText
                  key={i}
                  x={l.x}
                  y={CHART_H + X_LABEL_H - 4}
                  fontSize={9}
                  fill="rgba(255,255,255,0.4)"
                  textAnchor="middle"
                >
                  {l.label}
                </SvgText>
              ))}
            </Svg>
          </View>

          {/* ── Average Stats ──────────────────────────────────────── */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <StatPair label="Ø Schritte/Tag"  value={`${stats.avgSteps.toLocaleString('de-DE')}`} />
              <StatPair label="Ø Kalorien/Tag"  value={`${stats.avgCalories} kcal`} />
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsRow}>
              <StatPair label="Aktivste Woche"  value={stats.busiestWeekStr} />
              <StatPair label="Trainingstage"   value={`${stats.trainingDays} / ${stats.totalDays}`} />
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsRow}>
              <StatPair label="Ø Workout-Zeit"  value={`${stats.avgWorkoutMins} Min/Training`} />
              <StatPair label="Längste Streak"  value={`${stats.longestStreak} Tage`} />
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0D1A' },

  header: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  title: {
    flex: 1, fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  rangeRow: {
    flexDirection: 'row',
    gap:  8,
    paddingHorizontal: H_PAD,
    paddingVertical:   14,
  },
  rangePill: {
    paddingHorizontal: 18,
    paddingVertical:   7,
    borderRadius:      20,
    backgroundColor:   'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rangePillActive: {
    backgroundColor: AppColors.gold,
    borderColor:     AppColors.gold,
  },
  rangePillText:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  rangePillTextActive: { color: '#000' },

  seriesRow: {
    flexDirection: 'row',
    gap:  16,
    paddingHorizontal: H_PAD,
    marginBottom: 8,
  },
  seriesBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seriesDot:   { width: 8, height: 8, borderRadius: 4 },
  seriesLabel: { fontSize: 12, color: AppColors.textPrimary },

  chartWrap: {
    paddingHorizontal: H_PAD,
    marginVertical:    8,
  },

  statsCard: {
    marginHorizontal: H_PAD,
    marginTop:        8,
    backgroundColor:  '#1A1A2E',
    borderRadius:     12,
    padding:          16,
    gap:              12,
  },
  statsRow:    { flexDirection: 'row', gap: 16 },
  statsDivider:{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  statPair:    { flex: 1, gap: 4 },
  statLabel:   { fontSize: 11, color: AppColors.textSecondary },
  statValue:   { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
});
