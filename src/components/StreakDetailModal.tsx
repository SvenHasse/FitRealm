// StreakDetailModal.tsx
// Full-screen modal: flame header → 48h countdown → scrollable milestone rewards board.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated as RNAnimated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppColors } from '../models/types';
import { useGameStore }                        from '../store/gameStore';
import { useGameStore as useEngineStore }       from '../store/useGameStore';
import { getWorkoutIcon } from '../utils/workoutIcons';
import {
  computeMilestoneStatuses,
  CountdownInfo,
  formatLastWorkoutLabel,
  getCountdownInfo,
  MilestoneStatus,
  MilestoneWithStatus,
  StreakMilestone,
} from '../utils/streakUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STREAK_COLOR = '#FF6B35';
const GOLD         = AppColors.gold;
// COLLECTED_KEY kept for backwards-compat migration; new state lives in gameStore
const COLLECTED_KEY = 'collected_streak_rewards';

// Icon + accent color per milestone name
const MILESTONE_ICON: Record<string, string> = {
  'Erster Schritt': 'seed-outline',
  'Aufgewärmt':     'fire',
  'Dranbleiber':    'arm-flex',
  'Krieger':        'lightning-bolt',
  'Monatsheld':     'medal',
  'Ausdauerprofi':  'diamond-stone',
  'Legende':        'trophy',
  'Unsterblich':    'crown',
};

const MILESTONE_COLOR: Record<string, string> = {
  'Erster Schritt': '#4CAF50',
  'Aufgewärmt':     '#FF6B35',
  'Dranbleiber':    '#FF9800',
  'Krieger':        '#9C27B0',
  'Monatsheld':     '#F5A623',
  'Ausdauerprofi':  '#00BCD4',
  'Legende':        '#F5A623',
  'Unsterblich':    '#E91E63',
};

const LEVEL_COLORS = {
  safe:    '#4CAF50',
  warning: '#FF9800',
  danger:  '#F44336',
  expired: '#F44336',
} as const;

// Mock data used when useMockData === true (streak = 12, workout 18h ago)
const MOCK = {
  currentStreak:       12,
  lastWorkoutDate:     new Date(Date.now() - 18 * 3_600_000),
  lastWorkoutType:     'Laufen',
  lastWorkoutDuration: 42,
  collectedMilestones: [3, 7],
};

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 700): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    setVal(0);
    if (!target) return;
    const steps    = 30;
    const interval = durationMs / steps;
    let step       = 0;
    const id = setInterval(() => {
      step++;
      setVal(Math.min(Math.round((target / steps) * step), target));
      if (step >= steps) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [target, durationMs]);
  return val;
}

// ─── Confetti burst ───────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#F5A623', '#FF6B35', '#4CAF50', '#00B4D8', '#E91E63', '#FFEB3B'];
const { width: SCREEN_W } = Dimensions.get('window');

function ConfettiBurst({ active }: { active: boolean }) {
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      x:       new RNAnimated.Value(0),
      y:       new RNAnimated.Value(0),
      opacity: new RNAnimated.Value(0),
      color:   CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:    6 + (i % 4) * 2,
      startX:  (Math.random() - 0.5) * SCREEN_W * 0.8,
      targetY: -(80 + Math.random() * 180),
    })),
  ).current;

  useEffect(() => {
    if (!active) return;
    particles.forEach(p => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
    });
    particles.forEach(p => {
      RNAnimated.sequence([
        RNAnimated.delay(Math.random() * 150),
        RNAnimated.parallel([
          RNAnimated.timing(p.opacity, { toValue: 1, duration: 80, useNativeDriver: true }),
          RNAnimated.timing(p.x,       { toValue: p.startX, duration: 800 + Math.random() * 400, useNativeDriver: true }),
          RNAnimated.timing(p.y,       { toValue: p.targetY, duration: 800 + Math.random() * 400, useNativeDriver: true }),
        ]),
        RNAnimated.timing(p.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <RNAnimated.View
          key={i}
          style={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            width:  p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }}
        />
      ))}
    </View>
  );
}

// ─── Countdown section ────────────────────────────────────────────────────────

function CountdownSection({
  countdown,
  lastWorkoutStr,
}: {
  countdown: CountdownInfo;
  lastWorkoutStr: string;
}) {
  const color = LEVEL_COLORS[countdown.level];

  // Pulsing text for danger level
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    if (countdown.level === 'danger') {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 600 }),
          withTiming(1.0, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [countdown.level]);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  const iconName =
    countdown.level === 'expired' ? 'timer-off-outline' :
    countdown.level === 'danger'  ? 'alert-circle'      :
    countdown.level === 'warning' ? 'clock-alert-outline' :
                                    'clock-check-outline';

  return (
    <View style={[styles.countdownCard, { borderColor: `${color}40` }]}>
      <Animated.View style={[styles.countdownRow, pulseStyle]}>
        <MaterialCommunityIcons name={iconName} size={20} color={color} />
        <Text style={[styles.countdownText, { color }]}>{countdown.text}</Text>
      </Animated.View>
      {lastWorkoutStr ? (
        <Text style={styles.lastWorkoutText}>Letztes Workout: {lastWorkoutStr}</Text>
      ) : null}
    </View>
  );
}

