// EinladenScreen.tsx
// Invite friends screen: shows the personal invite code, copy/share functionality,
// add-friend-by-code input, friend count, and "how it works" explanation.

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useFriendsStore } from '../../store/useFriendsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { friendStyles as s } from './styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon, { GameIconName } from '../GameIcon';
import { AppColors } from '../../models/types';

const HOW_IT_WORKS: { iconName: GameIconName; text: string }[] = [
  { iconName: 'send' as GameIconName, text: 'Teile deinen persönlichen Einladungscode mit Freunden.' },
  { iconName: 'person-add' as GameIconName, text: 'Dein Freund gibt den Code in FitRealm ein — ihr seid sofort verbunden.' },
  { iconName: 'trophy' as GameIconName, text: 'Kämpft gemeinsam um MM-Dominanz im Wochenranking!' },
  { iconName: 'streak' as GameIconName, text: 'Haltet euch gegenseitig motiviert und schützt eure Streaks.' },
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(displayCode);
    } catch {
      // Clipboard package not available — silently ignore.
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
  const profile = useAuthStore(s => s.profile);
  const myCode = profile?.invite_code ?? '';

  const friends = useFriendsStore((st) => st.friends);
  const addFriendByCode = useFriendsStore((st) => st.addFriendByCode);

  const [inputCode, setInputCode] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddFriend = async () => {
    if (!inputCode.trim()) return;
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(false);
    const result = await addFriendByCode(inputCode.trim());
    setAddLoading(false);
    if (result.success) {
      setAddSuccess(true);
      setInputCode('');
    } else {
      setAddError(result.error);
    }
  };

  const handleShare = async () => {
    const code = myCode || '------';
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
      <CodeCard code={myCode} />

      {/* Share button */}
      <TouchableOpacity style={s.shareButton} onPress={handleShare} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <GameIcon name="send" size={18} color="#1A1A2E" />
          <Text style={s.shareButtonText}>Einladung teilen</Text>
        </View>
      </TouchableOpacity>

      {/* Add friend by code */}
      <View style={addFriendStyles.card}>
        <Text style={s.cardTitle}>Freund hinzufügen</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={addFriendStyles.codeInput}
            placeholder="Einladungscode eingeben"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={inputCode}
            onChangeText={text => {
              setInputCode(text.toUpperCase());
              setAddError(null);
              setAddSuccess(false);
            }}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={[addFriendStyles.addBtn, (!inputCode.trim() || addLoading) && { opacity: 0.5 }]}
            onPress={handleAddFriend}
            disabled={addLoading || !inputCode.trim()}
          >
            {addLoading
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={addFriendStyles.addBtnText}>+</Text>
            }
          </TouchableOpacity>
        </View>
        {addError && <Text style={addFriendStyles.addError}>{addError}</Text>}
        {addSuccess && <Text style={addFriendStyles.addSuccess}>Freund hinzugefügt! 🎉</Text>}
      </View>

      {/* Friend count */}
      <View style={addFriendStyles.countRow}>
        <GameIcon name="people" size={16} color="rgba(255,255,255,0.5)" />
        <Text style={addFriendStyles.countText}>{friends.length} {friends.length === 1 ? 'Freund' : 'Freunde'}</Text>
      </View>

      {/* How it works */}
      <HowItWorksSection />

    </ScrollView>
  );
}

const addFriendStyles = {
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  codeInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, paddingHorizontal: 14, height: 48,
    color: '#fff', fontSize: 18, fontWeight: '700' as const, letterSpacing: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  addBtn: {
    backgroundColor: AppColors.gold, borderRadius: 10,
    width: 48, height: 48, alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  addBtnText: { color: '#000', fontSize: 24, fontWeight: 'bold' as const },
  addError: { color: '#FF6B6B', fontSize: 13, marginTop: 8 },
  addSuccess: { color: '#4CAF50', fontSize: 13, marginTop: 8 },
  countRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4,
  },
  countText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
};
