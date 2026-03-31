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

import { useTranslation } from 'react-i18next';
import { AppColors } from '../models/types';
import { useGameStore }                        from '../store/gameStore';
import { useGameStore as useEngineStore }       from '../store/useGameStore';
import { getWorkoutIcon } from '../utils/workoutIcons';
import {
  computeMilestoneStatuses,
  CountdownInfo,
  formatLastWorkoutLabel,
  formatShieldCountdown,
  getCountdownInfo,
  MilestoneStatus,
  MilestoneWithStatus,
  STREAK_MILESTONES,
  StreakMilestone,
} from '../utils/streakUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const STREAK_COLOR = '#FF6B35';
const GOLD         = AppColors.gold;
// COLLECTED_KEY kept for backwards-compat migration; new state lives in gameStore
const COLLECTED_KEY = 'collected_streak_rewards';

// Icon + accent color per milestone days
const MILESTONE_ICON: Record<number, string> = {
  3:   'seed-outline',
  7:   'fire',
  14:  'arm-flex',
  21:  'lightning-bolt',
  30:  'medal',
  50:  'diamond-stone',
  100: 'trophy',
  365: 'crown',
};

const MILESTONE_COLOR: Record<number, string> = {
  3:   '#4CAF50',
  7:   '#FF6B35',
  14:  '#FF9800',
  21:  '#9C27B0',
  30:  '#F5A623',
  50:  '#00BCD4',
  100: '#F5A623',
  365: '#E91E63',
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

// ─── Shield constants ─────────────────────────────────────────────────────────
const SHIELD_COLOR       = '#C4622D';  // terracotta
const SHIELD_GLOW        = 'rgba(196,98,45,0.35)';
const SHIELD_GLOW_LIGHT  = 'rgba(196,98,45,0.15)';
const SHIELD_INACTIVE    = 'rgba(255,255,255,0.15)';

// ─── ShieldSection component ─────────────────────────────────────────────────

interface ShieldSectionProps {
  streakShields: import('../models/types').StreakShieldState;
  activateStreakShield: () => void;
  animKey: number;
}

function ShieldSection({ streakShields, activateStreakShield, animKey }: ShieldSectionProps) {
  const shieldActive = streakShields.activeShield !== null &&
    Date.now() <= (streakShields.activeShield?.expiresAt ?? 0);
  const canActivate  = streakShields.count > 0 && !shieldActive;

  // ── Live countdown ticker ─────────────────────────────────────────────────
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!shieldActive) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [shieldActive]);

  // ── Staggered bounce-in per shield icon ──────────────────────────────────
  const MAX_ICONS = Math.max(streakShields.count + (shieldActive ? 1 : 0), 3);
  const iconScales = useRef(
    Array.from({ length: 6 }, () => ({ scale: useSharedValue(0), opacity: useSharedValue(0) })),
  ).current;

  useEffect(() => {
    iconScales.forEach((sv, i) => {
      sv.scale.value   = 0;
      sv.opacity.value = 0;
      const delay = 80 + i * 60;
      sv.scale.value   = withDelay(delay, withSpring(1, { damping: 10, stiffness: 180 }));
      sv.opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    });
  }, [animKey]);

  // ── Active shield: breathing pulse + 3 ripple rings ──────────────────────
  const shieldPulse = useSharedValue(1);
  const ripple1     = useSharedValue(0);
  const ripple2     = useSharedValue(0);
  const ripple3     = useSharedValue(0);

  useEffect(() => {
    if (shieldActive) {
      // Breathing pulse on the icon
      shieldPulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.94, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, false,
      );
      // Ripple rings with staggered delays
      const startRipple = (sv: { value: number }, delay: number) => {
        sv.value = 0;
        sv.value = withDelay(delay, withRepeat(
          withSequence(
            withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 200 }), // hold briefly at end
          ),
          -1, false,
        ));
      };
      startRipple(ripple1, 0);
      startRipple(ripple2, 600);
      startRipple(ripple3, 1200);
    } else {
      cancelAnimation(shieldPulse);
      cancelAnimation(ripple1);
      cancelAnimation(ripple2);
      cancelAnimation(ripple3);
      shieldPulse.value = withTiming(1, { duration: 300 });
      ripple1.value = 0;
      ripple2.value = 0;
      ripple3.value = 0;
    }
  }, [shieldActive]);

  const pulseStyle  = useAnimatedStyle(() => ({
    transform: [{ scale: shieldPulse.value }],
  }));
  const makeRipple  = (sv: { value: number }) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: 1 + sv.value * 0.9 }],
      opacity: 0.6 * (1 - sv.value),
    }));
  const ripple1Style = makeRipple(ripple1);
  const ripple2Style = makeRipple(ripple2);
  const ripple3Style = makeRipple(ripple3);

  // ── Activate button glow pulse ────────────────────────────────────────────
  const btnGlow = useSharedValue(0);
  useEffect(() => {
    if (canActivate) {
      btnGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, false,
      );
    } else {
      cancelAnimation(btnGlow);
      btnGlow.value = 0;
    }
  }, [canActivate]);
  const btnGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.3 + btnGlow.value * 0.5,
    shadowRadius:  6    + btnGlow.value * 10,
  }));

  // ── Remaining fraction for arc display ───────────────────────────────────
  const remainingFraction = shieldActive && streakShields.activeShield
    ? Math.max(0, (streakShields.activeShield.expiresAt - Date.now()) /
        (7 * 24 * 60 * 60 * 1000))
    : 0;
  const remainingPct = Math.round(remainingFraction * 100);

  return (
    <View style={shieldStyles.container}>
      {/* Section header */}
      <View style={shieldStyles.headerRow}>
        <MaterialCommunityIcons name="shield-half-full" size={15} color={SHIELD_COLOR} />
        <Text style={shieldStyles.sectionTitle}>Streak-Schilde</Text>
      </View>

      <View style={shieldStyles.card}>
        {shieldActive ? (
          /* ── ACTIVE STATE ── */
          <View style={shieldStyles.activeWrap}>
            {/* Ripple rings */}
            <View style={shieldStyles.rippleContainer} pointerEvents="none">
              <Animated.View style={[shieldStyles.rippleRing, ripple1Style]} />
              <Animated.View style={[shieldStyles.rippleRing, ripple2Style]} />
              <Animated.View style={[shieldStyles.rippleRing, ripple3Style]} />
            </View>

            {/* Pulsing shield icon */}
            <Animated.Text style={[shieldStyles.bigShieldIcon, pulseStyle]}>🛡️</Animated.Text>

            {/* AKTIV label + countdown */}
            <View style={shieldStyles.activeTextCol}>
              <View style={shieldStyles.activeLabelRow}>
                <View style={shieldStyles.activeDot} />
                <Text style={shieldStyles.activeLabel}>AKTIV</Text>
              </View>
              <Text style={shieldStyles.countdownLarge}>
                {formatShieldCountdown(streakShields.activeShield!.expiresAt)}
              </Text>
              <Text style={shieldStyles.countdownSub}>{remainingPct}% verbleibend</Text>
            </View>

            {/* Remaining inventory */}
            {streakShields.count > 0 && (
              <View style={shieldStyles.stockRow}>
                {Array.from({ length: streakShields.count }).map((_, i) => (
                  <Text key={i} style={{ fontSize: 16 }}>🛡️</Text>
                ))}
                <Text style={shieldStyles.stockLabel}>im Vorrat</Text>
              </View>
            )}
          </View>
        ) : (
          /* ── INACTIVE STATE ── */
          <View style={shieldStyles.inactiveWrap}>
            {/* Shield icons with staggered bounce-in */}
            <View style={shieldStyles.iconRow}>
              {Array.from({ length: MAX_ICONS }).map((_, i) => {
                const sv = iconScales[Math.min(i, iconScales.length - 1)];
                const iconStyle = useAnimatedStyle(() => ({
                  transform: [{ scale: sv.scale.value }],
                  opacity: sv.opacity.value,
                }));
                const hasShield = i < streakShields.count;
                return (
                  <Animated.View key={i} style={[shieldStyles.shieldIconWrap, iconStyle]}>
                    <View style={[
                      shieldStyles.shieldIconBg,
                      hasShield ? shieldStyles.shieldIconBgActive : shieldStyles.shieldIconBgEmpty,
                    ]}>
                      <Text style={{ fontSize: 26, opacity: hasShield ? 1 : 0.2 }}>🛡️</Text>
                    </View>
                    {hasShield && (
                      <View style={shieldStyles.shieldGlowDot} />
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Count label */}
            <Text style={shieldStyles.countLabel}>
              {streakShields.count === 0
                ? 'Keine Schilder im Vorrat'
                : `${streakShields.count} Schild${streakShields.count > 1 ? 'e' : ''} verfügbar`}
            </Text>

            {/* Activate button */}
            <Animated.View style={[
              shieldStyles.btnShadow,
              canActivate ? btnGlowStyle : undefined,
            ]}>
              <TouchableOpacity
                style={[shieldStyles.activateBtn, !canActivate && shieldStyles.activateBtnDisabled]}
                onPress={canActivate ? async () => {
                  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
                  activateStreakShield();
                } : undefined}
                disabled={!canActivate}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="shield-check"
                  size={16}
                  color={canActivate ? '#fff' : 'rgba(255,255,255,0.3)'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[shieldStyles.activateBtnText, !canActivate && shieldStyles.activateBtnTextDisabled]}>
                  {streakShields.count === 0 ? 'Kein Schild verfügbar' : 'Schild aktivieren'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Hint */}
        <Text style={shieldStyles.hint}>
          Schützt deinen Streak für 7 Tage · Verdiene Schilder bei Tag 7, 21 & 50
        </Text>
      </View>
    </View>
  );
}

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
  const { t } = useTranslation();
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

  const accentColor = MILESTONE_COLOR[milestone.days] ?? STREAK_COLOR;
  const iconName    = MILESTONE_ICON[milestone.days]  ?? 'star-outline';

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
          <Text style={[styles.rowName, { opacity: textOpacity }]}>{t(milestone.nameKey)}</Text>
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
          {t(milestone.rewardDescKey)}
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
    streakShields,
    activateStreakShield,
    addStreakShields,
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
    // Grant shields if this milestone includes them
    const milestone = STREAK_MILESTONES.find(m => m.days === milestoneDays);
    if (milestone && milestone.shields > 0) {
      addStreakShields(milestone.shields);
    }
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 1400);
  }, [collectMilestone, addStreakTokens, addStreakShields]);

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

          {/* ── Streak-Schilde (above milestones) ──────────────────────── */}
          <ShieldSection
            streakShields={streakShields}
            activateStreakShield={activateStreakShield}
            animKey={animKey}
          />

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

// ─── Shield section styles ─────────────────────────────────────────────────────
const shieldStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${SHIELD_COLOR}30`,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },

  // ── Active state ────────────────────────────────────────────────────────────
  activeWrap: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  rippleContainer: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    top: 0,
  },
  rippleRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: SHIELD_COLOR,
    backgroundColor: SHIELD_GLOW_LIGHT,
  },
  bigShieldIcon: {
    fontSize: 64,
    lineHeight: 76,
    marginBottom: 14,
  },
  activeTextCol: {
    alignItems: 'center',
    marginBottom: 14,
  },
  activeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: SHIELD_COLOR,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: SHIELD_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  countdownLarge: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: 1,
  },
  countdownSub: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  stockLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginLeft: 4,
  },

  // ── Inactive state ──────────────────────────────────────────────────────────
  inactiveWrap: {
    alignItems: 'center',
    width: '100%',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14,
  },
  shieldIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  shieldIconBgActive: {
    backgroundColor: SHIELD_GLOW_LIGHT,
    borderColor: `${SHIELD_COLOR}80`,
  },
  shieldIconBgEmpty: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.10)',
  },
  shieldGlowDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SHIELD_COLOR,
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  btnShadow: {
    shadowColor: SHIELD_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 14,
    marginBottom: 4,
  },
  activateBtn: {
    backgroundColor: SHIELD_COLOR,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  activateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  activateBtnTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },

  // ── Hint ────────────────────────────────────────────────────────────────────
  hint: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 14,
    paddingHorizontal: 4,
  },
});
