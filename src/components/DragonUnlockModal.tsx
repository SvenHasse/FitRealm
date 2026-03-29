// DragonUnlockModal.tsx
// FitRealm — Spektakuläres Modal wenn der Uralte Drache freigeschaltet wird

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence,
} from 'react-native-reanimated';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';
import { ANIMAL_CONFIGS } from '../config/GameConfig';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DragonUnlockModal({ visible, onClose }: Props) {
  const [showButton, setShowButton] = useState(false);

  // Animationswerte
  const bgOpacity = useSharedValue(0);
  const eyeScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const dragonScale = useSharedValue(0);
  const flavorOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      // Reset
      bgOpacity.value = 0;
      eyeScale.value = 0;
      textOpacity.value = 0;
      dragonScale.value = 0;
      flavorOpacity.value = 0;
      setShowButton(false);
      return;
    }

    // Sequenz starten
    bgOpacity.value = withTiming(1, { duration: 600 });
    eyeScale.value = withDelay(300, withTiming(1, { duration: 800 }));
    textOpacity.value = withDelay(1200, withTiming(1, { duration: 600 }));
    dragonScale.value = withDelay(1800, withTiming(1, { duration: 700 }));
    flavorOpacity.value = withDelay(2500, withTiming(1, { duration: 600 }));

    // Button nach 2s einblenden
    const timer = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: eyeScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const dragonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dragonScale.value }],
  }));
  const flavorStyle = useAnimatedStyle(() => ({ opacity: flavorOpacity.value }));

  const dragonConfig = ANIMAL_CONFIGS['uralterDrache'];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Animated.View style={[styles.overlay, bgStyle]}>
        <View style={styles.content}>
          {/* Drachenauge */}
          <Animated.View style={[styles.eyeContainer, eyeStyle]}>
            <View style={styles.eyeOuter}>
              <View style={styles.eyePupil} />
            </View>
          </Animated.View>

          {/* Haupttext */}
          <Animated.View style={textStyle}>
            <Text style={styles.titleText}>🐲 Der Uralte Drache ist erwacht!</Text>
          </Animated.View>

          {/* Drachen-Renderer */}
          <Animated.View style={[styles.dragonWrapper, dragonStyle]}>
            <AnimalRenderer type="uralterDrache" size={80} />
          </Animated.View>

          {/* Flavor-Text */}
          <Animated.View style={[styles.flavorBox, flavorStyle]}>
            <Text style={styles.flavorText}>{dragonConfig.flavorText}</Text>
          </Animated.View>

          {/* Weiter-Button */}
          {showButton && (
            <TouchableOpacity style={styles.continueBtn} onPress={onClose}>
              <Text style={styles.continueBtnText}>Weiter</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 32,
  },
  eyeContainer: {
    marginBottom: 8,
  },
  eyeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  eyePupil: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD600',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dragonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flavorBox: {
    backgroundColor: 'rgba(27,94,32,0.3)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  flavorText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  continueBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
