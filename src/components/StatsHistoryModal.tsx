// StatsHistoryModal.tsx
// Activity history modal with:
//   • Entry animations (staggered slide-up) on open
//   • Collapsible chart cards (state persisted across opens)
//   • 3 individual LineCharts with interactive pointer tooltips

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';
import { AppColors } from '../models/types';
import { useWorkoutStore, Workout } from '../store/workoutStore';
import { useGameStore as useEngineStore } from '../store/useGameStore';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Constants ────────────────────────────────────────────────────────────────

type TimeRange = '7T' | '1M' | '3M' | '1J';
const RANGE_DAYS: Record<TimeRange, number> = { '7T': 7, '1M': 30, '3M': 90, '1J': 365 };
const COLLAPSE_KEY = '@fitrealm:stats_collapsed_v1';

const C = { steps: '#4CAF50', calories: '#FF9800', workout: '#2196F3' } as const;

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_MARGIN  = 16;
const CARD_PADDING = 16;
const Y_AXIS_W     = 44;
const CHART_W      = SCREEN_W - CARD_MARGIN * 2 - CARD_PADDING * 2 - Y_AXIS_W;

// ─── Data types & generation ──────────────────────────────────────────────────

interface DayData { date: Date; steps: number; calories: number; workoutMinutes: number; }

function generateMockData(days: number): DayData[] {
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => {
    const date   = new Date(now - (days - 1 - i) * 86_400_000);
    // Seed by absolute day number so the same calendar day always gives the same value,
    // regardless of which range is selected (7T last 7 days == last 7 days of 1M).
    const dayNum = Math.floor(date.getTime() / 86_400_000);
    const seed   = (dayNum * 7 + 13) % 100;
    const isRest = seed % 4 === 0;
    return {
      date,
      steps:          isRest ? Math.floor(2000 + (seed / 100) * 3000) : Math.floor(5000 + (seed / 100) * 8000),
      calories:       isRest ? Math.floor(100  + (seed / 100) * 150)  : Math.floor(250  + (seed / 100) * 350),
      workoutMinutes: isRest ? 0 : Math.floor(25 + (seed / 100) * 50),
    };
  });
}

function buildRealData(workouts: Workout[], days: number): DayData[] {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const dayStart = new Date(now.getTime() - (days - 1 - i) * 86_400_000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const dayWorkouts = workouts.filter(w => {
      const d = new Date(w.date);
      return d >= dayStart && d < dayEnd;
    });
    return {
      date:           new Date(now.getTime() - (days - 1 - i) * 86_400_000),
      steps:          dayWorkouts.reduce((s, w) => s + w.steps, 0),
      calories:       dayWorkouts.reduce((s, w) => s + w.activeCalories, 0),
      workoutMinutes: dayWorkouts.reduce((s, w) => s + w.durationMinutes, 0),
    };
  });
}

// ─── X-axis helpers ───────────────────────────────────────────────────────────

const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MON = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function xLabel(date: Date, range: TimeRange): string {
  if (range === '7T') return DOW[date.getDay()];
  if (range === '1M') return `${date.getDate()}.`;
  if (range === '3M') return `${date.getDate()}.${date.getMonth() + 1}`;
  return MON[date.getMonth()];
}

function shouldShowLabel(i: number, total: number, range: TimeRange): boolean {
  if (range === '7T') return true;
  if (range === '1M') return i % 5 === 0 || i === total - 1;
  if (range === '3M') return i % 15 === 0 || i === total - 1;
  return i % 30 === 0 || i === total - 1;
}

interface ChartPoint { value: number; label: string; dateStr: string; }

function buildChartData(
  data: DayData[], key: 'steps' | 'calories' | 'workoutMinutes', range: TimeRange,
): ChartPoint[] {
  return data.map((d, i) => ({
    value:   d[key],
    label:   shouldShowLabel(i, data.length, range) ? xLabel(d.date, range) : '',
    dateStr: d.date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
  }));
}

// ─── Y-axis formatters ────────────────────────────────────────────────────────

type MetricType = 'steps' | 'calories' | 'minutes';

function formatYLabel(type: MetricType) {
  return (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
    if (type === 'steps')    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : `${num}`;
    if (type === 'calories') return `${num}`;
    if (type === 'minutes')  return `${num}m`;
    return value;
  };
}

