// SettingsScreen.tsx
// FitRealm - App settings, permissions, and debug tools
// Ported from SettingsView.swift

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { useGameStore } from '../store/gameStore';
import { AppColors } from '../models/types';
import { setLanguage } from '../i18n';

export default function SettingsScreen() {
  const {
    permissionStatus, recentWorkouts, useMockData,
    requestPermissions, toggleMockData,
    addVitacoinsManually, debugAddResources, resetAllData, resetGameState,
  } = useEngineStore();
  const {
    muskelmasse, protein, streakTokens, holz, nahrung, stein, currentStreak,
    devAddMuskelmasse, devAddProtein, devAddStreakTokens, devAddStreak,
    addHolz, addNahrung, devResetAll,
  } = useGameStore();
  const { t, i18n } = useTranslation();

  const [allowManualStepInput, setAllowManualStepInput] = useState(false);

  const handleReset = () => {
    Alert.alert(
      t('settings.resetTitle'),
      t('settings.resetMessage'),
      [
        { text: t('settings.resetCancel'), style: 'cancel' },
        { text: t('settings.resetConfirm'), style: 'destructive', onPress: () => resetAllData() },
      ]
    );
  };

  const currentLang = i18n.language as 'de' | 'en';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Language Switcher */}
      <View style={styles.card}>
        <SectionHeader title={t('settings.language')} icon="globe" />
        <View style={styles.langSwitcher}>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'de' && styles.langBtnActive]}
            onPress={() => setLanguage('de')}
          >
            <Text style={[styles.langBtnText, currentLang === 'de' && styles.langBtnTextActive]}>🇩🇪 Deutsch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>🇬🇧 English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Permissions Card */}
      <View style={styles.card}>
        <SectionHeader title={t('settings.healthPermissions')} icon="heart-half" />
        {Object.keys(permissionStatus).length === 0 ? (
          <EmptyNotice message={t('settings.permissionsNotDetermined')} />
        ) : (
          Object.entries(permissionStatus).map(([key, granted]) => (
            <PermissionRow key={key} name={key} granted={granted} />
          ))
        )}
        <TouchableOpacity style={styles.goldButton} onPress={requestPermissions}>
          <Ionicons name="lock-open" size={16} color="#000" />
          <Text style={styles.goldButtonText}>{t('settings.requestPermissions')}</Text>
        </TouchableOpacity>
      </View>

      {/* App Info Card */}
      <View style={styles.card}>
        <SectionHeader title={t('settings.appInfo')} icon="information-circle" />
        <InfoRow label={t('settings.version')} value={t('settings.versionValue')} />
        <InfoRow label={t('settings.totalWorkouts')} value={`${recentWorkouts.length}`} />
        <InfoRow label={t('settings.platform')} value={t('settings.platformValue')} />
      </View>

      {/* Preferences Card */}
      <View style={styles.card}>
        <SectionHeader title={t('settings.preferences')} icon="options" />
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>{t('settings.manualStepInput')}</Text>
            <Text style={styles.toggleSubtitle}>{t('settings.manualStepSubtitle')}</Text>
          </View>
          <Switch
            value={allowManualStepInput}
            onValueChange={setAllowManualStepInput}
            trackColor={{ true: AppColors.gold, false: '#555' }}
          />
        </View>
      </View>

      {/* Debug Card */}
      <View style={styles.debugCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="bug" size={16} color="#F44336" />
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#F44336' }}>{t('settings.debug')}</Text>
        </View>

        {/* Mock data toggle */}
        <View style={styles.mockToggleBox}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={16} color="#9C27B0" />
                <Text style={styles.toggleTitle}>{t('settings.useMockData')}</Text>
              </View>
              <Text style={styles.toggleSubtitle}>{t('settings.mockDataSubtitle')}</Text>
            </View>
            <Switch
              value={useMockData}
              onValueChange={() => toggleMockData()}
              trackColor={{ true: '#9C27B0', false: '#555' }}
            />
          </View>
        </View>

        <DebugButton title={t('settings.addVitacoins')} icon="add-circle" color={AppColors.gold} onPress={() => addVitacoinsManually(100)} />
        <DebugButton title={t('settings.addResources')} icon="add" color={AppColors.teal} onPress={debugAddResources} />
        <DebugButton title={t('settings.resetAllData')} icon="trash" color="#F44336" onPress={handleReset} />
        <DebugButton title={t('settings.resetVillage')} icon="refresh" color="#FF9800" onPress={resetGameState} />
      </View>

      {/* ── DEV TOOLS ──────────────────────────────────────────────── */}
      <DevToolsCard
        muskelmasse={muskelmasse}
        protein={protein}
        streakTokens={streakTokens}
        currentStreak={currentStreak}
        holz={holz}
        nahrung={nahrung}
        onAddMuskelmasse100={() => devAddMuskelmasse(100)}
        onAddMuskelmasse500={() => devAddMuskelmasse(500)}
        onAddProtein1={() => devAddProtein(1)}
        onAddProtein5={() => devAddProtein(5)}
        onAddToken1={() => devAddStreakTokens(1)}
        onAddToken5={() => devAddStreakTokens(5)}
        onAddStreak1={() => devAddStreak(1)}
        onAddStreak7={() => devAddStreak(7)}
        onAddHolz50={() => addHolz(50)}
        onAddNahrung100={() => addNahrung(100)}
        onReset={() => {
          devResetAll();
          Alert.alert('', 'Alle Werte zurückgesetzt');
        }}
      />

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
      <Ionicons name={icon as any} size={16} color={AppColors.gold} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: AppColors.textPrimary }}>{title}</Text>
    </View>
  );
}

