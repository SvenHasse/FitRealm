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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AppColors, WorkoutRecord, Animal, AnimalType, AnimalEgg, AnimalRarity, DamageEffect, BuildingType, Trophy } from '../models/types';
import { useGameStore } from '../store/gameStore';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useWorkoutStore } from '../store/workoutStore';
import { resetAllData, resetWithMockData } from '../utils/resetUtils';
import { ANIMAL_CONFIGS, EGG_HATCH_CONFIGS } from '../config/GameConfig';
import { saveGameState } from '../engines/GameEngine';
import { gameStateRathausLevel } from '../models/types';
import { waveService } from '../services/WaveService';
import { combatService } from '../services/CombatService';

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
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  // ── Wellen-Handlers ───────────────────────────────────────────────────────

  const handleSpawnWaveIn5s = () => {
    const gs = useEngineStore.getState().gameState;
    const rathausLevel = gameStateRathausLevel(gs);
    const lastWorkout = gs.lastWorkoutDate
      ? new Date(gs.lastWorkoutDate).getTime()
      : Date.now() - 24 * 3600 * 1000;
    const wave = waveService.generateWave(rathausLevel, lastWorkout);
    const now = Date.now();
    const testWave = {
      ...wave,
      status: 'approaching' as const,
      announcedAt: now,
      arrivesAt: now + 5000,
    };
    const newGs = {
      ...gs,
      activeWave: testWave,
      nextWaveAt: now + 5000,
      waves: [...gs.waves, testWave],
    };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    // Trigger resolution after 5s
    setTimeout(() => {
      useEngineStore.getState().triggerWaveResolution();
    }, 5500);
    Alert.alert('⚔️ Testwelle', `Welle kommt in 5 Sekunden!\nRathaus L${rathausLevel} | AK: ~${Math.round(wave.totalAttackPower)}`);
  };

  const handleShowApproachingWave = () => {
    const gs = useEngineStore.getState().gameState;
    const rathausLevel = gameStateRathausLevel(gs);
    const lastWorkout = gs.lastWorkoutDate
      ? new Date(gs.lastWorkoutDate).getTime()
      : Date.now() - 24 * 3600 * 1000;
    const wave = waveService.generateWave(rathausLevel, lastWorkout);
    const now = Date.now();
    const approachingWave = {
      ...wave,
      status: 'approaching' as const,
      announcedAt: now,
      arrivesAt: now + 8 * 3600 * 1000, // 8h
    };
    const newGs = {
      ...gs,
      activeWave: approachingWave,
      nextWaveAt: approachingWave.arrivesAt,
      waves: [...gs.waves, approachingWave],
    };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    Alert.alert('⚠️ Wellen-Warnung', `Banner wird angezeigt.\nWelle in 8h | AK: ~${Math.round(wave.totalAttackPower)}`);
  };

  const handleSimulateDefeat = () => {
    Alert.alert(
      '💀 Niederlage simulieren',
      'Schwache Welle wird sofort aufgelöst — Dorf verliert (Schaden anwenden).',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Simulieren',
          onPress: () => {
            const gs = useEngineStore.getState().gameState;
            const rathausLevel = gameStateRathausLevel(gs);
            // Generate a very strong wave
            const wave = waveService.generateWave(rathausLevel, Date.now() - 200 * 3600 * 1000);
            const now = Date.now();
            const strongWave = {
              ...wave,
              totalAttackPower: wave.totalAttackPower * 10, // massively overpowered
              status: 'active' as const,
              announcedAt: now - 1000,
              arrivesAt: now - 500,
            };
            const newGs = { ...gs, activeWave: strongWave, nextWaveAt: now, waves: [...gs.waves, strongWave] };
            useEngineStore.setState({ gameState: newGs });
            saveGameState(newGs);
            setTimeout(() => {
              useEngineStore.getState().triggerWaveResolution();
            }, 300);
          },
        },
      ]
    );
  };

  const handleSimulateVictory = () => {
    Alert.alert(
      '⚔️ Sieg simulieren',
      'Schwache Welle wird sofort aufgelöst — Dorf gewinnt (Loot erhalten).',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Simulieren',
          onPress: () => {
            const gs = useEngineStore.getState().gameState;
            // Generate a very weak wave
            const wave = waveService.generateWave(1, Date.now());
            const now = Date.now();
            const weakWave = {
              ...wave,
              totalAttackPower: 1, // trivially weak → perfect victory
              status: 'active' as const,
              announcedAt: now - 1000,
              arrivesAt: now - 500,
            };
            const newGs = { ...gs, activeWave: weakWave, nextWaveAt: now, waves: [...gs.waves, weakWave] };
            useEngineStore.setState({ gameState: newGs });
            saveGameState(newGs);
            setTimeout(() => {
              useEngineStore.getState().triggerWaveResolution();
            }, 300);
          },
        },
      ]
    );
  };

  const handleAddDamageEffect = () => {
    const gs = useEngineStore.getState().gameState;
    const productionBuildings = gs.buildings.filter(b => b.level >= 1 && b.type !== BuildingType.rathaus && b.type !== BuildingType.stall);
    if (productionBuildings.length === 0) {
      Alert.alert('Keine Gebäude', 'Baue zuerst Produktionsgebäude.');
      return;
    }
    const target = productionBuildings[Math.floor(Math.random() * productionBuildings.length)];
    const now = Date.now();
    const effect: DamageEffect = {
      buildingId: target.id,
      effectType: 'productionStop',
      duration: 2 * 3600,
      startsAt: now,
      endsAt: now + 2 * 3600 * 1000,
    };
    useEngineStore.getState().addDamageEffect(effect);
    Alert.alert('🔥 Schadenseffekt', `Gebäude "${target.type}" — Produktion gestoppt für 2h`);
  };

  const handleClearDamageEffects = () => {
    const gs = useEngineStore.getState().gameState;
    const newGs = { ...gs, damageEffects: [] };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    Alert.alert('✅ Schadenseffekte', 'Alle Effekte gelöscht.');
  };

  const handleShowDefenseBreakdown = () => {
    const defense = useEngineStore.getState().calculateDefense();
    Alert.alert(
      '🛡️ Verteidigung',
      `Basis-VP: ${defense.basisVP}\nWorkout-VP: ${Math.round(defense.workoutVP)}\nWorker-VP: ${defense.workerVP}\nTier-VP: ${defense.animalVP}\nStreak-Bonus: ${Math.round(defense.streakBonus * 100)}%\n\nGesamt: ${Math.round(defense.totalVP)} VP`
    );
  };

  const handleClearActiveWave = () => {
    const gs = useEngineStore.getState().gameState;
    const newGs = { ...gs, activeWave: null, nextWaveAt: null };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    Alert.alert('🧹 Welle', 'Aktive Welle und nextWaveAt gelöscht.');
  };

  // ── Ei-Handlers ───────────────────────────────────────────────────────────

  const handleAddEgg = (rarity: AnimalRarity) => {
    const cfg = EGG_HATCH_CONFIGS[rarity];
    // Pick a random animal of matching rarity
    const matching = ALL_ANIMAL_TYPES.filter(t => ANIMAL_CONFIGS[t].rarity === rarity);
    const hatchesInto = matching[Math.floor(Math.random() * matching.length)] ?? 'erntehuhn';
    const egg: AnimalEgg = {
      id: `dev_egg_${rarity}_${Date.now().toString(36)}`,
      rarity,
      hatchesInto: hatchesInto as AnimalEgg['hatchesInto'],
      workoutsRequired: cfg.workoutsRequired,
      workoutsCompleted: 0,
      requiresConsecutive: cfg.requiresConsecutive,
      requiresMinHRmax: cfg.requiresMinHRmax,
      obtainedAt: Date.now(),
    };
    useEngineStore.getState().addEgg(egg);
    Alert.alert('🥚 Ei hinzugefügt', `${rarity.toUpperCase()}-Ei\nSchlüpft in: ${cfg.workoutsRequired} Workouts${cfg.requiresMinHRmax ? `\n⚠️ Braucht ≥${cfg.requiresMinHRmax}% HRmax` : ''}${cfg.requiresConsecutive ? '\n🔗 Consecutive nötig' : ''}`);
  };

  const handleIncrementAllEggs = () => {
    const gs = useEngineStore.getState().gameState;
    if (gs.eggs.length === 0) { Alert.alert('Keine Eier', 'Zuerst ein Ei hinzufügen.'); return; }
    gs.eggs.forEach(egg => {
      if (egg.workoutsCompleted < egg.workoutsRequired) {
        useEngineStore.getState().incrementEggProgress(egg.id);
      }
    });
    Alert.alert('🥚 Fortschritt', `${gs.eggs.length} Ei(er) um 1 Workout erhöht.`);
  };

  const handleHatchAllEggs = () => {
    Alert.alert('🐣 Alle Eier ausbrüten', 'Alle Eier werden sofort auf max. Workouts gesetzt und schlüpfen.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Ausbrüten',
        onPress: () => {
          const gs = useEngineStore.getState().gameState;
          if (gs.eggs.length === 0) { Alert.alert('Keine Eier', 'Zuerst ein Ei hinzufügen.'); return; }
          // Set all eggs to completed, then hatch
          const readyEggs = gs.eggs.map(e => ({ ...e, workoutsCompleted: e.workoutsRequired }));
          const newGs = { ...gs, eggs: readyEggs };
          useEngineStore.setState({ gameState: newGs });
          // Now hatch each
          readyEggs.forEach(egg => {
            useEngineStore.getState().hatchEgg(egg.id);
          });
        },
      },
    ]);
  };

  const handleClearAllEggs = () => {
    const gs = useEngineStore.getState().gameState;
    const newGs = { ...gs, eggs: [] };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    Alert.alert('🗑️ Eier', 'Alle Eier gelöscht.');
  };

  const handleShowEggStatus = () => {
    const gs = useEngineStore.getState().gameState;
    if (gs.eggs.length === 0) { Alert.alert('Keine Eier', 'Noch keine Eier vorhanden.'); return; }
    const lines = gs.eggs.map(e =>
      `${e.rarity.toUpperCase()}-Ei: ${e.workoutsCompleted}/${e.workoutsRequired} Workouts${e.requiresMinHRmax ? ` (≥${e.requiresMinHRmax}% HRmax)` : ''}${e.requiresConsecutive ? ' [consec]' : ''}`
    );
    Alert.alert('🥚 Ei-Status', lines.join('\n'));
  };

  // ── Boss/Blutwellen-Handlers ───────────────────────────────────────────────

  const handleSpawnBossGolem = () => {
    Alert.alert('🗿 Boss: Uralter Golem', '3-Phasen-Boss-Welle startet in 5 Sekunden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Starten',
        onPress: () => {
          const gs = useEngineStore.getState().gameState;
          const bossWave = waveService.generateBossWave('uralterGolem', gameStateRathausLevel(gs));
          const now = Date.now();
          const testWave = { ...bossWave, status: 'active' as const, announcedAt: now, arrivesAt: now + 5000 };
          const newGs = { ...gs, activeWave: testWave, nextWaveAt: now + 5000, waves: [...gs.waves, testWave] };
          useEngineStore.setState({ gameState: newGs });
          saveGameState(newGs);
          setTimeout(() => { useEngineStore.getState().triggerWaveResolution(); }, 5500);
        },
      },
    ]);
  };

  const handleSpawnBossHydra = () => {
    Alert.alert('🐍 Boss: Verderbnis-Hydra', '3-Köpfe-Boss-Welle startet in 5 Sekunden.', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Starten',
        onPress: () => {
          const gs = useEngineStore.getState().gameState;
          const bossWave = waveService.generateBossWave('verderbnisHydra', gameStateRathausLevel(gs));
          const now = Date.now();
          const testWave = { ...bossWave, status: 'active' as const, announcedAt: now, arrivesAt: now + 5000 };
          const newGs = { ...gs, activeWave: testWave, nextWaveAt: now + 5000, waves: [...gs.waves, testWave] };
          useEngineStore.setState({ gameState: newGs });
          saveGameState(newGs);
          setTimeout(() => { useEngineStore.getState().triggerWaveResolution(); }, 5500);
        },
      },
    ]);
  };

  const handleSpawnBloodWave = () => {
    const gs = useEngineStore.getState().gameState;
    const rathausLevel = gameStateRathausLevel(gs);
    const lastWorkout = gs.lastWorkoutDate ? new Date(gs.lastWorkoutDate).getTime() : Date.now() - 24 * 3600 * 1000;
    const baseWave = waveService.generateWave(rathausLevel, lastWorkout);
    const bloodWave = waveService.applyBloodWaveModifiers(baseWave);
    const now = Date.now();
    const testWave = { ...bloodWave, status: 'active' as const, announcedAt: now, arrivesAt: now + 5000 };
    const newGs = { ...gs, activeWave: testWave, nextWaveAt: now + 5000, waves: [...gs.waves, testWave] };
    useEngineStore.setState({ gameState: newGs });
    saveGameState(newGs);
    setTimeout(() => { useEngineStore.getState().triggerWaveResolution(); }, 5500);
    Alert.alert('🩸 Blutwelle', `Startet in 5s!\nAK: ~${Math.round(bloodWave.totalAttackPower)} (1.5× verstärkt)\nLoot: 2× bei Sieg`);
  };

  // ── Trophäen-Handlers ─────────────────────────────────────────────────────

  const handleAddGolemTrophy = () => {
    const trophy: Trophy = {
      id: `dev_trophy_golem_${Date.now().toString(36)}`,
      type: 'golemHerz',
      name: 'Golem-Herz',
      emoji: '💎',
      obtainedAt: Date.now(),
      gridPosition: null,
    };
    useEngineStore.getState().addTrophy(trophy);
    Alert.alert('🏆 Trophäe', 'Golem-Herz erhalten! Im Dorf platzierbar (leere Zelle antippen).');
  };

  const handleAddHydraTrophy = () => {
    const trophy: Trophy = {
      id: `dev_trophy_hydra_${Date.now().toString(36)}`,
      type: 'hydraSchuppe',
      name: 'Hydra-Schuppe',
      emoji: '🐍',
      obtainedAt: Date.now(),
      gridPosition: null,
    };
    useEngineStore.getState().addTrophy(trophy);
    Alert.alert('🏆 Trophäe', 'Hydra-Schuppe erhalten! Im Dorf platzierbar (leere Zelle antippen).');
  };

  const handleTriggerDragonUnlock = () => {
    Alert.alert('🐲 Drachen-Freischaltung', 'Drachen-Sequenz wird ausgelöst (Streak-Check wird ignoriert).', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Auslösen',
        onPress: () => {
          const gs = useEngineStore.getState().gameState;
          // Add dragon if not owned
          if (!gs.animals.some(a => a.type === 'uralterDrache')) {
            const dragon: Animal = {
              id: `dev_dragon_${Date.now().toString(36)}`,
              type: 'uralterDrache',
              name: ANIMAL_CONFIGS['uralterDrache'].name,
              rarity: 'legendary',
              assignment: { type: 'idle' },
              obtainedAt: Date.now(),
            };
            const newGs = { ...gs, animals: [...gs.animals, dragon] };
            useEngineStore.setState({ gameState: newGs, pendingDragonUnlock: true });
            saveGameState(newGs);
          } else {
            // Dragon already owned, just trigger animation
            useEngineStore.setState({ pendingDragonUnlock: true });
            Alert.alert('Drache', 'Drache bereits im Stall — Animation wird trotzdem gezeigt.');
          }
        },
      },
    ]);
  };

  const handleShowTrophyStatus = () => {
    const gs = useEngineStore.getState().gameState;
    if (gs.trophies.length === 0) { Alert.alert('Keine Trophäen', 'Noch keine Trophäen vorhanden.'); return; }
    const lines = gs.trophies.map(t =>
      `${t.emoji} ${t.name}: ${t.gridPosition ? `Platziert (${t.gridPosition.x},${t.gridPosition.y})` : 'Nicht platziert'}`
    );
    Alert.alert('🏆 Trophäen', lines.join('\n'));
  };

  // ── Streak-Simulationshelfer ───────────────────────────────────────────────

  const handleSimulateStreak30 = () => {
    const { devAddStreak } = useGameStore.getState();
    const es = useEngineStore.getState();
    const currentStreak = es.gameState.currentStreak ?? 0;
    const needed = Math.max(0, 30 - currentStreak);
    if (needed === 0) { Alert.alert('Streak', 'Streak ist bereits ≥ 30 Tage.'); return; }
    devAddStreak(needed);
    es.patchGameStateCurrencies({ currentStreak: currentStreak + needed });
    Alert.alert('🔥 Streak', `Streak auf 30 Tage gesetzt (war ${currentStreak}).`);
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

      {/* ── EIER ──────────────────────────────────────────────── */}
      <SectionLabel text="EIER" />
      <View style={s.grid}>
        <DevBtn label="🥚 Common-Ei" onPress={() => handleAddEgg('common')} />
        <DevBtn label="🥚 Uncommon-Ei" onPress={() => handleAddEgg('uncommon')} />
        <DevBtn label="🥚 Rare-Ei" onPress={() => handleAddEgg('rare')} />
        <DevBtn label="🥚 Epic-Ei" onPress={() => handleAddEgg('epic')} />
        <DevBtn label="🥚 Legendary-Ei" onPress={() => handleAddEgg('legendary')} />
        <DevBtn label="📊 Ei-Status" onPress={handleShowEggStatus} />
        <DevBtn label="+1 Workout alle" onPress={handleIncrementAllEggs} />
        <DevBtn label="🐣 Alle ausbrüten" onPress={handleHatchAllEggs} />
        <DevBtn label="🗑️ Alle löschen" onPress={handleClearAllEggs} />
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

      {/* ── MONSTERWELLEN ─────────────────────────────────────── */}
      <SectionLabel text="MONSTERWELLEN" />
      <View style={s.grid}>
        <DevBtn label="⚔️ Welle in 5s" onPress={handleSpawnWaveIn5s} />
        <DevBtn label="⚠️ Annäherungs-Banner" onPress={handleShowApproachingWave} />
        <DevBtn label="💀 Niederlage sim." onPress={handleSimulateDefeat} />
        <DevBtn label="🏆 Sieg sim." onPress={handleSimulateVictory} />
        <DevBtn label="🛡️ VP anzeigen" onPress={handleShowDefenseBreakdown} />
        <DevBtn label="🧹 Welle löschen" onPress={handleClearActiveWave} />
      </View>

      {/* ── BOSS & BLUTWELLEN ─────────────────────────────────── */}
      <SectionLabel text="BOSS & BLUTWELLEN" />
      <View style={s.grid}>
        <DevBtn label="🗿 Boss: Golem (5s)" onPress={handleSpawnBossGolem} />
        <DevBtn label="🐍 Boss: Hydra (5s)" onPress={handleSpawnBossHydra} />
        <DevBtn label="🩸 Blutwelle (5s)" onPress={handleSpawnBloodWave} />
      </View>

      {/* ── TROPHÄEN & DRACHE ─────────────────────────────────── */}
      <SectionLabel text="TROPHÄEN & DRACHE" />
      <View style={s.grid}>
        <DevBtn label="💎 Golem-Herz" onPress={handleAddGolemTrophy} />
        <DevBtn label="🐍 Hydra-Schuppe" onPress={handleAddHydraTrophy} />
        <DevBtn label="📋 Trophäen-Status" onPress={handleShowTrophyStatus} />
        <DevBtn label="🐲 Drachen-Sequenz" onPress={handleTriggerDragonUnlock} />
        <DevBtn label="🔥 Streak → 30d" onPress={handleSimulateStreak30} />
      </View>

      {/* ── MINIGAME ─────────────────────────────────────────── */}
      <SectionLabel text="MINIGAME" />
      <TouchableOpacity style={s.minigameBtn} onPress={() => nav.navigate('Minigame')} activeOpacity={0.75}>
        <MaterialCommunityIcons name="gamepad-variant" size={16} color="#42a5f5" />
        <View style={{ flex: 1 }}>
          <Text style={s.minigameBtnTitle}>🐻‍❄️ Eisbären-Fabrik öffnen</Text>
          <Text style={s.minigameBtnSub}>Idle-Tycoon Minigame (Feature-Branch)</Text>
        </View>
      </TouchableOpacity>

      {/* ── ONBOARDING ─────────────────────────────────────────── */}
      <SectionLabel text="ONBOARDING" />
      <TouchableOpacity style={s.minigameBtn} onPress={() => nav.navigate('Onboarding' as any)} activeOpacity={0.75}>
        <MaterialCommunityIcons name="book-open-variant" size={16} color="#F5A623" />
        <View style={{ flex: 1 }}>
          <Text style={[s.minigameBtnTitle, { color: '#F5A623' }]}>📖 Onboarding öffnen</Text>
          <Text style={s.minigameBtnSub}>Intro-Flow + HRmax-Eingabe</Text>
        </View>
      </TouchableOpacity>

      {/* ── SCHADENSEFFEKTE ───────────────────────────────────── */}
      <SectionLabel text="SCHADENSEFFEKTE" />
      <View style={s.grid}>
        <DevBtn label="🔥 Zufälligen Effekt" onPress={handleAddDamageEffect} />
        <DevBtn label="✅ Alle löschen" onPress={handleClearDamageEffects} />
      </View>

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
  minigameBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    backgroundColor: 'rgba(66,165,245,0.15)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(66,165,245,0.4)',
  },
  minigameBtnTitle: { fontSize: 13, fontWeight: '600', color: '#42a5f5' },
  minigameBtnSub: { fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
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
