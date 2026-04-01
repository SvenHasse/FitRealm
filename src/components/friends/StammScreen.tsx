// StammScreen.tsx
// Shows the tribe (Stamm) view: create, join, or manage your tribe.
// If the user hasn't built the Stammeshaus yet, a locked placeholder is shown.

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { useFriendsStore } from '../../store/useFriendsStore';
import { useGameStore } from '../../store/useGameStore';
import { getTribeLevelThreshold } from '../../utils/friendsUtils';
import { TribeType, TribeMember, BuildingType, AppColors } from '../../models/types';
import { friendStyles as s } from './styles';

const EMBLEMS = ['⚔️','🛡️','🔥','🌿','⚡','🌊','🏔️','🌙','☀️','🦅','🐉','🌟'];

// ─── StammeshausRequired ────────────────────────────────────────────────────
function StammeshausRequired() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={s.centeredPlaceholder}>
      <Animated.Text style={[s.placeholderEmoji, { transform: [{ scale: pulseAnim }] }]}>
        🏛️
      </Animated.Text>
      <Text style={s.placeholderTitle}>Stammeshaus benötigt</Text>
      <Text style={s.placeholderText}>
        Baue das Stammeshaus in deinem Realm, um einem Stamm beizutreten oder einen zu gründen.
      </Text>
      <Text style={s.placeholderHint}>Realm → Bauen → Stammeshaus</Text>
    </View>
  );
}

// ─── TribeJoinCreate ────────────────────────────────────────────────────────
type JoinCreateView = 'menu' | 'create' | 'join';