function PermissionRow({ name, granted }: { name: string; granted: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <Ionicons
        name={granted ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={granted ? '#4CAF50' : '#F44336'}
      />
      <Text style={{ fontSize: 14, color: AppColors.textPrimary, marginLeft: 8, flex: 1 }}>{name}</Text>
      <Text style={{ fontSize: 11, color: granted ? '#4CAF50' : 'rgba(244,67,54,0.8)' }}>
        {granted ? t('settings.authorized') : t('settings.denied')}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 14, color: AppColors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: AppColors.textPrimary }}>{value}</Text>
    </View>
  );
}

function EmptyNotice({ message }: { message: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(0,180,216,0.1)', borderRadius: 10, marginBottom: 12 }}>
      <Ionicons name="information-circle" size={18} color={AppColors.teal} />
      <Text style={{ fontSize: 13, color: AppColors.textSecondary, flex: 1 }}>{message}</Text>
    </View>
  );
}

function DebugButton({ title, icon, color, onPress }: { title: string; icon: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.debugButton} onPress={onPress}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={{ fontSize: 14, fontWeight: '500', color: AppColors.textPrimary, flex: 1 }}>{title}</Text>
      <Ionicons name="chevron-forward" size={12} color={AppColors.textSecondary} />
    </TouchableOpacity>
  );
}

// ─── Dev Tools Card ───────────────────────────────────────────────────────────

interface DevToolsProps {
  muskelmasse: number; protein: number; streakTokens: number;
  currentStreak: number; holz: number; nahrung: number;
  onAddMuskelmasse100: () => void; onAddMuskelmasse500: () => void;
  onAddProtein1: () => void;       onAddProtein5: () => void;
  onAddToken1: () => void;         onAddToken5: () => void;
  onAddStreak1: () => void;        onAddStreak7: () => void;
  onAddHolz50: () => void;         onAddNahrung100: () => void;
  onReset: () => void;
}

function DevBtn({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      style={[devStyles.btn, danger && devStyles.btnDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[devStyles.btnText, danger && devStyles.btnTextDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DevToolsCard(p: DevToolsProps) {
  return (
    <View style={devStyles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <MaterialCommunityIcons name="code-braces" size={16} color="#9C27B0" />
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#9C27B0' }}>DEV TOOLS</Text>
      </View>

      {/* 2-column grid */}
      <View style={devStyles.grid}>
        <DevBtn label="+100g Muskelmasse" onPress={p.onAddMuskelmasse100} />
        <DevBtn label="+500g Muskelmasse" onPress={p.onAddMuskelmasse500} />
        <DevBtn label="+1 Protein"        onPress={p.onAddProtein1} />
        <DevBtn label="+5 Protein"        onPress={p.onAddProtein5} />
        <DevBtn label="+1 Streak Token"   onPress={p.onAddToken1} />
        <DevBtn label="+5 Streak Token"   onPress={p.onAddToken5} />
        <DevBtn label="+1 Streak Tag"     onPress={p.onAddStreak1} />
        <DevBtn label="+7 Streak Tage"    onPress={p.onAddStreak7} />
        <DevBtn label="+50 Holz"          onPress={p.onAddHolz50} />
        <DevBtn label="+100 Nahrung"      onPress={p.onAddNahrung100} />
      </View>

      {/* Reset — full-width red button */}
      <TouchableOpacity style={devStyles.resetBtn} onPress={p.onReset} activeOpacity={0.75}>
        <MaterialCommunityIcons name="delete-sweep" size={16} color="#F44336" />
        <Text style={devStyles.resetText}>Reset alle Währungen</Text>
      </TouchableOpacity>

      {/* Live values */}
      <View style={devStyles.valuesBox}>
        <Text style={devStyles.valuesText}>
          {'Muskelmasse: '}
          <Text style={{ color: AppColors.gold }}>{p.muskelmasse}g</Text>
          {'  |  Protein: '}
          <Text style={{ color: AppColors.teal }}>{p.protein}</Text>
          {'  |  Tokens: '}
          <Text style={{ color: '#FF6B35' }}>{p.streakTokens}</Text>
          {'\nStreak: '}
          <Text style={{ color: '#FF6B35' }}>{p.currentStreak} Tage</Text>
          {'  |  Holz: '}
          <Text style={{ color: AppColors.textPrimary }}>{p.holz}</Text>
          {'  |  Nahrung: '}
          <Text style={{ color: AppColors.textPrimary }}>{p.nahrung}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  langSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 3,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  langBtnActive: {
    backgroundColor: AppColors.gold,
  },
  langBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  langBtnTextActive: {
    color: '#000',
  },
  debugCard: {
    backgroundColor: 'rgba(244,67,54,0.07)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.2)',
    gap: 12,
    marginBottom: 16,
  },
  goldButton: {
    backgroundColor: AppColors.gold,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  goldButtonText: { fontSize: 15, fontWeight: '600', color: '#000' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '500', color: AppColors.textPrimary },
  toggleSubtitle: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
  mockToggleBox: {
    padding: 12,
    backgroundColor: 'rgba(156,39,176,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(156,39,176,0.3)',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(26,26,46,0.5)',
    borderRadius: 10,
  },
});

const devStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(156,39,176,0.07)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(156,39,176,0.25)',
    marginBottom: 16,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  btnDanger: {
    backgroundColor: 'rgba(244,67,54,0.15)',
    borderColor: '#F44336',
  },
  btnText: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textPrimary,
    textAlign: 'center',
  },
  btnTextDanger: {
    color: '#F44336',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(244,67,54,0.12)',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 10,
    paddingVertical: 10,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F44336',
  },
  valuesBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 8,
    padding: 10,
  },
  valuesText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
});
