// AnimalCollectionSheet.tsx
// FitRealm - Tier-Sammlung: Alle 9 Tiere mit Status, Fortschritt und Detail-Ansicht

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGameStore } from '../store/useGameStore';
import { AppColors, AnimalType } from '../models/types';
import { ANIMAL_CONFIGS } from '../config/EntityConfig';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Gewöhnlich',
  uncommon: 'Ungewöhnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendär',
};

const ALL_ANIMAL_TYPES: AnimalType[] = [
  'erntehuhn',
  'lastesel',
  'holzbaer',
  'spaehfalke',
  'steinbock',
  'mystischerHirsch',
  'kriegswolf',
  'gluecksphoenixt',
  'uralterDrache',
];

const UNLOCK_CONDITIONS: Record<AnimalType, string> = {
  erntehuhn: '✅ Starter-Tier (beim ersten Stall)',
  lastesel: '🔒 3-Tage-Streak',
  holzbaer: '🔒 7-Tage-Streak',
  spaehfalke: '🔒 5× 70% HRmax-Workouts/Woche',
  steinbock: '🔒 14-Tage-Streak',
  mystischerHirsch: '🔒 10× 70% HRmax in 14 Tagen',
  kriegswolf: '🔒 21-Tage-Streak + Rathaus L3',
  gluecksphoenixt: '🔒 Legendäres Ei ausbrüten',
  uralterDrache: '🔒 Boss besiegen + 30-Tage Streak',
};

