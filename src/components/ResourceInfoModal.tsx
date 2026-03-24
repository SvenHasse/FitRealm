// ResourceInfoModal.tsx
// FitRealm - Centered info popup for HUD resources

import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export type ResourceKey = 'muskelmasse' | 'protein' | 'wood' | 'stone' | 'food' | 'streakTokens';

interface ResourceMeta {
  icon: string;
  color: string;
}

const RESOURCE_META: Record<ResourceKey, ResourceMeta> = {
  muskelmasse: { icon: 'barbell', color: '#F5A623' },
  protein:     { icon: 'medkit',  color: '#00BCD4' },
  wood:        { icon: 'hammer',  color: '#8B7355' },
  stone:       { icon: 'cube',    color: '#9E9E9E' },
  food:        { icon: 'leaf',    color: '#4CAF50' },
  streakTokens:{ icon: 'flame',   color: '#FF9800' },
};

interface Props {
  resource: ResourceKey | null;
  onClose: () => void;
}

export default function ResourceInfoModal({ resource, onClose }: Props) {
  const { t } = useTranslation();
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (resource) {
      scale.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      scale.value = 0.85;
      opacity.value = 0;
    }
  }, [resource]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!resource) return null;

  const meta = RESOURCE_META[resource];
  const name = t(`resources.${resource}`);

  return (
    <Modal visible={resource != null} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <Animated.View style={[styles.card, animStyle]}>
          <TouchableOpacity activeOpacity={1}>
            {/* Title row */}
            <View style={styles.titleRow}>
              <Ionicons name={meta.icon as any} size={40} color={meta.color} />
              <Text style={styles.title}>{name}</Text>
            </View>

            {/* Accent bar */}
            <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

            {/* Info sections */}
            <InfoSection emoji="📦" label={t('resources.infoWhat')} body={t(`resources.info.${resource}.what`)} color={meta.color} />
            <InfoSection emoji="⚡" label={t('resources.infoHow')} body={t(`resources.info.${resource}.how`)} color={meta.color} />
            <InfoSection emoji="🏗️" label={t('resources.infoUse')} body={t(`resources.info.${resource}.use`)} color={meta.color} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>{t('resources.infoClose')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function InfoSection({ emoji, label, body, color }: { emoji: string; label: string; body: string; color: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
      </View>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#252547',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 18,
  },
  section: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionEmoji: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    paddingLeft: 20,
  },
  closeBtn: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
