// EggHatchModal.tsx
// FitRealm - Animation beim Schlüpfen eines Tieres aus einem Ei

import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { AnimalType, AnimalRarity } from '../models/types';
import { ANIMAL_CONFIGS } from '../config/GameConfig';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';

interface Props {
  visible: boolean;
  animalType: AnimalType;
  rarity: AnimalRarity;
  onClose: () => void;
}

const RARITY_COLORS: Record<AnimalRarity, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

export default function EggHatchModal({ visible, animalType, rarity, onClose }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'egg' | 'hatching' | 'reveal'>('egg');
  const [showButton, setShowButton] = useState(false);

  const eggRotation = useSharedValue(0);
  const eggOpacity = useSharedValue(1);
  const animalOpacity = useSharedValue(0);
  const animalScale = useSharedValue(0.5);
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const config = ANIMAL_CONFIGS[animalType];
  const rarityColor = RARITY_COLORS[rarity];
  const rarityLabel = t(`animals.rarity${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`);

  useEffect(() => {
    if (!visible) {
      // Reset state
      setPhase('egg');
      setShowButton(false);
      eggRotation.value = 0;
      eggOpacity.value = 1;
      animalOpacity.value = 0;
      animalScale.value = 0.5;
      glowScale.value = 0;
      glowOpacity.value = 0;
      return;
    }

    // Phase 1: Ei wackelt
    setPhase('egg');
    eggRotation.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 150 }),
        withTiming(8, { duration: 150 }),
      ),
      4,
      false,
      () => {
        // Phase 2: Ei bricht auf
        eggOpacity.value = withTiming(0, { duration: 400 }, () => {
          // Phase 3: Tier erscheint
          animalOpacity.value = withTiming(1, { duration: 600 });
          animalScale.value = withSequence(
            withTiming(1.2, { duration: 400 }),
            withTiming(1.0, { duration: 200 }),
          );
          // Glow-Ring
          glowOpacity.value = withTiming(0.6, { duration: 200 }, () => {
            glowScale.value = withTiming(2, { duration: 600 });
            glowOpacity.value = withTiming(0, { duration: 600 });
          });
        });
      },
    );

    // Show button after 2s
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  const eggStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${eggRotation.value}deg` }],
    opacity: eggOpacity.value,
  }));

  const animalStyle = useAnimatedStyle(() => ({
    opacity: animalOpacity.value,
    transform: [{ scale: animalScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Titel */}
          <Text style={styles.titleText}>{t('eggs.hatching')}</Text>

          {/* Animations-Bereich */}
          <View style={styles.animArea}>
            {/* Glow-Ring */}
            <Animated.View style={[styles.glowRing, { borderColor: rarityColor }, glowStyle]} />

            {/* Ei */}
            <Animated.View style={[styles.eggContainer, eggStyle]}>
              <Text style={styles.eggEmoji}>🥚</Text>
            </Animated.View>

            {/* Tier */}
            <Animated.View style={[styles.animalContainer, animalStyle]}>
              <AnimalRenderer type={animalType} size={80} />
            </Animated.View>
          </View>

          {/* Tier-Info */}
          <Animated.View style={[{ opacity: animalOpacity }, styles.infoContainer]}>
            <Text style={[styles.animalName, { color: rarityColor }]}>
              {t('eggs.hatched', { name: config ? t(config.nameKey) : animalType })}
            </Text>
            <View style={[styles.rarityBanner, { backgroundColor: rarityColor + '25', borderColor: rarityColor }]}>
              <Text style={[styles.rarityBannerText, { color: rarityColor }]}>
                {rarityLabel}
              </Text>
            </View>
            {config?.flavorTextKey && (
              <Text style={styles.flavorText}>{t(config.flavorTextKey!)}</Text>
            )}
          </Animated.View>

          {/* Weiter-Button */}
          {showButton && (
            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: rarityColor }]} onPress={onClose}>
              <Text style={styles.continueBtnText}>{t('common.continue')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#1A1C2A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  animArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    opacity: 0,
  },
  eggContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggEmoji: {
    fontSize: 72,
  },
  animalContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rarityBanner: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  rarityBannerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  flavorText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    maxWidth: 260,
  },
  continueBtn: {
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
