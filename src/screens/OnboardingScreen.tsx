// OnboardingScreen.tsx
// 5-page horizontal FlatList onboarding: Welcome, Concept, Data Input, Fitness Focus, Result.

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useGameStore } from '../store/useGameStore';
import { calculateHRmax } from '../utils/hrMax';
import type { FitnessFocus } from '../models/types';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG = '#0e1016';
const GOLD = '#F5A623';
const TEAL = '#2E8B72';
const TEXT = '#FFFFFF';
const TEXT_SEC = 'rgba(255,255,255,0.6)';
const CARD_BG = '#1a1d28';
const INPUT_BG = '#252835';

const TOTAL_PAGES = 5;

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const setUserProfile = useGameStore(s => s.setUserProfile);
  const flatListRef = useRef<FlatList>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Form state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [fitnessFocus, setFitnessFocus] = useState<FitnessFocus | null>(null);

  // Animated HRmax count-up
  const animatedHR = useSharedValue(0);
  const [displayHR, setDisplayHR] = useState(0);

  const calculatedHRmax = age ? calculateHRmax(parseInt(age, 10)) : 0;

  const isFormValid =
    age !== '' && parseInt(age, 10) >= 14 && parseInt(age, 10) <= 99 &&
    weight !== '' && parseInt(weight, 10) >= 30 && parseInt(weight, 10) <= 250 &&
    height !== '' && parseInt(height, 10) >= 100 && parseInt(height, 10) <= 230 &&
    gender !== null;

  function goToPage(page: number) {
    flatListRef.current?.scrollToIndex({ index: page, animated: true });
    setCurrentPage(page);
  }

  function handleNext() {
    if (currentPage < TOTAL_PAGES - 1) {
      goToPage(currentPage + 1);
    }
  }

  function handleFinish() {
    if (!isFormValid || !gender || !fitnessFocus) return;
    setUserProfile({
      age: parseInt(age, 10),
      weight: parseInt(weight, 10),
      height: parseInt(height, 10),
      gender,
      fitnessFocus,
    });
    navigation.replace('Auth');
  }

  // Animate HRmax count-up when reaching result page
  useEffect(() => {
    if (currentPage === 4 && calculatedHRmax > 0) {
      animatedHR.value = 0;
      setDisplayHR(0);
      animatedHR.value = withTiming(calculatedHRmax, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });

      // Manual JS count-up for display since reanimated shared values don't easily bridge to text
      let frame = 0;
      const totalFrames = 40;
      const interval = setInterval(() => {
        frame++;
        const progress = Math.min(frame / totalFrames, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        setDisplayHR(Math.round(eased * calculatedHRmax));
        if (frame >= totalFrames) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [currentPage, calculatedHRmax]);

  const hrScale = useAnimatedStyle(() => ({
    transform: [{ scale: animatedHR.value > 0 ? withTiming(1, { duration: 600 }) : 0.5 }],
    opacity: animatedHR.value > 0 ? withTiming(1, { duration: 600 }) : 0,
  }));

  // Page renderers
  function renderWelcome() {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <Ionicons name="fitness" size={64} color={GOLD} />
        <Text style={styles.bigTitle}>{t('onboarding.welcomeTitle')}</Text>
        <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>
        <Text style={styles.description}>{t('onboarding.welcomeDesc')}</Text>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{t('common.continue')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  function renderConcept() {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <View style={styles.conceptFlow}>
          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>{'🏋️'}</Text>
            <Text style={styles.conceptLabel}>{t('onboarding.conceptTrain')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={GOLD} />
          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>{'💰'}</Text>
            <Text style={styles.conceptLabel}>{t('onboarding.conceptEarn')}</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color={GOLD} />
          <View style={styles.conceptItem}>
            <Text style={styles.conceptEmoji}>{'🏰'}</Text>
            <Text style={styles.conceptLabel}>{t('onboarding.conceptBuild')}</Text>
          </View>
        </View>
        <Text style={styles.description}>{t('onboarding.conceptDesc')}</Text>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{t('common.continue')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  function renderDataInput() {
    return (
      <KeyboardAvoidingView
        style={styles.page}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{t('onboarding.dataTitle')}</Text>
          <Text style={styles.formSubtitle}>{t('onboarding.dataSubtitle')}</Text>

          {/* Age */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('onboarding.age')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="14–99"
              placeholderTextColor={TEXT_SEC}
              maxLength={2}
            />
          </View>

          {/* Weight */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('onboarding.weight')}</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="number-pad"
              placeholder="30–250 kg"
              placeholderTextColor={TEXT_SEC}
              maxLength={3}
            />
          </View>

          {/* Height */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('onboarding.height')}</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
              placeholder="100–230 cm"
              placeholderTextColor={TEXT_SEC}
              maxLength={3}
            />
          </View>

          {/* Gender */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('onboarding.gender')}</Text>
            <View style={styles.genderToggle}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderBtnText, gender === 'male' && styles.genderBtnTextActive]}>
                  {t('onboarding.male')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderBtnText, gender === 'female' && styles.genderBtnTextActive]}>
                  {t('onboarding.female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, !isFormValid && styles.btnDisabled]}
            onPress={handleNext}
            disabled={!isFormValid}
          >
            <Text style={styles.nextBtnText}>{t('common.continue')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  function renderFocusSelection() {
    const focusOptions: { key: FitnessFocus; icon: string; label: string; desc: string }[] = [
      {
        key: 'ausdauer',
        icon: 'walk',
        label: 'Ausdauer',
        desc: 'Lange Einheiten werden stärker belohnt. Ideal für Laufen, Radfahren, Wandern.',
      },
      {
        key: 'diaet',
        icon: 'flame',
        label: 'Diät & Aktivität',
        desc: 'Jede aktive Kalorie zählt direkt. Ideal für Gewichtsreduktion und Alltagsbewegung.',
      },
      {
        key: 'muskelaufbau',
        icon: 'barbell',
        label: 'Muskelaufbau',
        desc: 'Intensive Einheiten werden multipliziert. Ideal für HIIT, Kraft und Sprint.',
      },
    ];

    return (
      <View style={[styles.page, styles.centerContent]}>
        <Text style={styles.formTitle}>{t('onboarding.focusTitle')}</Text>
        <Text style={[styles.formSubtitle, { marginBottom: 24 }]}>{t('onboarding.focusSubtitle')}</Text>

        {focusOptions.map(opt => {
          const isSelected = fitnessFocus === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.focusCard, isSelected && styles.focusCardSelected]}
              onPress={() => setFitnessFocus(opt.key)}
              activeOpacity={0.7}
            >
              <View style={styles.focusIconWrap}>
                <Ionicons name={opt.icon as any} size={28} color={isSelected ? GOLD : TEXT_SEC} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.focusLabel, isSelected && { color: GOLD }]}>{opt.label}</Text>
                <Text style={styles.focusDesc}>{opt.desc}</Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={GOLD} />
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.nextBtn, !fitnessFocus && styles.btnDisabled]}
          onPress={handleNext}
          disabled={!fitnessFocus}
        >
          <Text style={styles.nextBtnText}>{t('common.continue')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  function renderResult() {
    return (
      <View style={[styles.page, styles.centerContent]}>
        <Text style={styles.resultTitle}>{t('onboarding.resultTitle')}</Text>
        <Animated.View style={[styles.hrMaxBox, hrScale]}>
          <Text style={styles.hrMaxLabel}>HRmax</Text>
          <Text style={styles.hrMaxValue}>{displayHR}</Text>
          <Text style={styles.hrMaxUnit}>bpm</Text>
        </Animated.View>
        <Text style={styles.hrMaxExplain}>{t('onboarding.resultExplain')}</Text>
        <Text style={styles.hrMaxDetail}>
          {t('onboarding.resultFormula', { age: age || '0' })}
        </Text>
        <TouchableOpacity style={styles.startBtn} onPress={handleFinish}>
          <Text style={styles.startBtnText}>{t('onboarding.letsGo')}</Text>
          <Ionicons name="rocket" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  const pages = [renderWelcome, renderConcept, renderDataInput, renderFocusSelection, renderResult];

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `page-${i}`}
        renderItem={({ item: renderPage }) => renderPage()}
        onMomentumScrollEnd={(e) => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentPage(page);
        }}
      />

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentPage && styles.dotActive]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 28,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: GOLD,
    marginTop: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: TEXT,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: TEXT_SEC,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GOLD,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 32,
    width: '100%',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  // Concept page
  conceptFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  conceptItem: {
    alignItems: 'center',
    gap: 6,
  },
  conceptEmoji: {
    fontSize: 40,
  },
  conceptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  // Form page
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14,
    color: TEXT_SEC,
    textAlign: 'center',
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
    flex: 1,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    width: 110,
    textAlign: 'center',
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: INPUT_BG,
    borderRadius: 8,
    padding: 3,
  },
  genderBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  genderBtnActive: {
    backgroundColor: TEAL,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_SEC,
  },
  genderBtnTextActive: {
    color: TEXT,
  },
  // Focus selection page
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '100%',
  },
  focusCardSelected: {
    borderColor: GOLD,
    backgroundColor: 'rgba(245,166,35,0.08)',
  },
  focusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  focusDesc: {
    fontSize: 12,
    color: TEXT_SEC,
    marginTop: 2,
  },
  // Result page
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 24,
  },
  hrMaxBox: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: GOLD,
    paddingVertical: 28,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginBottom: 24,
  },
  hrMaxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  hrMaxValue: {
    fontSize: 64,
    fontWeight: '800',
    color: GOLD,
    marginVertical: 4,
  },
  hrMaxUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_SEC,
  },
  hrMaxExplain: {
    fontSize: 14,
    color: TEXT_SEC,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  hrMaxDetail: {
    fontSize: 13,
    color: TEXT_SEC,
    textAlign: 'center',
    marginBottom: 24,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TEAL,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
    width: '100%',
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: GOLD,
    width: 24,
  },
});