function formatTooltipValue(type: MetricType, value: number): string {
  if (type === 'steps')    return value.toLocaleString('de-DE');
  if (type === 'calories') return `${value} kcal`;
  if (type === 'minutes')  return `${value} min`;
  return `${value}`;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

interface Stats { avgSteps: number; avgCalories: number; avgWorkoutMins: number; trainingDays: number; totalDays: number; longestStreak: number; }

function computeStats(data: DayData[]): Stats {
  if (!data.length) return { avgSteps: 0, avgCalories: 0, avgWorkoutMins: 0, trainingDays: 0, totalDays: 0, longestStreak: 0 };
  const trainingDays   = data.filter(d => d.workoutMinutes > 0).length;
  const avgSteps       = Math.round(data.reduce((s, d) => s + d.steps, 0)    / data.length);
  const avgCalories    = Math.round(data.reduce((s, d) => s + d.calories, 0) / data.length);
  const workoutDays    = data.filter(d => d.workoutMinutes > 0);
  const avgWorkoutMins = workoutDays.length ? Math.round(workoutDays.reduce((s, d) => s + d.workoutMinutes, 0) / workoutDays.length) : 0;
  let longest = 0, cur = 0;
  data.forEach(d => { if (d.workoutMinutes > 0) { cur++; longest = Math.max(longest, cur); } else cur = 0; });
  return { avgSteps, avgCalories, avgWorkoutMins, trainingDays, totalDays: data.length, longestStreak: longest };
}

// ─── Entry animation wrapper ──────────────────────────────────────────────────

function FadeSlideCard({
  children, delay, triggerKey, style,
}: {
  children: React.ReactNode;
  delay: number;
  triggerKey: number;
  style?: object;
}) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    opacity.value    = 0;
    translateY.value = 28;
    opacity.value    = withDelay(delay, withTiming(1,  { duration: 380, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0,  { duration: 380, easing: Easing.out(Easing.cubic) }));
  }, [triggerKey]);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ value, date, color }: { value: string; date: string; color: string }) {
  return (
    <View style={[styles.tooltip, { borderColor: `${color}50` }]}>
      <Text style={[styles.tooltipValue, { color }]}>{value}</Text>
      <Text style={styles.tooltipDate}>{date}</Text>
    </View>
  );
}

// ─── Collapsible chart card ───────────────────────────────────────────────────

interface ChartCardProps {
  icon: string; title: string; avgLabel: string;
  accentColor: string; chartData: ChartPoint[]; metricType: MetricType;
  collapsed: boolean; onToggle: () => void;
}

