// FreundeListeScreen.tsx
// Shows the friends list, rival card, weekly leaderboard and ghost (streak danger) alerts.

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useFriendsStore } from '../../store/useFriendsStore';
import { useGameStore } from '../../store/gameStore';
import { getFriendStatus, getLeaderboard } from '../../utils/friendsUtils';
import { Friend, AppColors } from '../../models/types';
import { friendStyles as s } from './styles';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function focusEmoji(focus: Friend['fitnessFocus']): string {
  if (focus === 'ausdauer') return '🏃';
  if (focus === 'diaet') return '🥗';
  return '💪';
}

function statusLabel(friend: Friend): string {
  const status = getFriendStatus(friend);
  if (status === 'active_today') return '✅ Heute aktiv';
  if (status === 'streak_danger') return '⚠️ Streak in Gefahr!';
  return `Zuletzt: ${new Date(friend.lastActiveAt).toLocaleDateString('de-DE')}`;
}

function rankEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}.`;
}

// ─── GhostCard ───────────────────────────────────────────────────────────────
interface GhostCardProps {
  friend: Friend;
}

function GhostCard({ friend }: GhostCardProps) {
  const [sent, setSent] = useState(false);
  const initials = avatarInitials(friend.name);

  return (
    <View style={s.ghostCard}>
      <View style={[s.memberAvatar, { backgroundColor: friend.avatarColor }]}>
        <Text style={s.memberAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.friendName}>{friend.name}</Text>
        <Text style={s.friendStatus}>🔥 {friend.currentStreak}d Streak gefährdet</Text>
      </View>
      <TouchableOpacity
        style={[s.motivateButton, sent && s.motivateButtonSent]}
        onPress={() => setSent(true)}
        activeOpacity={0.8}
        disabled={sent}
      >
        <Text style={s.motivateButtonText}>{sent ? '✅' : '👊'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── RivalCard ───────────────────────────────────────────────────────────────
interface RivalCardProps {
  friend: Friend;
  myMM: number;
}

function RivalCard({ friend, myMM }: RivalCardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const diff = myMM - friend.weeklyMM;
  const diffColor = diff >= 0 ? '#4CAF50' : '#FF6B6B';
  const diffText = diff >= 0 ? `+${diff.toLocaleString('de-DE')}` : diff.toLocaleString('de-DE');
  const initials = avatarInitials(friend.name);

  return (
    <Animated.View style={[s.rivalCard, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={s.rivalLabel}>⚔️ Dein Rivale diese Woche</Text>
      <View style={s.rivalContent}>
        <View style={[s.avatar, { backgroundColor: friend.avatarColor }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.rivalInfo}>
          <Text style={s.rivalName}>{friend.name}</Text>
          <Text style={s.rivalMM}>{friend.weeklyMM.toLocaleString('de-DE')} MM diese Woche</Text>
        </View>
        <Text style={[s.rivalDiff, { color: diffColor }]}>{diffText}</Text>
      </View>
    </Animated.View>
  );
}

// ─── LeaderboardRow ──────────────────────────────────────────────────────────
interface LeaderboardRowProps {
  entry: Friend & { isMe?: boolean };
  rank: number;
  delay: number;
}

function LeaderboardRow({ entry, rank, delay }: LeaderboardRowProps) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim, delay]);

  const isMe = entry.isMe === true;

  return (
    <Animated.View
      style={[
        s.leaderboardRow,
        isMe && s.leaderboardRowMe,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <Text style={s.leaderboardRank}>{rankEmoji(rank)}</Text>
      <Text style={s.leaderboardName}>
        {isMe ? 'Du' : entry.name}
        {isMe && <Text style={s.myPositionBadge}> (ich)</Text>}
      </Text>
      <Text style={s.leaderboardMM}>{entry.weeklyMM.toLocaleString('de-DE')} MM</Text>
    </Animated.View>
  );
}

// ─── FriendCard ──────────────────────────────────────────────────────────────
interface FriendCardProps {
  friend: Friend;
}

function FriendCard({ friend }: FriendCardProps) {
  const initials = avatarInitials(friend.name);

  return (
    <View style={s.friendCard}>
      <View style={[s.avatar, { backgroundColor: friend.avatarColor }]}>
        <Text style={s.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.friendName}>
          {focusEmoji(friend.fitnessFocus)} {friend.name}
        </Text>
        <Text style={s.friendStatus}>{statusLabel(friend)}</Text>
      </View>
      <View style={s.friendStats}>
        <Text style={s.friendMM}>{friend.weeklyMM.toLocaleString('de-DE')} MM</Text>
        <Text style={s.friendStreak}>🔥 {friend.currentStreak}d</Text>
      </View>
    </View>
  );
}

// ─── FreundeListeScreen ──────────────────────────────────────────────────────
export function FreundeListeScreen() {
  const friends  = useFriendsStore((st) => st.friends);
  const rivalId  = useFriendsStore((st) => st.rivalId);
  const dailyEffKcal = useGameStore((st) => st.dailyEffKcal);

  // Rough weekly MM estimate from daily eff kcal (capped at 10,000)
  const myWeeklyMM = Math.min(Math.round(dailyEffKcal) * 7, 10_000);

  const currentHour = new Date().getHours();
  const isAfter20   = currentHour >= 20;

  const ghostFriends = isAfter20
    ? friends.filter((f) => getFriendStatus(f) === 'streak_danger')
    : [];

  const rival = rivalId ? friends.find((f) => f.id === rivalId) ?? null : null;

  const leaderboard = getLeaderboard(friends, myWeeklyMM);

  if (friends.length === 0) {
    return (
      <View style={s.centeredPlaceholder}>
        <Text style={s.placeholderEmoji}>👥</Text>
        <Text style={s.placeholderTitle}>Noch keine Freunde</Text>
        <Text style={s.placeholderText}>
          Lade Freunde ein und kämpft gemeinsam um MM-Dominanz!
        </Text>
        <Text style={s.placeholderHint}>Gehe zu „Einladen" um deinen Code zu teilen.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Ghost friends — streak danger */}
      {ghostFriends.length > 0 && (
        <View style={s.ghostSection}>
          <Text style={s.sectionTitle}>⚠️ Streak in Gefahr</Text>
          {ghostFriends.map((f) => (
            <GhostCard key={f.id} friend={f} />
          ))}
        </View>
      )}

      {/* Rival */}
      {rival && (
        <View style={s.section}>
          <RivalCard friend={rival} myMM={myWeeklyMM} />
        </View>
      )}

      {/* Weekly leaderboard */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📊 Wochenranking</Text>
        {leaderboard.map((entry, i) => (
          <LeaderboardRow key={entry.id} entry={entry} rank={i + 1} delay={i * 60} />
        ))}
      </View>

      {/* All friends */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>👥 Alle Freunde</Text>
        {friends.map((f) => (
          <FriendCard key={f.id} friend={f} />
        ))}
      </View>

    </ScrollView>
  );
}