// ─── Milestone row (vertical list item) ──────────────────────────────────────

function MilestoneRow({
  milestone,
  status,
  currentStreak,
  onCollect,
  animKey,
  index,
}: {
  milestone: StreakMilestone;
  status: MilestoneStatus;
  currentStreak: number;
  onCollect: () => void;
  animKey: number;
  index: number;
}) {
  const opacity    = useSharedValue(0);
  const translateY = useSharedValue(18);

  useEffect(() => {
    opacity.value    = 0;
    translateY.value = 18;
    const delay = index * 55;
    opacity.value    = withDelay(delay, withTiming(1,  { duration: 300, easing: Easing.out(Easing.cubic) }));
    translateY.value = withDelay(delay, withTiming(0,  { duration: 300, easing: Easing.out(Easing.cubic) }));
  }, [animKey]);

  const slideStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const accentColor = MILESTONE_COLOR[milestone.name] ?? STREAK_COLOR;
  const iconName    = MILESTONE_ICON[milestone.name]  ?? 'star-outline';

  const isUpcoming  = status === 'upcoming';
  const iconOpacity = isUpcoming ? 0.3 : 1;
  const textOpacity = isUpcoming ? 0.45 : 1;

  const bgColor =
    status === 'collected' ? 'rgba(245,166,35,0.10)' :
    status === 'ready'     ? 'rgba(245,166,35,0.18)' :
    status === 'next'      ? `${accentColor}18`      :
                             'rgba(255,255,255,0.03)';

  const borderColor =
    status === 'collected' ? `${GOLD}80`         :
    status === 'ready'     ? GOLD                 :
    status === 'next'      ? `${accentColor}80`   :
                             'rgba(255,255,255,0.07)';

  const progress = Math.min(currentStreak / milestone.days, 1);
  const daysLeft = Math.max(milestone.days - currentStreak, 0);

  return (
    <Animated.View style={[styles.milestoneRow, { backgroundColor: bgColor, borderColor }, slideStyle]}>
      {/* Left: icon */}
      <View style={[styles.rowIconWrap, { backgroundColor: `${accentColor}20`, opacity: iconOpacity }]}>
        <MaterialCommunityIcons name={iconName as any} size={22} color={accentColor} />
      </View>

      {/* Center: content */}
      <View style={styles.rowContent}>
        {/* Title row */}
        <View style={styles.rowTitleLine}>
          <Text style={[styles.rowName, { opacity: textOpacity }]}>{milestone.name}</Text>
          {status === 'next' && (
            <View style={styles.nextBadge}>
              <Text style={styles.nextBadgeText}>NÄCHSTES ZIEL</Text>
            </View>
          )}
        </View>

        {/* Days + reward */}
        <Text style={[styles.rowDays, { color: accentColor, opacity: isUpcoming ? 0.5 : 1 }]}>
          {milestone.days} Tage
        </Text>
        <Text style={[styles.rowReward, { opacity: textOpacity }]} numberOfLines={2}>
          {milestone.reward}
        </Text>

        {/* Progress bar for 'next' */}
        {status === 'next' && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: accentColor }]} />
            </View>
            <Text style={[styles.progressLabel, { color: accentColor }]}>{currentStreak} / {milestone.days} Tage</Text>
          </View>
        )}

        {/* Days left for upcoming */}
        {status === 'upcoming' && (
          <Text style={styles.daysLeftText}>Noch {daysLeft} Tage</Text>
        )}

        {/* Collect button */}
        {status === 'ready' && (
          <TouchableOpacity style={styles.collectBtn} onPress={onCollect} activeOpacity={0.8}>
            <MaterialCommunityIcons name="check-bold" size={13} color="#000" style={{ marginRight: 4 }} />
            <Text style={styles.collectBtnText}>Einsammeln</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Right: status badge */}
      <View style={styles.rowRight}>
        {status === 'collected' && (
          <MaterialCommunityIcons name="check-circle" size={20} color={GOLD} />
        )}
        {(status === 'upcoming' || status === 'next') && (
          <MaterialCommunityIcons name="lock-outline" size={18} color="rgba(255,255,255,0.22)" />
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function StreakDetailModal({ visible, onClose }: Props) {
  // ── Global store (single source of truth) ─────────────────────────────────
  const {
    currentStreak,
    lastWorkoutDate: lastWorkoutDateStr,
    collectedMilestones,
    collectMilestone,
    addStreakTokens,
  } = useGameStore();
  const { recentWorkouts } = useEngineStore();

  const [countdown,      setCountdown]      = useState<CountdownInfo>({ msRemaining: 0, level: 'safe', text: '' });
  const [confettiActive, setConfettiActive] = useState(false);
  const [animKey,        setAnimKey]        = useState(0);

  // ── Data (always use store values — no mock override) ───────────────────
  const effectiveStreak = currentStreak;

  // Last workout date: prefer store value, fall back to recentWorkouts
  // Use the raw string as a stable reference to avoid re-creating Date objects every render
  const lastWorkoutDateRaw = lastWorkoutDateStr
    ?? (recentWorkouts.length > 0 ? recentWorkouts[0].date : null);
  const lastWorkoutDate: Date | null = lastWorkoutDateRaw ? new Date(lastWorkoutDateRaw) : null;

  const lastWorkoutType    = recentWorkouts[0]?.workoutType ?? '';
  const lastWorkoutMinutes = recentWorkouts[0] ? Math.floor(recentWorkouts[0].durationMinutes) : 0;

  // collectedMilestones comes from the store (persisted, no local state needed)
  const effectiveCollected = collectedMilestones;

  const displayStreak = useCountUp(visible ? effectiveStreak : 0, 600);

  const milestoneStatuses = computeMilestoneStatuses(effectiveStreak, effectiveCollected);
  const nextIndex         = milestoneStatuses.findIndex(m => m.status === 'next');

  // ── Live countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const date = lastWorkoutDateRaw ? new Date(lastWorkoutDateRaw) : null;
    const tick = () => setCountdown(getCountdownInfo(date));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible, lastWorkoutDateRaw]);

  // ── Re-trigger list animations on open ───────────────────────────────────
  useEffect(() => {
    if (visible) setAnimKey(k => k + 1);
  }, [visible]);

  // ── Flame animation ───────────────────────────────────────────────────────
  const flameScale = useSharedValue(1);
  useEffect(() => {
    if (visible) {
      flameScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.92, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(flameScale);
    }
  }, [visible]);
  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flameScale.value }],
  }));

  // ── Collect handler — writes to global store ───────────────────────────────
  const handleCollect = useCallback(async (milestoneDays: number) => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
    collectMilestone(milestoneDays);  // persisted via store middleware
    addStreakTokens(1);               // reward: +1 streak token
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 1400);
  }, [collectMilestone, addStreakTokens]);

  // ── Last workout label ────────────────────────────────────────────────────
  const lastWorkoutStr = lastWorkoutDate
    ? formatLastWorkoutLabel(lastWorkoutDate, lastWorkoutType, lastWorkoutMinutes)
    : '';

  const lastWorkoutIconName = getWorkoutIcon(lastWorkoutType).name;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.headerWrap}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="close" size={22} color={AppColors.textSecondary} />
          </TouchableOpacity>
          <Animated.View style={flameStyle}>
            <MaterialCommunityIcons name="fire" size={52} color={STREAK_COLOR} />
          </Animated.View>
          <Text style={styles.streakNumber}>{displayStreak}</Text>
          <Text style={styles.streakSub}>Tage in Folge</Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Countdown ──────────────────────────────────────────────── */}
          <CountdownSection countdown={countdown} lastWorkoutStr={lastWorkoutStr} />

          {/* ── Rewards board ──────────────────────────────────────────── */}
          <View style={styles.sectionRow}>
            <MaterialCommunityIcons name="trophy-outline" size={15} color={GOLD} />
            <Text style={styles.sectionTitle}>Streak-Belohnungen</Text>
          </View>

          <View style={styles.milestoneList}>
            {milestoneStatuses.map(({ milestone, status }, index) => (
              <MilestoneRow
                key={milestone.days}
                milestone={milestone}
                status={status}
                currentStreak={effectiveStreak}
                onCollect={() => handleCollect(milestone.days)}
                animKey={animKey}
                index={index}
              />
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        <ConfettiBurst active={confettiActive} />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#0D0D1A' },
  scroll: { flex: 1 },

  // Header
  headerWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: STREAK_COLOR,
    lineHeight: 76,
    marginTop: 4,
  },
  streakSub: {
    fontSize: 15,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  // Countdown card
  countdownCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: AppColors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countdownText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  lastWorkoutText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },

  // Section header
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  // Milestone list (vertical)
  milestoneList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  rowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  rowDays: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowReward: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 17,
  },
  rowRight: {
    flexShrink: 0,
    paddingTop: 2,
  },
  nextBadge: {
    backgroundColor: `${STREAK_COLOR}30`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: STREAK_COLOR,
    letterSpacing: 0.5,
  },
  progressWrap: { gap: 4, marginTop: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  daysLeftText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  collectBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
});