function ChartCard({ icon, title, avgLabel, accentColor, chartData, metricType, collapsed, onToggle }: ChartCardProps) {
  // Chevron rotation
  const chevronRot = useSharedValue(collapsed ? 0 : 1);
  useEffect(() => {
    chevronRot.value = withSpring(collapsed ? 0 : 1, { damping: 14, stiffness: 180 });
  }, [collapsed]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRot.value * 180}deg` }],
  }));

  return (
    <View style={styles.chartCard}>
      {/* Header — tappable to collapse */}
      <TouchableOpacity style={styles.chartHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.chartIconWrap, { backgroundColor: `${accentColor}22` }]}>
          <MaterialCommunityIcons name={icon as any} size={14} color={accentColor} />
        </View>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={{ flex: 1 }} />
        {!collapsed && (
          <Text style={[styles.chartAvg, { color: accentColor }]}>{avgLabel}</Text>
        )}
        <Animated.View style={[chevronStyle, { marginLeft: 8 }]}>
          <Ionicons name="chevron-up" size={16} color="rgba(255,255,255,0.35)" />
        </Animated.View>
      </TouchableOpacity>

      {/* Chart body — hidden when collapsed */}
      {!collapsed && (
        <View style={styles.chartBody}>
          <LineChart
            data={chartData}
            width={CHART_W}
            height={150}
            curved
            thickness={2.5}
            color={accentColor}
            areaChart
            startFillColor={accentColor}
            endFillColor="transparent"
            startOpacity={0.22}
            endOpacity={0}
            dataPointsRadius={4}
            dataPointsColor={accentColor}
            hideDataPoints={false}
            yAxisColor="transparent"
            xAxisColor="rgba(255,255,255,0.1)"
            yAxisTextStyle={styles.yAxisText}
            xAxisLabelTextStyle={styles.xAxisText}
            rulesColor="rgba(255,255,255,0.05)"
            rulesType="solid"
            noOfSections={4}
            backgroundColor="transparent"
            yAxisLabelWidth={Y_AXIS_W}
            formatYLabel={formatYLabel(metricType)}
            showVerticalLines
            verticalLinesColor="rgba(255,255,255,0.03)"
            pointerConfig={{
              pointerStripHeight: 150,
              pointerStripColor: `${accentColor}40`,
              pointerStripWidth: 1,
              pointerColor: accentColor,
              radius: 6,
              pointerLabelWidth: 110,
              pointerLabelHeight: 54,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: ChartPoint[]) => (
                <Tooltip
                  value={formatTooltipValue(metricType, items[0].value)}
                  date={(items[0] as any).dateStr ?? ''}
                  color={accentColor}
                />
              ),
            }}
          />
        </View>
      )}
    </View>
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────

const RANGE_LABEL: Record<TimeRange, string> = {
  '7T': 'Letzte 7 Tage', '1M': 'Letzter Monat', '3M': 'Letzte 3 Monate', '1J': 'Letztes Jahr',
};

function SummaryCard({ stats, range }: { stats: Stats; range: TimeRange }) {
  const rows = [
    { label: 'Ø Schritte/Tag',    value: stats.avgSteps.toLocaleString('de-DE'),          icon: 'shoe-print' },
    { label: 'Ø Kalorien/Tag',    value: `${stats.avgCalories} kcal`,                     icon: 'fire' },
    { label: 'Ø Workout/Einheit', value: `${stats.avgWorkoutMins} min`,                   icon: 'timer-outline' },
    { label: 'Trainingstage',     value: `${stats.trainingDays} / ${stats.totalDays}`,    icon: 'calendar-check' },
    { label: 'Längste Streak',    value: `${stats.longestStreak} Tage`,                   icon: 'fire' },
  ];
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryLine} />
        <Text style={styles.summaryTitle}>Zusammenfassung  ·  {RANGE_LABEL[range]}</Text>
        <View style={styles.summaryLine} />
      </View>
      <View style={styles.summaryGrid}>
        {rows.map((row, i) => (
          <View key={i} style={styles.summaryItem}>
            <MaterialCommunityIcons name={row.icon as any} size={14} color={AppColors.textSecondary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface CollapseState { steps: boolean; calories: boolean; workout: boolean; }
const DEFAULT_COLLAPSED: CollapseState = { steps: false, calories: false, workout: false };

interface Props { visible: boolean; onClose: () => void; }

export default function StatsHistoryModal({ visible, onClose }: Props) {
  const [range,     setRange]     = useState<TimeRange>('7T');
  const [collapsed, setCollapsed] = useState<CollapseState>(DEFAULT_COLLAPSED);
  const [animKey,   setAnimKey]   = useState(0);

  const workouts  = useWorkoutStore(s => s.workouts);
  const useMockData = useEngineStore(s => s.useMockData);

  // Load persisted collapse state on first mount
  useEffect(() => {
    AsyncStorage.getItem(COLLAPSE_KEY).then(val => {
      if (val) {
        try { setCollapsed(JSON.parse(val)); } catch {}
      }
    });
  }, []);

  // Re-trigger entry animations each time the modal opens
  useEffect(() => {
    if (visible) setAnimKey(k => k + 1);
  }, [visible]);

  const toggleCard = useCallback((key: keyof CollapseState) => {
    LayoutAnimation.configureNext({
      duration: 240,
      create:  { type: 'easeInEaseOut', property: 'opacity' },
      update:  { type: 'easeInEaseOut' },
      delete:  { type: 'easeInEaseOut', property: 'opacity' },
    });
    setCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const data  = useMemo(
    () => useMockData
      ? generateMockData(RANGE_DAYS[range])
      : buildRealData(workouts, RANGE_DAYS[range]),
    [range, useMockData, workouts],
  );
  const stats = useMemo(() => computeStats(data), [data]);

  const stepsData   = useMemo(() => buildChartData(data, 'steps',          range), [data, range]);
  const calData     = useMemo(() => buildChartData(data, 'calories',       range), [data, range]);
  const workoutData = useMemo(() => buildChartData(data, 'workoutMinutes', range), [data, range]);

  const avgStepsLabel   = `Ø ${stats.avgSteps.toLocaleString('de-DE')} / Tag`;
  const avgCalLabel     = `Ø ${stats.avgCalories} kcal / Tag`;
  const avgWorkoutLabel = `Ø ${stats.avgWorkoutMins} min / Training`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Aktivitätsverlauf</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Segmented range selector ─────────────────────────────────── */}
        <FadeSlideCard delay={0} triggerKey={animKey} style={styles.rangeWrapper}>
          <View style={styles.rangeSegment}>
            {(['7T', '1M', '3M', '1J'] as TimeRange[]).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeSegBtn, range === r && styles.rangeSegBtnActive]}
                onPress={() => setRange(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.rangeSegText, range === r && styles.rangeSegTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeSlideCard>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── Chart 1: Schritte ──────────────────────────────────────── */}
          <FadeSlideCard delay={80} triggerKey={animKey}>
            <ChartCard
              icon="shoe-print" title="Schritte" avgLabel={avgStepsLabel}
              accentColor={C.steps} chartData={stepsData} metricType="steps"
              collapsed={collapsed.steps} onToggle={() => toggleCard('steps')}
            />
          </FadeSlideCard>

          {/* ── Chart 2: Aktive Kalorien ───────────────────────────────── */}
          <FadeSlideCard delay={160} triggerKey={animKey}>
            <ChartCard
              icon="fire" title="Aktive Kalorien" avgLabel={avgCalLabel}
              accentColor={C.calories} chartData={calData} metricType="calories"
              collapsed={collapsed.calories} onToggle={() => toggleCard('calories')}
            />
          </FadeSlideCard>

          {/* ── Chart 3: Workout-Zeit ──────────────────────────────────── */}
          <FadeSlideCard delay={240} triggerKey={animKey}>
            <ChartCard
              icon="timer-outline" title="Workout-Zeit" avgLabel={avgWorkoutLabel}
              accentColor={C.workout} chartData={workoutData} metricType="minutes"
              collapsed={collapsed.workout} onToggle={() => toggleCard('workout')}
            />
          </FadeSlideCard>

          {/* ── Summary ───────────────────────────────────────────────── */}
          <FadeSlideCard delay={320} triggerKey={animKey}>
            <SummaryCard stats={stats} range={range} />
          </FadeSlideCard>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#0D0D1A' },
  scrollContent: { paddingHorizontal: CARD_MARGIN, paddingTop: 4 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  title:    { flex: 1, fontSize: 18, fontWeight: 'bold', color: AppColors.textPrimary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  rangeWrapper: { paddingHorizontal: CARD_MARGIN, paddingVertical: 10 },
  rangeSegment: {
    flexDirection: 'row', backgroundColor: '#1A1A2E',
    borderRadius: 12, padding: 4,
  },
  rangeSegBtn:       { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rangeSegBtnActive: { backgroundColor: AppColors.gold },
  rangeSegText:      { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  rangeSegTextActive:{ color: '#000', fontWeight: '700' },

  // Chart card
  chartCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16,
    marginBottom: 12, overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: CARD_PADDING, paddingVertical: 14,
    gap: 8,
  },
  chartIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  chartTitle: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary },
  chartAvg:   { fontSize: 12, fontWeight: '600' },
  chartBody:  { paddingHorizontal: CARD_PADDING, paddingBottom: CARD_PADDING, paddingTop: 4 },

  yAxisText: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },
  xAxisText: { color: 'rgba(255,255,255,0.45)', fontSize: 10 },

  tooltip: {
    backgroundColor: '#252547', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, alignItems: 'center', minWidth: 90,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  tooltipValue: { fontSize: 13, fontWeight: 'bold' },
  tooltipDate:  { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  summaryCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: CARD_PADDING, marginBottom: 12,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  summaryLine:   { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  summaryTitle:  { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  summaryGrid:   { gap: 12 },
  summaryItem:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryLabel:  { fontSize: 11, color: AppColors.textSecondary, marginBottom: 2 },
  summaryValue:  { fontSize: 15, fontWeight: '600', color: AppColors.textPrimary },
});
