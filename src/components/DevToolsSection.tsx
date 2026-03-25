// DevToolsSection.tsx
// Single consolidated dev tools panel for Settings screen.
// All dev buttons in one place — no duplicates elsewhere.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Crypto from 'expo-crypto';
import { AppColors, WorkoutRecord, Animal, AnimalType } from '../models/types';
import { useGameStore } from '../store/gameStore';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useWorkoutStore } from '../store/workoutStore';
import { resetAllData, resetWithMockData } from '../utils/resetUtils';
import { ANIMAL_CONFIGS } from '../config/EntityConfig';
import { saveGameState } from '../engines/GameEngine';

const ALL_ANIMAL_TYPES: AnimalType[] = [
  'erntehuhn', 'lastesel', 'holzbaer', 'spaehfalke', 'steinbock',
  'mystischerHirsch', 'kriegswolf', 'gluecksphoenixt', 'uralterDrache',
];

// ─── Small reusable button ───────────────────────────────────────────────────

function DevBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.btn} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.btnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Section label ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={s.sectionLabel}>{text}</Text>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DevToolsSection() {
  const {
    muskelmasse, protein, streakTokens, holz, nahrung, stein, currentStreak,
    devAddMuskelmasse, devAddProtein, devAddStreakTokens, devAddStreak,
    addHolz, addNahrung,
  } = useGameStore();
  const { patchGameStateCurrencies, injectManualWorkout } = useEngineStore();
  const queueCount = useWorkoutStore((s) => s.workouts.filter((w) => !w.isProcessed).length);

  // Workout simulator state
  const [workoutType, setWorkoutType] = useState('Laufen');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense' | 'max'>('moderate');
  const [duration, setDuration] = useState(42);

  const WORKOUT_TYPES = [
    { key: 'Laufen',        emoji: '\u{1F3C3}' },
    { key: 'Radfahren',     emoji: '\u{1F6B4}' },
    { key: 'Krafttraining', emoji: '\u{1F4AA}' },
    { key: 'HIIT',          emoji: '\u{26A1}' },
  ];

  const INTENSITIES: { key: typeof intensity; label: string; bpm: number; calPerMin: number }[] = [
    { key: 'light',    label: 'Leicht',   bpm: 105, calPerMin: 5  },
    { key: 'moderate', label: 'Moderat',  bpm: 140, calPerMin: 9  },
    { key: 'intense',  label: 'Intensiv', bpm: 162, calPerMin: 13 },
    { key: 'max',      label: 'Max',      bpm: 180, calPerMin: 17 },
  ];

  const currentIntensity = INTENSITIES.find((i) => i.key === intensity)!;

  // Sync helper — update both stores
  const sync = (patch: Parameters<typeof patchGameStateCurrencies>[0]) => {
    patchGameStateCurrencies(patch);
  };

  const addWorkoutToQueue = () => {
    const id = Crypto.randomUUID();
    const cal = Math.round(duration * currentIntensity.calPerMin);
    const steps = Math.round(duration * (workoutType === 'Laufen' ? 160 : workoutType === 'Radfahren' ? 30 : 70));
    const mins70 = currentIntensity.bpm >= 140 ? Math.round(duration * 0.7) : 0;

    // Add to workoutStore (Dashboard picks it up)
    useWorkoutStore.getState().addWorkout({
      id,
      type: workoutType,
      date: new Date().toISOString(),
      durationMinutes: duration,
      activeCalories: cal,
      steps,
      avgHeartRate: currentIntensity.bpm,
      minutesAbove70HRmax: mins70,
    });

    // Also inject into engine store
    const engineWorkout: WorkoutRecord = {
      id,
      workoutType,
      date: new Date().toISOString(),
      durationMinutes: duration,
      caloriesBurned: cal,
      averageHeartRate: currentIntensity.bpm,
      vitacoinsEarned: 0,
    };
    injectManualWorkout(engineWorkout);
  };

  const handleDevUnlockAllAnimals = () => {
    Alert.alert(
      '🐾 Alle Tiere freischalten',
      'Alle 9 Tiere werden sofort freigeschaltet (Stall-Kapazität wird ignoriert).',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Freischalten',
          onPress: () => {
            const gs = useEngineStore.getState().gameState;
            const existingTypes = new Set(gs.animals.map((a: Animal) => a.type));
            const newAnimals: Animal[] = ALL_ANIMAL_TYPES
              .filter(type => !existingTypes.has(type))
              .map(type => ({
                id: `dev_${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
                type,
                name: ANIMAL_CONFIGS[type].name,
                rarity: ANIMAL_CONFIGS[type].rarity,
                assignment: { type: 'idle' as const },
                obtainedAt: Date.now(),
              }));
            const newGs = { ...gs, animals: [...gs.animals, ...newAnimals] };
            useEngineStore.setState({ gameState: newGs });
            saveGameState(newGs);
          },
        },
      ]
    );
  };

  const handleFullReset = () => {
    Alert.alert(
      'Wirklich alles loeschen?',
      'Alle Workouts, Waehrungen, Streak und Fortschritt werden unwiderruflich geloescht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ja, alles loeschen', style: 'destructive', onPress: resetAllData },
      ],
    );
  };

  const handleLoadMock = () => {
    resetWithMockData();
    Alert.alert('', 'Mock-Daten geladen');
  };

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.headerRow}>
        <MaterialCommunityIcons name="wrench" size={16} color="#9C27B0" />
        <Text style={s.headerText}>DEVELOPER TOOLS</Text>
      </View>

      {/* ── CURRENCIES ────────────────────────────────────────── */}
      <SectionLabel text="WAEHRUNGEN" />
      <View style={s.grid}>
        <DevBtn label="+100g Muskel" onPress={() => { devAddMuskelmasse(100); sync({ muskelmasse: muskelmasse + 100 }); }} />
        <DevBtn label="+500g Muskel" onPress={() => { devAddMuskelmasse(500); sync({ muskelmasse: muskelmasse + 500 }); }} />
        <DevBtn label="+1 Protein" onPress={() => { devAddProtein(1); sync({ protein: protein + 1 }); }} />
        <DevBtn label="+5 Protein" onPress={() => { devAddProtein(5); sync({ protein: protein + 5 }); }} />
        <DevBtn label="+1 Token" onPress={() => { devAddStreakTokens(1); sync({ streakTokens: streakTokens + 1 }); }} />
        <DevBtn label="+5 Token" onPress={() => { devAddStreakTokens(5); sync({ streakTokens: streakTokens + 5 }); }} />
      </View>

      {/* ── RESOURCES ─────────────────────────────────────────── */}
      <SectionLabel text="RESSOURCEN" />
      <View style={s.grid}>
        <DevBtn label="+50 Holz" onPress={() => { addHolz(50); sync({ wood: useEngineStore.getState().gameState.wood + 50 }); }} />
        <DevBtn label="+100 Nahrung" onPress={() => { addNahrung(100); sync({ food: useEngineStore.getState().gameState.food + 100 }); }} />
      </View>

      {/* ── STREAK ────────────────────────────────────────────── */}
      <SectionLabel text="STREAK" />
      <View style={s.grid}>
        <DevBtn label="+1 Tag" onPress={() => { devAddStreak(1); sync({ currentStreak: currentStreak + 1 }); }} />
        <DevBtn label="+7 Tage" onPress={() => { devAddStreak(7); sync({ currentStreak: currentStreak + 7 }); }} />
      </View>

      {/* ── WORKOUT SIMULATION ────────────────────────────────── */}
      <SectionLabel text="WORKOUT SIMULATION" />

      {/* Type chips */}
      <Text style={s.fieldLabel}>Typ</Text>
      <View style={s.chipRow}>
        {WORKOUT_TYPES.map((wt) => (
          <TouchableOpacity
            key={wt.key}
            style={[s.chip, workoutType === wt.key && s.chipActive]}
            onPress={() => setWorkoutType(wt.key)}
          >
            <Text style={[s.chipText, workoutType === wt.key && s.chipTextActive]}>
              {wt.emoji} {wt.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Intensity chips */}
      <Text style={s.fieldLabel}>Intensitaet</Text>
      <View style={s.chipRow}>
        {INTENSITIES.map((it) => (
          <TouchableOpacity
            key={it.key}
            style={[s.chip, intensity === it.key && s.chipActiveOrange]}
            onPress={() => setIntensity(it.key)}
          >
            <Text style={[s.chipText, intensity === it.key && s.chipTextActiveOrange]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Duration slider */}
      <Text style={s.fieldLabel}>Dauer: {duration} Min</Text>
      <Slider
        style={{ height: 32 }}
        minimumValue={10}
        maximumValue={120}
        step={1}
        value={duration}
        onValueChange={setDuration}
        minimumTrackTintColor="#4CAF50"
        maximumTrackTintColor="rgba(255,255,255,0.15)"
        thumbTintColor="#4CAF50"
      />

      {/* Add workout button */}
      <TouchableOpacity style={s.addWorkoutBtn} onPress={addWorkoutToQueue} activeOpacity={0.75}>
        <Ionicons name="add-circle" size={18} color="#000" />
        <Text style={s.addWorkoutText}>Workout zur Warteschlange</Text>
      </TouchableOpacity>

      {/* ── LIVE VALUES ───────────────────────────────────────── */}
      <SectionLabel text="LIVE-WERTE" />
      <View style={s.valuesBox}>
        <Text style={s.valuesText}>
          {'Muskel: '}<Text style={{ color: AppColors.gold }}>{Math.floor(muskelmasse)}g</Text>
          {'  |  Protein: '}<Text style={{ color: AppColors.teal }}>{protein}</Text>
          {'  |  Tokens: '}<Text style={{ color: '#FF6B35' }}>{streakTokens}</Text>
          {'\nStreak: '}<Text style={{ color: '#FF6B35' }}>{currentStreak} Tage</Text>
          {'  |  Holz: '}<Text style={{ color: '#fff' }}>{holz}</Text>
          {'  |  Nahrung: '}<Text style={{ color: '#fff' }}>{nahrung}</Text>
          {'\nWorkouts in Queue: '}<Text style={{ color: '#F5A623' }}>{queueCount}</Text>
        </Text>
      </View>

      {/* ── TIERE ─────────────────────────────────────────────── */}
      <SectionLabel text="TIERE" />
      <TouchableOpacity style={s.animalBtn} onPress={handleDevUnlockAllAnimals} activeOpacity={0.75}>
        <MaterialCommunityIcons name="paw" size={16} color="#C4934A" />
        <View style={{ flex: 1 }}>
          <Text style={s.animalBtnTitle}>Alle 9 Tiere freischalten</Text>
          <Text style={s.animalBtnSub}>Stall-Kapazität wird ignoriert — nur für Tests</Text>
        </View>
      </TouchableOpacity>

      {/* ── RESET ─────────────────────────────────────────────── */}
      <SectionLabel text="RESET" />

      {/* Mock data button */}
      <TouchableOpacity style={s.mockBtn} onPress={handleLoadMock} activeOpacity={0.75}>
        <MaterialCommunityIcons name="refresh" size={16} color="#4CAF50" />
        <View style={{ flex: 1 }}>
          <Text style={s.mockBtnTitle}>Standard-Testdaten laden</Text>
          <Text style={s.mockBtnSub}>Setzt alles zurueck und laedt realistische Beispieldaten</Text>
        </View>
      </TouchableOpacity>

      {/* Full reset button */}
      <TouchableOpacity style={s.resetBtn} onPress={handleFullReset} activeOpacity={0.75}>
        <MaterialCommunityIcons name="delete-sweep" size={16} color="#F44336" />
        <View style={{ flex: 1 }}>
          <Text style={s.resetBtnTitle}>Alles auf null zuruecksetzen</Text>
          <Text style={s.resetBtnSub}>Loescht alle Workouts, Waehrungen und Fortschritt</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(156,39,176,0.07)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(156,39,176,0.25)',
    marginBottom: 16,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headerText: { fontSize: 13, fontWeight: 'bold', color: '#9C27B0' },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1, marginTop: 8, marginBottom: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn: {
    width: '47.5%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  btnText: { fontSize: 12, fontWeight: '500', color: AppColors.textPrimary, textAlign: 'center' },
  fieldLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(76,175,80,0.2)', borderColor: '#4CAF50' },
  chipActiveOrange: { backgroundColor: 'rgba(255,152,0,0.2)', borderColor: '#FF9800' },
  chipText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  chipTextActive: { color: '#4CAF50', fontWeight: '600' },
  chipTextActiveOrange: { color: '#FF9800', fontWeight: '600' },
  addWorkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 11, marginTop: 4,
  },
  addWorkoutText: { fontSize: 14, fontWeight: '600', color: '#000' },
  valuesBox: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: 10 },
  valuesText: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  animalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: 'rgba(196,147,74,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(196,147,74,0.4)',
  },
  animalBtnTitle: { fontSize: 13, fontWeight: '600', color: '#C4934A' },
  animalBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  mockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)',
  },
  mockBtnTitle: { fontSize: 13, fontWeight: '600', color: '#4CAF50' },
  mockBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: 'rgba(244,67,54,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(244,67,54,0.4)',
  },
  resetBtnTitle: { fontSize: 13, fontWeight: '600', color: '#F44336' },
  resetBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});
