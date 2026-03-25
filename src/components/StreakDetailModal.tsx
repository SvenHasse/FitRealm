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
const CARD_WIDTH   = 160;
const CARD_GAP     = 12;
// COLLECTED_KEY kept for backwards-compat migration; new state lives in gameStore
const COLLECTED_KEY = 'collected_streak_rewards';

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

// ─── Milestone card ───────────────────────────────────────────────────────────

function MilestoneCard({
  milestone,
  status,
  currentStreak,
  onCollect,
}: {
  milestone: StreakMilestone;
  status: MilestoneStatus;
  currentStreak: number;
  onCollect: () => void;
}) {
  // Pulse animation for 'ready' cards
  const cardScale = useSharedValue(1);
  useEffect(() => {
    if (status === 'ready') {
      cardScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.98, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(cardScale);
      cardScale.value = withSpring(status === 'next' ? 1.02 : 1.0);
    }
  }, [status]);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const bgColor =
    status === 'collected' ? 'rgba(245,166,35,0.15)' :
    status === 'ready'     ? 'rgba(245,166,35,0.25)' :
    status === 'next'      ? 'rgba(255,107,53,0.15)' :
                             'rgba(255,255,255,0.04)';

  const borderColor =
    status === 'collected' ? GOLD                      :
    status === 'ready'     ? GOLD                      :
    status === 'next'      ? STREAK_COLOR              :
                             'rgba(255,255,255,0.10)';

  const emojiOpacity  = status === 'upcoming' ? 0.35 : 1;
  const textOpacity   = status === 'upcoming' ? 0.55 : 1;
  const progress      = Math.min(currentStreak / milestone.days, 1);
  const daysLeft      = Math.max(milestone.days - currentStreak, 0);

  return (
    <Animated.View style={[styles.milestoneCard, { backgroundColor: bgColor, borderColor }, cardStyle]}>
      {/* Top-right badge */}
      {status === 'collected' && (
        <MaterialCommunityIcons
          name="check-circle"
          size={18}
          color={GOLD}
          style={styles.badgeIcon}
        />
      )}
      {(status === 'upcoming' || status === 'next') && (
        <MaterialCommunityIcons
          name="lock"
          size={16}
          color="rgba(255,255,255,0.3)"
          style={styles.badgeIcon}
        />
      )}
      {status === 'next' && (
        <View style={styles.nextBadge}>
          <Text style={styles.nextBadgeText}>NÄCHSTES ZIEL</Text>
        </View>
      )}

      {/* Emoji */}
      <Text style={[styles.milestoneEmoji, { opacity: emojiOpacity }]}>{milestone.emoji}</Text>

      {/* Name */}
      <Text style={[styles.milestoneName, { opacity: textOpacity }]}>{milestone.name}</Text>

      {/* Days */}
      <Text style={[styles.milestoneDays, { opacity: textOpacity * 0.7 }]}>
        {milestone.days} Tage
      </Text>

      {/* Reward text */}
      <Text style={[styles.milestoneReward, { opacity: textOpacity }]} numberOfLines={3}>
        {milestone.reward}
      </Text>

      {/* Progress bar (next milestone only) */}
      {status === 'next' && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{currentStreak} / {milestone.days} Tage</Text>
        </View>
      )}

      {/* Upcoming: days remaining */}
      {status === 'upcoming' && (
        <Text style={styles.daysLeftText}>Noch {daysLeft} Tage</Text>
      )}

      {/* Collect button */}
      {status === 'ready' && (
        <TouchableOpacity style={styles.collectBtn} onPress={onCollect} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check-bold" size={14} color="#000" style={{ marginRight: 4 }} />
          <Text style={styles.collectBtnText}>Einsammeln</Text>
        </TouchableOpacity>
      )}

      {/* Already collected label */}
      {status === 'collected' && (
        <View style={styles.collectedLabel}>
          <Text style={styles.collectedLabelText}>Bereits eingesammelt</Text>
        </View>
      )}
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
  const scrollRef = useRef<ScrollView>(null);

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

  // ── Auto-scroll to next milestone ─────────────────────────────────────────
  useEffect(() => {
    if (!visible || nextIndex < 0) return;
    const offset = nextIndex * (CARD_WIDTH + CARD_GAP);
    setTimeout(() => scrollRef.current?.scrollTo({ x: offset, animated: true }), 450);
  }, [visible, nextIndex]);

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

          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestoneList}
          >
            {milestoneStatuses.map(({ milestone, status }) => (
              <MilestoneCard
                key={milestone.days}
                milestone={milestone}
                status={status}
                currentStreak={effectiveStreak}
                onCollect={() => handleCollect(milestone.days)}
              />
            ))}
          </ScrollView>

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

  // Milestone list
  milestoneList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: CARD_GAP,
  },
  milestoneCard: {
    width:         CARD_WIDTH,
    borderRadius:  16,
    borderWidth:   1.5,
    padding:       14,
    gap:           6,
  },
  badgeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  nextBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${STREAK_COLOR}30`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: STREAK_COLOR,
    letterSpacing: 0.5,
  },
  milestoneEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  milestoneDays: {
    fontSize: 11,
    color: GOLD,
    fontWeight: '600',
  },
  milestoneReward: {
    fontSize: 11,
    color: AppColors.textSecondary,
    lineHeight: 16,
    flexShrink: 1,
  },
  progressWrap: { gap: 4, marginTop: 4 },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: STREAK_COLOR,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    color: STREAK_COLOR,
    fontWeight: '600',
  },
  daysLeftText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  collectBtn: {
    marginTop: 6,
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  collectedLabel: {
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  collectedLabelText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
});
