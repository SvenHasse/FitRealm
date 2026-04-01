// GoalsScreen.tsx
// FitRealm — Ziele: Fitness | Dorf | Saisonal
// 3 unabhängig scrollbare Tabs mit GoalCards und SeasonalGoalCard.

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon, { GameIconName } from '../components/GameIcon';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AppColors, Goal, GoalReward, SeasonalGoal } from '../models/types';

// ── Difficulty colours ────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  easy:      '#4ADE80',
  medium:    '#F59E0B',
  hard:      '#F87171',
  legendary: '#A855F7',
};

// ── Number formatting ─────────────────────────────────────────────────────────
function fmtNum(n: number): string {
  return n >= 1000
    ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
    : String(Math.floor(n));
}

// ── RewardPills ───────────────────────────────────────────────────────────────
function RewardPills({ reward }: { reward: GoalReward }) {
  const pills: { icon: string; value: string; color: string }[] = [];
  if (reward.muskelmasse) pills.push({ icon: 'arm-flex',     value: `${fmtNum(reward.muskelmasse)}g`, color: '#60A5FA' });
  if (reward.holz)        pills.push({ icon: 'pine-tree',    value: String(reward.holz),              color: '#86EFAC' });
  if (reward.protein)     pills.push({ icon: 'molecule',     value: `${reward.protein}P`,             color: '#C084FC' });
  if (reward.nahrung)     pills.push({ icon: 'food-apple',   value: String(reward.nahrung),           color: '#FDE68A' });
  if (reward.stein)       pills.push({ icon: 'cube-outline', value: String(reward.stein),             color: '#94A3B8' });
  if (reward.streakShield) pills.push({ icon: 'shield-check', value: 'Shield',                       color: '#F59E0B' });
  if (pills.length === 0) return null;
  return (
    <View style={styles.pillRow}>
      {pills.map((p, i) => (
        <View key={i} style={[styles.pill, { borderColor: p.color + '60', backgroundColor: p.color + '20' }]}>
          <MaterialCommunityIcons name={p.icon as any} size={12} color={p.color} />
          <Text style={[styles.pillText, { color: p.color }]}>{p.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ── GoalCard ──────────────────────────────────────────────────────────────────
function GoalCard({ goal }: { goal: Goal }) {
  const { t } = useTranslation();
  const claimGoalReward = useGameStore(s => s.claimGoalReward);
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (goal.status !== 'claimable') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [goal.status]);

  const fraction     = Math.min(goal.currentValue / goal.targetValue, 1);
  const diffColor    = DIFF_COLOR[goal.difficulty] ?? AppColors.teal;
  const progressColor = goal.status === 'claimable' ? '#4ADE80' : diffColor;
  const unitLabel    = t(`goals.units.${goal.unit}`, { defaultValue: goal.unit });
  const progressText = goal.unit === 'steps'
    ? `${fmtNum(goal.currentValue)} / ${fmtNum(goal.targetValue)} ${unitLabel}`
    : `${Math.floor(goal.currentValue)} / ${goal.targetValue} ${unitLabel}`;

  const isClaimed   = goal.status === 'claimed';
  const isClaimable = goal.status === 'claimable';

  return (
    <View style={[styles.card, isClaimed && styles.cardDimmed]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconBubble, { backgroundColor: diffColor + '25' }]}>
          <MaterialCommunityIcons name={goal.icon as any} size={22} color={diffColor} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{t(goal.titleKey)}</Text>
          <Text style={styles.cardDesc}>{t(goal.descriptionKey)}</Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '25', borderColor: diffColor + '60' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>
            {t(`goals.difficulty.${goal.difficulty}`)}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{t('goals.progress')}</Text>
          <Text style={[styles.progressValue, { color: progressColor }]}>{progressText}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${fraction * 100}%`, backgroundColor: progressColor }]} />
        </View>
      </View>

      {/* Rewards */}
      <RewardPills reward={goal.reward} />

      {/* Claim / Claimed */}
      {isClaimable && (
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity style={styles.claimBtn} onPress={() => claimGoalReward(goal.id)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="gift-open" size={16} color="#000" />
            <Text style={styles.claimBtnText}>{t('goals.claimButton')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {isClaimed && (
        <View style={styles.claimedRow}>
          <MaterialCommunityIcons name="check-circle" size={16} color="#4ADE80" />
          <Text style={styles.claimedText}>{t('goals.claimed')}</Text>
        </View>
      )}
    </View>
  );
}

// ── SeasonalGoalCard ──────────────────────────────────────────────────────────
const TIER_META: Record<string, { iconName: GameIconName; color: string }> = {
  bronze: { iconName: 'medal-bronze' as GameIconName, color: '#CD7F32' },
  silver: { iconName: 'medal-silver' as GameIconName, color: '#C0C0C0' },
  gold:   { iconName: 'medal-gold' as GameIconName,   color: '#FFD700' },
};

function SeasonalGoalCard({ goal }: { goal: SeasonalGoal }) {
  const { t } = useTranslation();
  const claimSeasonalTier = useGameStore(s => s.claimSeasonalTier);
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <View style={styles.seasonCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={goal.icon as any} size={32} color="#FFD700" />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.seasonTitle}>{t(goal.titleKey)}</Text>
          <Text style={styles.cardDesc}>{t(goal.descriptionKey)}</Text>
        </View>
        <View style={styles.daysLeftBadge}>
          <Text style={styles.daysLeftText}>{t('goals.daysLeft', { days: daysLeft })}</Text>
        </View>
      </View>

      {/* Tiers */}
      <View style={styles.tierContainer}>
        {goal.tiers.map(tier => {
          const meta      = TIER_META[tier.tier] ?? { iconName: 'trophy' as GameIconName, color: '#888' };
          const fraction   = Math.min(tier.currentValue / tier.targetValue, 1);
          const isLocked   = tier.status === 'locked';
          const isClaimable = tier.status === 'claimable';
          const isClaimed  = tier.status === 'claimed';
          return (
            <View key={tier.tier} style={[styles.tierRow, isLocked && styles.tierLocked]}>
              <GameIcon name={meta.iconName} size={26} color={isLocked ? '#555' : meta.color} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={styles.progressRow}>
                  <Text style={[styles.tierLabel, { color: isLocked ? '#666' : meta.color }]}>
                    {tier.targetValue} Workouts
                  </Text>
                  <Text style={[styles.progressValue, { color: isLocked ? '#555' : meta.color }]}>
                    {Math.floor(tier.currentValue)} / {tier.targetValue}
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[
                    styles.progressFill,
                    { width: `${fraction * 100}%`, backgroundColor: isLocked ? '#444' : meta.color }
                  ]} />
                </View>
                <View style={{ marginTop: 6 }}>
                  <RewardPills reward={tier.reward} />
                </View>
              </View>
              <View style={{ marginLeft: 10, alignItems: 'center' }}>
                {isClaimable && (
                  <TouchableOpacity
                    style={[styles.tierClaimBtn, { borderColor: meta.color }]}
                    onPress={() => claimSeasonalTier(tier.tier)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tierClaimText, { color: meta.color }]}>✓</Text>
                  </TouchableOpacity>
                )}
                {isClaimed  && <MaterialCommunityIcons name="check-circle" size={22} color="#4ADE80" />}
                {isLocked   && <MaterialCommunityIcons name="lock" size={18} color="#444" />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyState}>
      <GameIcon name="check" size={32} color="#7D9B76" />
      <Text style={styles.emptyTitle}>{t('goals.allDone')}</Text>
      <Text style={styles.emptyDesc}>{t('goals.allDoneDesc')}</Text>
    </View>
  );
}

// ── Tab Selector ──────────────────────────────────────────────────────────────
type Tab = 'fitness' | 'seasonal';
const TABS: { key: Tab; icon: string; labelKey: string }[] = [
  { key: 'fitness',  icon: 'dumbbell', labelKey: 'goals.tabs.fitness'  },
  { key: 'seasonal', icon: 'trophy',   labelKey: 'goals.tabs.seasonal' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('fitness');
  const goals             = useGameStore(s => s.goals);
  const seasonalGoal      = useGameStore(s => s.seasonalGoal);
  const refreshGoalProgress = useGameStore(s => s.refreshGoalProgress);

  useEffect(() => { refreshGoalProgress(); }, []);

  const fitnessGoals = goals.filter(g => g.category === 'fitness');
  const fitnessAllDone = fitnessGoals.length > 0 && fitnessGoals.every(g => g.status === 'claimed');

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={16}
                color={active ? '#111' : 'rgba(255,255,255,0.55)'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t(tab.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fitness Tab */}
      {activeTab === 'fitness' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {fitnessAllDone
            ? <EmptyState />
            : fitnessGoals.map(g => <GoalCard key={g.id} goal={g} />)
          }
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Seasonal Tab */}
      {activeTab === 'seasonal' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {seasonalGoal ? <SeasonalGoalCard goal={seasonalGoal} /> : <EmptyState />}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },

  tabBar: {
    flexDirection: 'row',
    margin: 14,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 4,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 10,
  },
  tabItemActive: { backgroundColor: '#FFFFFF' },
  tabLabel:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  tabLabelActive:{ color: '#111' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14, paddingTop: 8 },

  // Goal Card
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 18, padding: 16, marginBottom: 14, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  cardDimmed:   { opacity: 0.65 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start' },
  iconBubble:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary },
  cardDesc:     { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  diffBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  diffText:     { fontSize: 11, fontWeight: '700' },

  progressSection: { gap: 6 },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:   { fontSize: 12, color: AppColors.textSecondary },
  progressValue:   { fontSize: 12, fontWeight: '700' },
  progressBg:      { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' },
  progressFill:    { height: 8, borderRadius: 6 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: '700' },

  claimBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: '#FFD700', borderRadius: 14, paddingVertical: 11,
  },
  claimBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  claimedRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  claimedText:  { fontSize: 13, fontWeight: '600', color: '#4ADE80' },

  // Seasonal
  seasonCard: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1.5, borderColor: '#FFD70040',
    shadowColor: '#FFD700', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
    gap: 16,
  },
  seasonTitle:    { fontSize: 18, fontWeight: '800', color: AppColors.textPrimary },
  daysLeftBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#FFD70060',
  },
  daysLeftText: { fontSize: 11, fontWeight: '700', color: '#FFD700' },

  tierContainer: { gap: 16 },
  tierRow:       { flexDirection: 'row', alignItems: 'center' },
  tierLocked:    { opacity: 0.5 },
  tierEmoji:     { fontSize: 26, width: 34, textAlign: 'center' },
  tierLabel:     { fontSize: 13, fontWeight: '700' },
  tierClaimBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tierClaimText: { fontSize: 16, fontWeight: '800' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary, marginTop: 16 },
  emptyDesc:  { fontSize: 14, color: AppColors.textSecondary, marginTop: 8, textAlign: 'center' },
});
