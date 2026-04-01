// SettingsScreen.tsx
// FitRealm - App settings + single consolidated dev tools section.

import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import GameIcon from '../components/GameIcon';
import { useTranslation } from 'react-i18next';
import { useGameStore as useEngineStore } from '../store/useGameStore';
import { AppColors, FitnessFocus } from '../models/types';
import { setLanguage } from '../i18n';
import DevToolsSection from '../components/DevToolsSection';
import { isFocusGoalLocked, getFocusGoalUnlockDaysRemaining } from '../utils/focusGoalUtils';
import { DEV } from '../config/developerConfig';

function promptForValue(title: string, current: string, onConfirm: (val: string) => void) {
  if (Platform.OS === 'ios') {
    Alert.prompt(title, undefined, (text) => {
      if (text && text.trim()) onConfirm(text.trim());
    }, 'plain-text', current);
  } else {
    // Android fallback: Alert doesn't support prompt
    Alert.alert(title, `${current}`, [{ text: 'OK' }]);
  }
}

export default function SettingsScreen() {
  const { permissionStatus, recentWorkouts, useMockData, requestPermissions, toggleMockData } = useEngineStore();
  const userProfile = useEngineStore(s => s.userProfile);
  const updateUserProfile = useEngineStore(s => s.updateUserProfile);
  const { t, i18n } = useTranslation();
  const [allowManualStepInput, setAllowManualStepInput] = useState(false);
  const currentLang = i18n.language as 'de' | 'en';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* My Profile Card */}
      {userProfile && (
        <View style={styles.card}>
          <SectionHeader title={t('settings.myProfile')} icon="person" />

          <ProfileRow
            label={t('settings.profileAge')}
            value={`${userProfile.age}`}
            unit={t('settings.profileYears')}
            onEdit={() => promptForValue(t('settings.profileAge'), `${userProfile.age}`, (v) => {
              const n = parseInt(v, 10);
              if (n >= 14 && n <= 99) updateUserProfile({ age: n });
            })}
          />
          <ProfileRow
            label={t('settings.profileWeight')}
            value={`${userProfile.weight}`}
            unit="kg"
            onEdit={() => promptForValue(t('settings.profileWeight'), `${userProfile.weight}`, (v) => {
              const n = parseInt(v, 10);
              if (n >= 30 && n <= 250) updateUserProfile({ weight: n });
            })}
          />
          <ProfileRow
            label={t('settings.profileHeight')}
            value={`${userProfile.height}`}
            unit="cm"
            onEdit={() => promptForValue(t('settings.profileHeight'), `${userProfile.height}`, (v) => {
              const n = parseInt(v, 10);
              if (n >= 100 && n <= 230) updateUserProfile({ height: n });
            })}
          />
          <ProfileRow
            label={t('settings.profileGender')}
            value={userProfile.gender === 'male' ? t('onboarding.male') : t('onboarding.female')}
            onEdit={() => {
              Alert.alert(t('settings.profileGender'), '', [
                { text: t('onboarding.male'), onPress: () => updateUserProfile({ gender: 'male' }) },
                { text: t('onboarding.female'), onPress: () => updateUserProfile({ gender: 'female' }) },
                { text: t('common.cancel'), style: 'cancel' },
              ]);
            }}
          />

          {/* HRmax display */}
          <View style={styles.hrMaxDisplay}>
            <Text style={styles.hrMaxLabel}>HRmax</Text>
            <Text style={styles.hrMaxValue}>{userProfile.hrMax}</Text>
            <Text style={styles.hrMaxUnit}>bpm</Text>
          </View>

          {/* Fitness Focus picker — locked for 14 days after a change */}
          {(() => {
            const lastChanged = userProfile.focusGoalLastChangedAt ?? 0;
            const focusLocked = DEV.FOCUS_GOAL_LOCK_ENABLED
              ? isFocusGoalLocked(lastChanged)
              : false;
            const daysLeft    = getFocusGoalUnlockDaysRemaining(lastChanged);
            return (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: AppColors.textSecondary }}>
                    {t('settings.fitnessFocus')}
                  </Text>
                  {focusLocked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={10} color="#FF9800" />
                      <Text style={styles.lockBadgeText}>{daysLeft}d</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.focusSwitcher, focusLocked && styles.focusSwitcherLocked]}>
                  {(['ausdauer', 'diaet', 'muskelaufbau'] as FitnessFocus[]).map(f => {
                    const focusLabels: Record<FitnessFocus, string> = {
                      ausdauer: 'Ausdauer',
                      diaet: 'Diät',
                      muskelaufbau: 'Muskel',
                    };
                    return (
                    <TouchableOpacity
                      key={f}
                      style={[
                        styles.focusBtn,
                        userProfile.fitnessFocus === f && styles.focusBtnActive,
                        focusLocked && styles.focusBtnDisabled,
                      ]}
                      onPress={() => {
                        if (focusLocked) {
                          Alert.alert(
                            'Streak-Ziel gesperrt',
                            `Du kannst dein Fitness-Ziel erst in ${daysLeft} ${daysLeft === 1 ? 'Tag' : 'Tagen'} wieder ändern.\n\nBleib dabei, um deinen Streak konsistent zu halten!`,
                            [{ text: 'Verstanden' }],
                          );
                          return;
                        }
                        // Already on this focus — nothing to do
                        if (f === userProfile.fitnessFocus) return;
                        Alert.alert(
                          'Fitness-Ziel ändern?',
                          `Du wechselst dein Streak-Ziel zu „${focusLabels[f]}".\n\n⚠️ Die Auswahl wird danach für 14 Tage gesperrt — wähle bewusst!`,
                          [
                            { text: 'Abbrechen', style: 'cancel' },
                            {
                              text: 'Ja, ändern',
                              style: 'destructive',
                              onPress: () => updateUserProfile({ fitnessFocus: f }),
                            },
                          ],
                        );
                      }}
                      activeOpacity={focusLocked ? 1 : 0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {f === 'diaet' && <GameIcon name="streak" size={16} color={userProfile.fitnessFocus === f ? '#000' : 'rgba(255,255,255,0.6)'} />}
                        {f === 'muskelaufbau' && <GameIcon name="mm" size={16} color={userProfile.fitnessFocus === f ? '#000' : 'rgba(255,255,255,0.6)'} />}
                        {f === 'ausdauer' && <MaterialCommunityIcons name="run-fast" size={16} color={userProfile.fitnessFocus === f ? '#000' : '#4A90D9'} />}
                        <Text style={[styles.focusBtnText, userProfile.fitnessFocus === f && styles.focusBtnTextActive, focusLocked && styles.focusBtnTextDisabled]}>
                          {focusLabels[f]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    );
                  })}
                </View>
                {focusLocked && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <GameIcon name="lock" size={12} color="rgba(255,152,0,0.8)" />
                    <Text style={styles.focusLockHint}>
                      Ziel ist für {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} gesperrt — bleib dabei, um deinen Streak zu schützen.
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      )}

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

function ProfileRow({ label, value, unit, onEdit }: { label: string; value: string; unit?: string; onEdit: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
      <Text style={{ fontSize: 14, color: AppColors.textSecondary, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: AppColors.textPrimary }}>
        {value}{unit ? ` ${unit}` : ''}
      </Text>
      <TouchableOpacity onPress={onEdit} style={{ marginLeft: 10, padding: 4 }}>
        <Ionicons name="pencil" size={16} color={AppColors.gold} />
      </TouchableOpacity>
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
  focusSwitcher: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 3,
  },
  focusSwitcherLocked: {
    opacity: 0.6,
  },
  focusBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  focusBtnActive: { backgroundColor: AppColors.gold },
  focusBtnDisabled: {},
  focusBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  focusBtnTextActive: { color: '#000' },
  focusBtnTextDisabled: {},
  lockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,152,0,0.4)',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  lockBadgeText: { fontSize: 10, fontWeight: '700', color: '#FF9800' },
  focusLockHint: {
    fontSize: 11,
    color: 'rgba(255,152,0,0.8)',
    marginTop: 8,
    lineHeight: 16,
  },
  hrMaxDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
  },
  hrMaxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hrMaxValue: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.gold,
  },
  hrMaxUnit: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
});
