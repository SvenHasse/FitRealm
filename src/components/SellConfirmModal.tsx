// SellConfirmModal.tsx
// FitRealm - Custom sell confirmation sheet with consequence breakdown + double-tap for danger actions

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SellConsequences, SellWarning } from '../engines/GameEngine';
import { ResourceCost } from '../config/GameConfig';
import { AppColors } from '../models/types';

interface Props {
  visible: boolean;
  buildingName: string;
  consequences: SellConsequences | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const SEVERITY_COLOR: Record<string, string> = {
  info:    '#64B5F6',
  warning: '#FFB74D',
  danger:  '#EF5350',
};

const SEVERITY_ICON: Record<string, string> = {
  info:    'information-circle-outline',
  warning: 'warning-outline',
  danger:  'alert-circle-outline',
};

function hasDanger(warnings: SellWarning[]): boolean {
  return warnings.some(w => w.severity === 'danger');
}

function ResourceRow({ label, cost }: { label: string; cost: ResourceCost }) {
  const parts: string[] = [];
  if (cost.muskelmasse > 0) parts.push(`${Math.floor(cost.muskelmasse)}g Muskel`);
  if (cost.protein      > 0) parts.push(`${Math.floor(cost.protein)} Protein`);
  if (cost.wood         > 0) parts.push(`${Math.floor(cost.wood)} Wood`);
  if (cost.stone        > 0) parts.push(`${Math.floor(cost.stone)} Stone`);
  if (cost.food         > 0) parts.push(`${Math.floor(cost.food)} Food`);
  if (cost.streakTokens > 0) parts.push(`${Math.floor(cost.streakTokens)} Tokens`);
  if (parts.length === 0) return null;
  return (
    <View style={styles.resourceRow}>
      <Text style={styles.resourceLabel}>{label}</Text>
      <Text style={styles.resourceValue}>{parts.join(' · ')}</Text>
    </View>
  );
}

export default function SellConfirmModal({
  visible, buildingName, consequences, onConfirm, onCancel,
}: Props) {
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const [needsDoubleConfirm, setNeedsDoubleConfirm] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setAwaitingConfirm(false);
      setNeedsDoubleConfirm(consequences ? hasDanger(consequences.warnings) : false);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, consequences]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleConfirmPress = () => {
    if (needsDoubleConfirm && !awaitingConfirm) {
      setAwaitingConfirm(true);
      triggerShake();
      // Reset after 3s if not tapped again
      setTimeout(() => setAwaitingConfirm(false), 3000);
    } else {
      onConfirm();
    }
  };

  if (!consequences) return null;

  const hasPending = consequences.pendingStorage.muskelmasse > 0
    || consequences.pendingStorage.protein > 0
    || consequences.pendingStorage.wood > 0
    || consequences.pendingStorage.stone > 0
    || consequences.pendingStorage.food > 0;

  const confirmBtnColor = awaitingConfirm ? '#D32F2F' : '#EF5350';
  const confirmBtnLabel = awaitingConfirm
    ? t('sell.dangerConfirmHint')
    : t('sell.confirmBtn');

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title */}
          <View style={styles.titleRow}>
            <Ionicons name="trash-outline" size={20} color="#EF5350" />
            <Text style={styles.titleText}>{t('sell.confirmTitle')}</Text>
          </View>
          <Text style={styles.subtitle}>{buildingName}</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Refund */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('sell.refundLabel')}</Text>
              <View style={styles.resourceBox}>
                <ResourceRow label="" cost={consequences.refund} />
              </View>
            </View>

            {/* Pending Storage */}
            {hasPending && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('sell.pendingLabel')}</Text>
                <View style={[styles.resourceBox, { borderColor: 'rgba(100,181,246,0.3)' }]}>
                  <ResourceRow label="" cost={consequences.pendingStorage} />
                </View>
              </View>
            )}

            {/* Warnings */}
            {consequences.warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('sell.warningLabel')}</Text>
                {consequences.warnings.map((w, i) => (
                  <WarningRow key={i} warning={w} t={t} />
                ))}
              </View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Buttons */}
          <Animated.View style={[styles.buttonRow, { transform: [{ translateX: shakeAnim }] }]}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>{t('sell.cancelBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: confirmBtnColor }]}
              onPress={handleConfirmPress}
            >
              <Ionicons name="trash" size={15} color="#fff" />
              <Text style={styles.confirmBtnText}>{confirmBtnLabel}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function WarningRow({ warning, t }: { warning: SellWarning; t: (key: string, opts?: any) => string }) {
  const color = SEVERITY_COLOR[warning.severity] ?? '#fff';
  const icon  = SEVERITY_ICON[warning.severity] ?? 'information-circle-outline';
  const message = t(warning.messageKey, warning.values ?? {});
  return (
    <View style={[styles.warningRow, { borderLeftColor: color, backgroundColor: `${color}14` }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.warningText, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#1E1E3A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  titleText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  scroll: { flexGrow: 0 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  resourceBox: {
    backgroundColor: '#252547', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  resourceRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  resourceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  resourceValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  warningRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 3, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  warningText: { fontSize: 13, flex: 1, lineHeight: 18 },
  buttonRow: {
    flexDirection: 'row', gap: 12, marginTop: 16,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  confirmBtn: {
    flex: 1.2, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 7,
  },
  confirmBtnText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});