function TribeJoinCreate() {
  const createTribe = useFriendsStore((st) => st.createTribe);
  const joinTribe   = useFriendsStore((st) => st.joinTribe);

  const [view, setView]         = useState<JoinCreateView>('menu');
  const [tribeName, setTribeName] = useState('');
  const [emblem, setEmblem]     = useState(EMBLEMS[0]);
  const [tribeType, setTribeType] = useState<TribeType>('open');
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = () => {
    if (!tribeName.trim()) return;
    createTribe(tribeName.trim(), emblem, tribeType);
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    // In a real app this would do a network call; here we create a placeholder tribe
    joinTribe({
      id: `tribe_joined_${Date.now()}`,
      name: `Stamm ${joinCode.toUpperCase()}`,
      emblem: '⚔️',
      type: 'open',
      joinCode: joinCode.toUpperCase(),
      members: [],
      level: 1,
      weeklyMMGoal: 5000,
      currentWeeklyMM: 0,
      activeQuest: null,
      mmBoostPercent: 3,
    });
  };

  if (view === 'create') {
    return (
      <ScrollView style={s.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={s.formTitle}>Stamm gründen</Text>

        <Text style={s.formLabel}>Stammesname</Text>
        <TextInput
          style={s.textInput}
          value={tribeName}
          onChangeText={setTribeName}
          placeholder="z. B. Eisenwölfe"
          placeholderTextColor="rgba(255,255,255,0.3)"
          maxLength={30}
        />

        <Text style={s.formLabel}>Wappen</Text>
        <View style={s.emblemGrid}>
          {EMBLEMS.map((e) => (
            <TouchableOpacity
              key={e}
              style={[s.emblemOption, emblem === e && s.emblemOptionSelected]}
              onPress={() => setEmblem(e)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.formLabel}>Typ</Text>
        <View style={s.typeRow}>
          <TouchableOpacity
            style={[s.typeOption, tribeType === 'open' && s.typeOptionSelected]}
            onPress={() => setTribeType('open')}
            activeOpacity={0.8}
          >
            <Text style={s.typeOptionText}>Offen</Text>
            <Text style={s.typeOptionDesc}>Jeder kann per Code beitreten</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.typeOption, tribeType === 'closed' && s.typeOptionSelected]}
            onPress={() => setTribeType('closed')}
            activeOpacity={0.8}
          >
            <Text style={s.typeOptionText}>Geschlossen</Text>
            <Text style={s.typeOptionDesc}>Nur auf Einladung</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.primaryButton} onPress={handleCreate} activeOpacity={0.8}>
          <Text style={s.primaryButtonText}>Stamm gründen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryButton} onPress={() => setView('menu')} activeOpacity={0.8}>
          <Text style={s.secondaryButtonText}>Abbrechen</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (view === 'join') {
    return (
      <View style={s.formContainer}>
        <Text style={s.formTitle}>Stamm beitreten</Text>
        <Text style={s.formLabel}>Einladungscode</Text>
        <TextInput
          style={s.textInput}
          value={joinCode}
          onChangeText={(t) => setJoinCode(t.toUpperCase())}
          placeholder="z. B. ABC123"
          placeholderTextColor="rgba(255,255,255,0.3)"
          autoCapitalize="characters"
          maxLength={8}
        />
        <Text style={s.joinCodeHint}>Bitte den 6-stelligen Code deines Stammes ein.</Text>

        <TouchableOpacity style={s.primaryButton} onPress={handleJoin} activeOpacity={0.8}>
          <Text style={s.primaryButtonText}>Beitreten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryButton} onPress={() => setView('menu')} activeOpacity={0.8}>
          <Text style={s.secondaryButtonText}>Abbrechen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // menu
  return (
    <View style={s.centeredPlaceholder}>
      <Text style={s.placeholderEmoji}>⚔️</Text>
      <Text style={s.placeholderTitle}>Kein Stamm</Text>
      <Text style={s.placeholderText}>
        Gründe deinen eigenen Stamm oder tritt einem bestehenden bei, um gemeinsam MM zu sammeln.
      </Text>

      <TouchableOpacity style={[s.primaryButton, { width: '100%' }]} onPress={() => setView('create')} activeOpacity={0.8}>
        <Text style={s.primaryButtonText}>⚔️ Stamm gründen</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.secondaryButton, { width: '100%' }]} onPress={() => setView('join')} activeOpacity={0.8}>
        <Text style={s.secondaryButtonText}>🔑 Stamm beitreten</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── MemberRow ───────────────────────────────────────────────────────────────
interface MemberRowProps {
  member: TribeMember;
  rank: number;
  delay: number;
}

function MemberRow({ member, rank, delay }: MemberRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const roleLabel = member.role === 'chief' ? '👑 Anführer' : `🔥 ${member.currentStreak}d Streak`;

  return (
    <Animated.View style={[s.memberRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={s.memberRank}>#{rank}</Text>
      <View style={[s.memberAvatar, { backgroundColor: member.avatarColor }]}>
        <Text style={s.memberAvatarText}>{initials}</Text>
      </View>
      <View style={s.memberInfo}>
        <Text style={s.memberName}>{member.name}</Text>
        <Text style={s.memberMeta}>{roleLabel}</Text>
      </View>
      <Text style={s.memberMM}>{member.weeklyMM.toLocaleString('de-DE')} MM</Text>
    </Animated.View>
  );
}

// ─── TribeView ───────────────────────────────────────────────────────────────
function TribeView() {
  const tribe     = useFriendsStore((st) => st.tribe);
  const leaveTribe = useFriendsStore((st) => st.leaveTribe);

  if (!tribe) return null;

  const nextLevelMM  = getTribeLevelThreshold(tribe.level + 1);
  const totalMemberMM = tribe.members.reduce((sum, m) => sum + m.totalMM, 0);
  const levelProgress = nextLevelMM > 0 ? Math.min(totalMemberMM / nextLevelMM, 1) : 1;
  const weeklyProgress = tribe.weeklyMMGoal > 0
    ? Math.min(tribe.currentWeeklyMM / tribe.weeklyMMGoal, 1)
    : 0;

  const sortedMembers = [...tribe.members].sort((a, b) => b.weeklyMM - a.weeklyMM);
  const quest = tribe.activeQuest;
  const questProgress = quest ? Math.min(quest.progress / quest.goal, 1) : 0;

  return (
    <ScrollView style={s.tribeContainer} showsVerticalScrollIndicator={false}>
      {/* Tribe header */}
      <View style={s.tribeHeader}>
        <Text style={s.tribeEmblem}>{tribe.emblem}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.tribeName}>{tribe.name}</Text>
          <Text style={s.tribeMeta}>
            Level {tribe.level} · {tribe.type === 'open' ? 'Offen' : 'Geschlossen'}
          </Text>
        </View>
        {tribe.mmBoostPercent > 0 && (
          <View style={s.buffBadge}>
            <Text style={s.buffBadgeText}>+{tribe.mmBoostPercent}% MM</Text>
          </View>
        )}
      </View>

      {/* Weekly progress */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Wöchentliches Ziel</Text>
        <View style={s.progressBarContainer}>
          <View style={[s.progressBarFill, { width: `${Math.round(weeklyProgress * 100)}%` }]} />
        </View>
        <Text style={s.progressLabel}>
          {tribe.currentWeeklyMM.toLocaleString('de-DE')} / {tribe.weeklyMMGoal.toLocaleString('de-DE')} MM
        </Text>

        <Text style={[s.cardTitle, { marginTop: 12 }]}>Stamm-Level</Text>
        <View style={s.progressBarContainer}>
          <View style={[s.progressBarFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
        </View>
        <Text style={s.progressLabel}>
          {totalMemberMM.toLocaleString('de-DE')} / {nextLevelMM.toLocaleString('de-DE')} MM bis Level {tribe.level + 1}
        </Text>
      </View>

      {/* Active quest */}
      {quest && (
        <View style={s.card}>
          <Text style={s.cardTitle}>⚡ Wochenmission</Text>
          <Text style={s.questDescription}>{quest.description}</Text>
          <View style={s.progressBarContainer}>
            <View style={[s.progressBarFillQuest, { width: `${Math.round(questProgress * 100)}%` }]} />
          </View>
          <View style={s.questFooter}>
            <Text style={s.questProgress}>{quest.progress} / {quest.goal}</Text>
            <Text style={s.questReward}>🏆 {quest.rewardDescription}</Text>
          </View>
        </View>
      )}

      {/* Members */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Mitglieder ({sortedMembers.length})</Text>
        {sortedMembers.length === 0 ? (
          <Text style={s.emptyHint}>Noch keine Mitglieder</Text>
        ) : (
          sortedMembers.map((m, i) => (
            <MemberRow key={m.id} member={m} rank={i + 1} delay={i * 80} />
          ))
        )}
      </View>

      {/* Join code */}
      {tribe.type === 'open' && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Beitrittscode</Text>
          <Text style={s.joinCodeDisplay}>{tribe.joinCode}</Text>
          <Text style={s.joinCodeHint}>Teile diesen Code, damit andere deinem Stamm beitreten können.</Text>
        </View>
      )}

      {/* Leave button */}
      <TouchableOpacity
        style={[s.secondaryButton, { marginTop: 8, marginBottom: 32 }]}
        onPress={leaveTribe}
        activeOpacity={0.8}
      >
        <Text style={[s.secondaryButtonText, { color: '#ff6b6b' }]}>Stamm verlassen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── StammScreen ─────────────────────────────────────────────────────────────
export function StammScreen() {
  const tribe     = useFriendsStore((st) => st.tribe);
  const gameState = useGameStore((st) => st.gameState);

  // Check if the user has built the Stammeshaus
  const hasStammeshaus = gameState.buildings.some(
    (b) => b.type === BuildingType.stammeshaus && !b.isUnderConstruction
  );

  if (!hasStammeshaus) {
    return <StammeshausRequired />;
  }

  if (!tribe) {
    return <TribeJoinCreate />;
  }

  return <TribeView />;
}
