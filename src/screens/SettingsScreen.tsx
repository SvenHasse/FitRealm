// SettingsScreen.tsx
// FitRealm - App settings + single consolidated dev tools section.

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { AppColors } from '../models/types';
import { setLanguage } from '../i18n';
import DevToolsSection from '../components/DevToolsSection';

export default function SettingsScreen() {
  const { permissionStatus, recentWorkouts, useMockData, requestPermissions, toggleMockData } = useEngineStore();
  const { t, i18n } = useTranslation();
  const [allowManualStepInput, setAllowManualStepInput] = useState(false);
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
            <Text style={[styles.langBtnText, currentLang === 'de' && styles.langBtnTextActive]}>Deutsch</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, currentLang === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langBtnText, currentLang === 'en' && styles.langBtnTextActive]}>English</Text>
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
      </View>

      {/* ── Single consolidated Dev Tools section ────────────── */}
      <DevToolsSection />

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
      <Ionicons name={granted ? 'checkmark-circle' : 'close-circle'} size={18} color={granted ? '#4CAF50' : '#F44336'} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { padding: 16, paddingTop: 8 },
  card: {
    backgroundColor: AppColors.cardBackground,
    borderRadius: 18, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  langSwitcher: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3,
  },
  langBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  langBtnActive: { backgroundColor: AppColors.gold },
  langBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  langBtnTextActive: { color: '#000' },
  goldButton: {
    backgroundColor: AppColors.gold, borderRadius: 12, paddingVertical: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12,
  },
  goldButtonText: { fontSize: 15, fontWeight: '600', color: '#000' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '500', color: AppColors.textPrimary },
  toggleSubtitle: { fontSize: 11, color: AppColors.textSecondary, marginTop: 2 },
  mockToggleBox: {
    padding: 12, backgroundColor: 'rgba(156,39,176,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(156,39,176,0.3)', marginTop: 12,
  },
});
