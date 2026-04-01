// EinladenScreen.tsx
// Invite friends screen: shows the personal invite code, copy/share functionality,
// stats (invited / active / shields), and "how it works" explanation.

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
  // Clipboard is deprecated in newer RN but @react-native-clipboard/clipboard
  // is not guaranteed to be installed. We use Share API as the primary mechanism
  // and fall back to an in-app copy via Share sheet when clipboard is unavailable.
} from 'react-native';
import { useFriendsStore } from '../../store/useFriendsStore';
import { friendStyles as s } from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon, { GameIconName } from '../GameIcon';

const HOW_IT_WORKS: { iconName: GameIconName; text: string }[] = [
  { iconName: 'send' as GameIconName, text: 'Teile deinen persönlichen Einladungscode mit Freunden.' },
  { iconName: 'person-add' as GameIconName, text: 'Dein Freund gibt den Code beim ersten Start in FitRealm ein.' },
  { iconName: 'trophy' as GameIconName, text: 'Nach 7 aktiven Tagen erhältst du 3 Streak-Shields als Belohnung.' },
  { iconName: 'streak' as GameIconName, text: 'Je mehr aktive Freunde, desto mehr Shields sicherst du dir!' },
];

// ─── CodeCard ─────────────────────────────────────────────────────────────────
interface CodeCardProps {
  code: string;
}

function CodeCard({ code }: CodeCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const displayCode = code || '------';

  const handleCopy = async () => {
    try {
      // Try to use @react-native-clipboard/clipboard if available
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(displayCode);
    } catch {
      // Clipboard package not available — silently ignore.
      // The Share button below also exposes the code.
    }
  };

  return (
    <Animated.View style={[s.codeCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Text style={s.codeLabel}>Dein Einladungscode</Text>
      <Text style={s.codeValue}>{displayCode}</Text>
      <TouchableOpacity style={s.copyButton} onPress={handleCopy} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="content-copy" size={15} color="#1A1A2E" />
          <Text style={s.copyButtonText}>Kopieren</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── StatsSection ─────────────────────────────────────────────────────────────
interface StatsSectionProps {
  invitedCount: number;
  activeCount: number;
  shieldsEarned: number;
  pendingRewards: number;
}

function StatsSection({ invitedCount, activeCount, shieldsEarned, pendingRewards }: StatsSectionProps) {
  return (
    <View style={s.statsCard}>
      <Text style={s.cardTitle}>Deine Einlade-Statistik</Text>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statBoxValue}>{invitedCount}</Text>
          <Text style={s.statBoxLabel}>Eingeladen</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statBoxValue}>{activeCount}</Text>
          <Text style={s.statBoxLabel}>Aktiv (7 Tage)</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statBoxValue}>{shieldsEarned}</Text>
          <Text style={s.statBoxLabel}>Shields verdient</Text>
        </View>
      </View>
      {pendingRewards > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <GameIcon name="timer" size={13} />
          <Text style={s.pendingHint}>
            {pendingRewards} Einladung{pendingRewards !== 1 ? 'en' : ''} warten auf 7-Tage-Aktivierung
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── HowItWorksSection ───────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <View style={s.howItWorksCard}>
      <Text style={s.cardTitle}>So funktioniert es</Text>
      {HOW_IT_WORKS.map((step, i) => (
        <View key={i} style={s.howItWorksRow}>
          <GameIcon name={step.iconName} size={20} />
          <Text style={s.howItWorksText}>{step.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── EinladenScreen ───────────────────────────────────────────────────────────
export function EinladenScreen() {
  const inviteStats = useFriendsStore((st) => st.inviteStats);

  const handleShare = async () => {
    const code = inviteStats.myCode || '------';
    try {
      await Share.share({
        message: `Tritt FitRealm bei und wir sammeln zusammen MM! 💪\nMein Einladungscode: ${code}\n\nHol dir die App und gib den Code beim ersten Start ein.`,
        title: 'FitRealm – Freunde einladen',
      });
    } catch {
      // User cancelled or share failed — silently ignore
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* Code card with scale-in animation */}
      <CodeCard code={inviteStats.myCode} />

      {/* Share button */}
      <TouchableOpacity style={s.shareButton} onPress={handleShare} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <GameIcon name="send" size={18} color="#1A1A2E" />
          <Text style={s.shareButtonText}>Einladung teilen</Text>
        </View>
      </TouchableOpacity>

      {/* Stats */}
      <StatsSection
        invitedCount={inviteStats.invitedCount}
        activeCount={inviteStats.activeCount}
        shieldsEarned={inviteStats.shieldsEarned}
        pendingRewards={inviteStats.pendingRewards}
      />

      {/* How it works */}
      <HowItWorksSection />

    </ScrollView>
  );
}
