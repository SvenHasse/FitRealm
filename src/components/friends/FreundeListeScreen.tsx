// FreundeListeScreen.tsx
// Shows the friends list, rival card, weekly leaderboard and ghost (streak danger) alerts.

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFriendsStore } from '../../store/useFriendsStore';
import { useGameStore } from '../../store/gameStore';
import { getFriendStatus, getLeaderboard } from '../../utils/friendsUtils';
import { Friend, AppColors } from '../../models/types';
import { friendStyles as s } from './styles';
import GameIcon from '../GameIcon';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function FocusIcon({ focus }: { focus: Friend['fitnessFocus'] }) {
  if (focus === 'ausdauer') return <MaterialCommunityIcons name="run-fast" size={14} color="#4A90D9" />;
  if (focus === 'diaet') return <GameIcon name="streak" size={14} />;
  return <GameIcon name="mm" size={14} />;
}

function statusLabel(friend: Friend): { text: string; status: 'active' | 'danger' | 'none' } {
  const status = getFriendStatus(friend);
  if (status === 'active_today') return { text: 'Heute aktiv', status: 'active' };
  if (status === 'streak_danger') return { text: 'Streak in Gefahr!', status: 'danger' };
  return { text: `Zuletzt: ${new Date(friend.lastActiveAt).toLocaleDateString('de-DE')}`, status: 'none' };
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <GameIcon name="medal-gold" size={18} color="#FFD700" />;
  if (rank === 2) return <GameIcon name="medal-silver" size={18} color="#C0C0C0" />;
  if (rank === 3) return <GameIcon name="medal-bronze" size={18} color="#CD7F32" />;
  return <Text style={s.leaderboardRank}>{rank}.</Text>;
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <GameIcon name="streak" size={12} />
          <Text style={s.friendStatus}>{friend.currentStreak}d Streak gefährdet</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[s.motivateButton, sent && s.motivateButtonSent]}
        onPress={() => setSent(true)}
        activeOpacity={0.8}
        disabled={sent}
      >
        {sent
          ? <GameIcon name="check" size={16} />
          : <GameIcon name="quest" size={16} />
        }
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <GameIcon name="stamm" size={14} />
        <Text style={[s.rivalLabel, { marginBottom: 0 }]}>Dein Rivale diese Woche</Text>
      </View>
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
      <RankDisplay rank={rank} />
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
  const removeFriend = useFriendsStore((st) => st.removeFriend);

  const handleLongPress = () => {
    Alert.alert(
      'Freundschaft beenden',
      `Möchtest du ${friend.name} wirklich entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Entfernen', style: 'destructive', onPress: () => removeFriend(friend.id) },
      ],
    );
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.85}>
      <View style={s.friendCard}>
        <View style={[s.avatar, { backgroundColor: friend.avatarColor }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <FocusIcon focus={friend.fitnessFocus} />
            <Text style={s.friendName}>{friend.name}</Text>
          </View>
          {(() => {
            const sl = statusLabel(friend);
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {sl.status === 'active' && <GameIcon name="check" size={12} />}
                {sl.status === 'danger' && <GameIcon name="warning" size={12} />}
                {sl.status === 'none' && <GameIcon name="sleep" size={12} />}
                <Text style={s.friendStatus}>{sl.text}</Text>
              </View>
            );
          })()}
        </View>
        <View style={s.friendStats}>
          <Text style={s.friendMM}>{friend.weeklyMM.toLocaleString('de-DE')} MM</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <GameIcon name="streak" size={12} />
            <Text style={s.friendStreak}>{friend.currentStreak}d</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── FreundeListeScreen ──────────────────────────────────────────────────────
export function FreundeListeScreen() {
  const friends     = useFriendsStore((st) => st.friends);
  const rivalId     = useFriendsStore((st) => st.rivalId);
  const isLoading   = useFriendsStore((st) => st.isLoading);
  const loadFriends = useFriendsStore((st) => st.loadFriends);
  const dailyEffKcal = useGameStore((st) => st.dailyEffKcal);

  useEffect(() => {
    loadFriends();
  }, []);

  // Rough weekly MM estimate from daily eff kcal (capped at 10,000)
  const myWeeklyMM = Math.min(Math.round(dailyEffKcal) * 7, 10_000);

  const currentHour = new Date().getHours();
  const isAfter20   = currentHour >= 20;

  const ghostFriends = isAfter20
    ? friends.filter((f) => getFriendStatus(f) === 'streak_danger')
    : [];

  const rival = rivalId ? friends.find((f) => f.id === rivalId) ?? null : null;

  const leaderboard = getLeaderboard(friends, myWeeklyMM);

  if (isLoading && friends.length === 0) {
    return (
      <View style={s.centeredPlaceholder}>
        <ActivityIndicator size="large" color={AppColors.gold} />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <View style={s.centeredPlaceholder}>
        <GameIcon name="people" size={52} color="rgba(255,255,255,0.25)" />
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <GameIcon name="warning" size={14} />
            <Text style={s.sectionTitle}>Streak in Gefahr</Text>
          </View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <GameIcon name="chart" size={14} />
          <Text style={s.sectionTitle}>Wochenranking</Text>
        </View>
        {leaderboard.map((entry, i) => (
          <LeaderboardRow key={entry.id} entry={entry} rank={i + 1} delay={i * 60} />
        ))}
      </View>

      {/* All friends */}
      <View style={s.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <GameIcon name="people" size={14} />
          <Text style={s.sectionTitle}>Alle Freunde</Text>
        </View>
        {friends.map((f) => (
          <FriendCard key={f.id} friend={f} />
        ))}
      </View>

    </ScrollView>
  );
}