export default function AnimalCollectionSheet({ visible, onClose }: Props) {
  const { gameState } = useGameStore();
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType | null>(null);

  const ownedTypes = new Set(gameState.animals.map(a => a.type));
  const ownedCount = ownedTypes.size;
  const tracker = gameState.intensiveWorkoutTracker;

  const getProgress = (type: AnimalType): string | null => {
    if (type === 'spaehfalke') {
      return `${Math.min(tracker?.weeklyCount ?? 0, 5)}/5 HRmax-Workouts diese Woche`;
    }
    if (type === 'mystischerHirsch') {
      return `${Math.min(tracker?.biweeklyCount ?? 0, 10)}/10 HRmax-Workouts in 14 Tagen`;
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={22} color={AppColors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Tier-Sammlung</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{ownedCount}/9</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(ownedCount / 9) * 100}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{ownedCount} von 9 Tieren entdeckt</Text>
        </View>

        {/* Animal list */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {ALL_ANIMAL_TYPES.map(type => {
            const cfg = ANIMAL_CONFIGS[type];
            const owned = ownedTypes.has(type);
            const rarityColor = RARITY_COLORS[cfg.rarity];
            const progress = getProgress(type);

            return (
              <TouchableOpacity
                key={type}
                style={[styles.animalRow, owned && { borderColor: rarityColor + '60' }]}
                onPress={() => setSelectedAnimal(type)}
                activeOpacity={0.7}
              >
                {/* Sprite */}
                <View style={[styles.spriteBox, !owned && styles.spriteBoxLocked]}>
                  <View style={{ opacity: owned ? 1 : 0.3 }}>
                    <AnimalRenderer type={type} size={36} />
                  </View>
                  {!owned && (
                    <View style={styles.lockOverlay}>
                      <MaterialCommunityIcons name="lock" size={14} color="rgba(255,255,255,0.5)" />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={styles.animalInfo}>
                  <View style={styles.animalNameRow}>
                    <Text style={styles.animalEmoji}>{cfg.emoji}</Text>
                    <Text style={[styles.animalName, !owned && styles.animalNameLocked]}>
                      {cfg.name}
                    </Text>
                    {owned && (
                      <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '25', borderColor: rarityColor }]}>
                        <Text style={[styles.rarityText, { color: rarityColor }]}>
                          {RARITY_LABELS[cfg.rarity]}
                        </Text>
                      </View>
                    )}
                  </View>

                  {owned ? (
                    <View style={styles.ownedStats}>
                      <MaterialCommunityIcons name="check-circle" size={12} color="#4CAF50" />
                      <Text style={styles.ownedText}> Erhalten</Text>
                      {cfg.buildingBonus.bonusPercent > 0 && (
                        <Text style={styles.statText}>
                          {' · '}+{cfg.buildingBonus.bonusPercent}% {cfg.buildingBonus.bonusType === 'production' ? 'Prod.' : cfg.buildingBonus.bonusType === 'storage' ? 'Lager' : cfg.buildingBonus.bonusType === 'speed' ? 'Geschw.' : 'Global'}
                        </Text>
                      )}
                      {cfg.defenseVP > 0 && (
                        <Text style={styles.statText}>{' · '}{cfg.defenseVP} VP</Text>
                      )}
                    </View>
                  ) : (
                    <View>
                      <Text style={styles.conditionText}>{UNLOCK_CONDITIONS[type]}</Text>
                      {progress && (
                        <Text style={styles.progressText}>{progress}</Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Chevron */}
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={18}
                  color="rgba(255,255,255,0.2)"
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Detail Modal */}
      {selectedAnimal && (
        <AnimalDetailModal
          type={selectedAnimal}
          owned={ownedTypes.has(selectedAnimal)}
          tracker={tracker}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </Modal>
  );
}

function AnimalDetailModal({
  type,
  owned,
  tracker,
  onClose,
}: {
  type: AnimalType;
  owned: boolean;
  tracker: { weeklyCount: number; biweeklyCount: number };
  onClose: () => void;
}) {
  const cfg = ANIMAL_CONFIGS[type];
  const rarityColor = RARITY_COLORS[cfg.rarity];
  const progress = type === 'spaehfalke'
    ? `${Math.min(tracker?.weeklyCount ?? 0, 5)}/5 HRmax-Workouts diese Woche`
    : type === 'mystischerHirsch'
    ? `${Math.min(tracker?.biweeklyCount ?? 0, 10)}/10 HRmax-Workouts in 14 Tagen`
    : null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          {/* Close */}
          <TouchableOpacity style={styles.detailClose} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>

          {/* Sprite */}
          <View style={[styles.detailSprite, { opacity: owned ? 1 : 0.3 }]}>
            <AnimalRenderer type={type} size={56} />
          </View>

          {/* Name + Rarity */}
          <Text style={styles.detailEmoji}>{cfg.emoji}</Text>
          <Text style={styles.detailName}>{cfg.name}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '25', borderColor: rarityColor, alignSelf: 'center', marginBottom: 12 }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>{RARITY_LABELS[cfg.rarity]}</Text>
          </View>

          {/* Flavor text */}
          <Text style={styles.flavorText}>{cfg.flavorText}</Text>

          {owned ? (
            <View style={styles.detailStats}>
              {cfg.buildingBonus.bonusPercent > 0 && (
                <View style={styles.detailStatRow}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color={AppColors.gold} />
                  <Text style={styles.detailStatText}>
                    +{cfg.buildingBonus.bonusPercent}% Produktion ({cfg.buildingBonus.targetBuilding})
                  </Text>
                </View>
              )}
              {cfg.defenseVP > 0 && (
                <View style={styles.detailStatRow}>
                  <MaterialCommunityIcons name="shield" size={14} color="#EF5350" />
                  <Text style={styles.detailStatText}>+{cfg.defenseVP} Verteidigungspunkte</Text>
                </View>
              )}
              {cfg.specialAbility && (
                <View style={styles.detailStatRow}>
                  <MaterialCommunityIcons name="star" size={14} color="#9C27B0" />
                  <Text style={styles.detailStatText}>{cfg.specialAbility}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.lockedInfo}>
              <MaterialCommunityIcons name="lock" size={20} color="#607D8B" />
              <Text style={styles.lockedTitle}>Noch nicht freigeschaltet</Text>
              <Text style={styles.lockedCondition}>{UNLOCK_CONDITIONS[type]}</Text>
              {progress && (
                <View style={styles.progressRow}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={AppColors.teal} />
                  <Text style={styles.detailProgressText}>{progress}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1C2A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  countBadge: {
    backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(245,166,35,0.4)',
  },
  countText: { fontSize: 13, color: AppColors.gold, fontWeight: '700' },
  progressContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: AppColors.gold, borderRadius: 2 },
  progressLabel: { fontSize: 11, color: AppColors.textSecondary, marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 32 },
  animalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#252547', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 10, marginBottom: 8,
  },
  spriteBox: {
    width: 48, height: 48,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  spriteBoxLocked: { backgroundColor: 'rgba(0,0,0,0.2)' },
  lockOverlay: {
    position: 'absolute', bottom: 2, right: 2,
  },
  animalInfo: { flex: 1 },
  animalNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  animalEmoji: { fontSize: 14 },
  animalName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  animalNameLocked: { color: 'rgba(255,255,255,0.4)' },
  rarityBadge: {
    borderWidth: 1, borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  rarityText: { fontSize: 9, fontWeight: '700' },
  ownedStats: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  ownedText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  statText: { fontSize: 11, color: AppColors.textSecondary },
  conditionText: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  progressText: { fontSize: 10, color: AppColors.teal, marginTop: 2 },
  // Detail modal
  detailOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  detailCard: {
    backgroundColor: '#252547', borderRadius: 20,
    padding: 24, width: '100%', maxWidth: 360, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  detailClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  detailSprite: { marginBottom: 8 },
  detailEmoji: { fontSize: 28, marginBottom: 4 },
  detailName: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  flavorText: {
    fontSize: 13, color: AppColors.textSecondary, textAlign: 'center',
    fontStyle: 'italic', lineHeight: 18, marginBottom: 16,
  },
  detailStats: { width: '100%', gap: 8 },
  detailStatRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailStatText: { fontSize: 13, color: '#d0d4e0', flex: 1 },
  lockedInfo: { alignItems: 'center', gap: 6 },
  lockedTitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  lockedCondition: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  detailProgressText: { fontSize: 12, color: AppColors.teal },
});
