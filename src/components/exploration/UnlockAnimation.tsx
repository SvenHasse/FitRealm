import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface UnlockAnimationProps {
  biomeEmoji: string;
  biomeName: string;
  onComplete: () => void;
}

export default function UnlockAnimation({ biomeEmoji, biomeName, onComplete }: UnlockAnimationProps) {
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: bg fade in -> emoji spring -> text fade -> auto-dismiss
    Animated.sequence([
      Animated.timing(bgOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(emojiScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [bgOpacity, emojiScale, textOpacity, onComplete]);

  return (
    <Animated.View style={[styles.overlay, { opacity: bgOpacity }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
          {biomeEmoji}
        </Animated.Text>
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.title}>{biomeName}</Text>
          <Text style={styles.subtitle}>freigeschaltet!</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: 4,
  },
});
