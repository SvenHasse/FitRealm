// AnimalSheet.tsx
// FitRealm - Tier-Management Bottom Sheet für den Stall

import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import {
  AppColors, Building, Animal, BuildingType, AnimalEgg,
  buildingDisplayName,
} from '../models/types';
import { ANIMAL_CONFIGS, STALL_CONFIG } from '../config/GameConfig';
import AnimalRenderer from '../../village-assets/components/AnimalRenderer';
import BuildingRenderer from '../../village-assets/components/BuildingRenderer';
import AnimalCollectionSheet from './AnimalCollectionSheet';

interface Props {
  stall: Building;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',
};

// Rarity labels now use i18n keys from animals section

export default function AnimalSheet({ stall, onClose }: Props) {
  const { t } = useTranslation();
  const store = useGameStore();
  const { gameState } = store;
  const [collectionVisible, setCollectionVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'animals' | 'eggs'>('animals');

  const stallLevel = stall.isUnderConstruction ? 0 : stall.level;
  const maxSlots = STALL_CONFIG.slotsPerLevel[Math.min(stallLevel, STALL_CONFIG.slotsPerLevel.length - 1)];
  const animals = gameState.animals;
  const eggs = gameState.eggs;

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: AppColors.gold, fontWeight: '600' }}>Schließen</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Stall</Text>
          <Text style={styles.subtitle}>
            {stall.isUnderConstruction
              ? 'Im Bau...'
              : `Level ${stallLevel} · ${animals.length}/${maxSlots} Slots`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.collectionBtn}
          onPress={() => setCollectionVisible(true)}
        >
          <Text style={styles.collectionBtnText}>Sammlung</Text>
        </TouchableOpacity>
      </View>

      {/* Tab-Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('animals')}
          style={[styles.tab, activeTab === 'animals' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'animals' && styles.tabTextActive]}>
            Tiere ({animals.length}/{maxSlots})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('eggs')}
          style={[styles.tab, activeTab === 'eggs' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'eggs' && styles.tabTextActive]}>
            Eier ({eggs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tier-Sammlung Sheet */}
      <AnimalCollectionSheet
        visible={collectionVisible}
        onClose={() => setCollectionVisible(false)}
      />

      {activeTab === 'animals' && (
        <>
          {/* Stall building visual */}
          <View style={styles.stallVisual}>
            <BuildingRenderer type="stall" level={Math.max(1, stallLevel) as any} size={60} />
            {stall.isUnderConstruction && (
              <View style={styles.constructionBadge}>
                <MaterialCommunityIcons name="hammer-wrench" size={14} color={AppColors.gold} />
                <Text style={styles.constructionText}>Im Bau</Text>
              </View>
            )}
          </View>

          {/* Animals */}
          {animals.length === 0 ? (
            <EmptyStallHint />
          ) : (
            animals.map(animal => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                stall={stall}
                stallLevel={stallLevel}
                gameState={gameState}
              />
            ))
          )}

          {/* Empty slot hints */}
          {Array.from({ length: Math.max(0, maxSlots - animals.length) }).map((_, i) => (
            <EmptySlotCard key={`empty-${i}`} />
          ))}

          {stallLevel === 0 && (
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#607D8B" />
              <Text style={styles.infoText}>
                Dein Stall muss zuerst fertiggebaut werden, bevor du Tiere zuweisen kannst.
              </Text>
            </View>
          )}
        </>
      )}

      {activeTab === 'eggs' && (
        <>
          {eggs.length === 0 ? (
            <View style={styles.emptyHint}>
              <Text style={{ fontSize: 32 }}>🥚</Text>
              <Text style={styles.emptyHintTitle}>Noch keine Eier</Text>
              <Text style={styles.emptyHintText}>
                Erhalte Eier als Loot aus Monsterkämpfen oder durch Streaks.
              </Text>
            </View>
          ) : (
            eggs.map(egg => (
              <EggCard key={egg.id} egg={egg} />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function AnimalCard({ animal, stall, stallLevel, gameState }: {
  animal: Animal;
  stall: Building;
  stallLevel: number;
  gameState: any;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslation();
  const store = useGameStore();
  const cfg = ANIMAL_CONFIGS[animal.type];
  const rarityColor = RARITY_COLORS[animal.rarity] ?? '#9E9E9E';

  const assignmentLabel = () => {
    if (animal.assignment.type === 'idle') return 'Nicht zugewiesen';
    if (animal.assignment.type === 'defense') return 'Verteidigung';
    if (animal.assignment.type === 'building') {
      const bid = (animal.assignment as any).buildingId;
      const b = gameState.buildings.find((b: any) => b.id === bid);
      return b ? buildingDisplayName(b.type) : t('animalSheet.assignmentBuilding');
    }
    return t('animalSheet.assignmentUnknown');
  };

  const handleRelease = () => {
    Alert.alert(
      t('animalSheet.releaseTitle', { name: t(cfg.nameKey) }),
      t('animalSheet.releaseMessage', { name: t(cfg.nameKey) }),
      [
        { text: t('animalSheet.releaseCancel'), style: 'cancel' },
        {
          text: t('animalSheet.releaseConfirm'),
          style: 'destructive',
          onPress: () => store.removeAnimal(animal.id),
        },
      ],
    );
  };

  // Valid assignment targets for this animal
  const validBuildings = gameState.buildings.filter((b: any) => {
    if (b.level < 1 || b.isUnderConstruction) return false;
    // Check if building type matches animal's target
    if (cfg.buildingBonus.targetBuilding === '*') return true;
    return b.type === cfg.buildingBonus.targetBuilding;
  });

  const handleAssign = (assignment: any) => {
    store.assignAnimal(animal.id, assignment);
    setShowDropdown(false);
  };

  const bonusText = () => {
    if (cfg.buildingBonus.bonusType === 'production') return t('animalSheet.bonusProduction', { pct: cfg.buildingBonus.bonusPercent });
    if (cfg.buildingBonus.bonusType === 'storage') return t('animalSheet.bonusStorage', { pct: cfg.buildingBonus.bonusPercent });
    if (cfg.buildingBonus.bonusType === 'speed') return t('animalSheet.bonusSpeed', { pct: cfg.buildingBonus.bonusPercent });
    if (cfg.buildingBonus.bonusType === 'global') return t('animalSheet.bonusGlobal', { pct: cfg.buildingBonus.bonusPercent });
    return '';
  };

  return (
    <View style={[styles.animalCard, { borderColor: rarityColor }]}>
      {/* Animal header */}
      <View style={styles.animalHeader}>
        <View style={styles.animalSpriteContainer}>
          <AnimalRenderer type={animal.type} size={36} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.animalName}>{t(cfg.nameKey)}</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '30', borderColor: rarityColor }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {t(`animals.rarity${animal.rarity.charAt(0).toUpperCase()}${animal.rarity.slice(1)}`)}
              </Text>
            </View>
          </View>
          <Text style={styles.assignmentText}>
            <MaterialCommunityIcons name="map-marker" size={11} color="#607D8B" />
            {' '}{assignmentLabel()}
          </Text>
          {animal.assignment.type === 'defense' && cfg.defenseVP > 0 && (
            <Text style={styles.vpText}>+{cfg.defenseVP} VP</Text>
          )}
        </View>
      </View>

      {/* Bonus info */}
      {cfg.buildingBonus.bonusPercent > 0 && (
        <View style={styles.bonusRow}>
          <MaterialCommunityIcons name="lightning-bolt" size={13} color="#F5A623" />
          <Text style={styles.bonusText}>{bonusText()}</Text>
          {cfg.specialAbilityKey && (
            <Text style={styles.abilityText}> · {t(cfg.specialAbilityKey!)}</Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => setShowDropdown(v => !v)}
          disabled={stallLevel < 1}
        >
          <MaterialCommunityIcons name="arrow-decision" size={14} color={stallLevel < 1 ? '#444' : AppColors.teal} />
          <Text style={[styles.assignBtnText, stallLevel < 1 && { color: '#444' }]}>Umweisen</Text>
          <MaterialCommunityIcons
            name={showDropdown ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={stallLevel < 1 ? '#444' : AppColors.teal}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.releaseBtn} onPress={handleRelease}>
          <MaterialCommunityIcons name="heart-broken" size={14} color="#ef5350" />
          <Text style={styles.releaseBtnText}>{t('animalSheet.releaseButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Assignment dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <DropdownItem
            label="Nicht zugewiesen"
            icon="sleep"
            color="#9E9E9E"
            onPress={() => handleAssign({ type: 'idle' })}
            active={animal.assignment.type === 'idle'}
          />
          <DropdownItem
            label={`Verteidigung${cfg.defenseVP > 0 ? ` (+${cfg.defenseVP} VP)` : ''}`}
            icon="shield-sword"
            color="#EF5350"
            onPress={() => handleAssign({ type: 'defense' })}
            active={animal.assignment.type === 'defense'}
          />
          {validBuildings.map((b: any) => (
            <DropdownItem
              key={b.id}
              label={`${buildingDisplayName(b.type)} L${b.level} · ${bonusText()}`}
              icon="home-city"
              color={AppColors.teal}
              onPress={() => handleAssign({ type: 'building', buildingId: b.id })}
              active={
                animal.assignment.type === 'building' &&
                (animal.assignment as any).buildingId === b.id
              }
            />
          ))}
          {validBuildings.length === 0 && (
            <Text style={styles.noTargetText}>
              Kein passendes Gebäude vorhanden.
              {cfg.buildingBonus.targetBuilding !== '*'
                ? ` Baue zuerst: ${cfg.buildingBonus.targetBuilding}`
                : ''}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function DropdownItem({ label, icon, color, onPress, active }: {
  label: string; icon: string; color: string; onPress: () => void; active: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.dropdownItem, active && styles.dropdownItemActive]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      <Text style={[styles.dropdownItemText, active && { color: AppColors.teal }]}>{label}</Text>
      {active && <MaterialCommunityIcons name="check" size={14} color={AppColors.teal} />}
    </TouchableOpacity>
  );
}

function EmptySlotCard() {
  return (
    <View style={styles.emptySlot}>
      <MaterialCommunityIcons name="paw" size={20} color="rgba(255,255,255,0.15)" />
      <Text style={styles.emptySlotText}>Leerer Slot</Text>
      <Text style={styles.emptySlotHint}>
        Erhalte Tiere durch Streaks, Erkundung oder Monster-Loot
      </Text>
    </View>
  );
}

function EggCard({ egg }: { egg: AnimalEgg }) {
  const { t } = useTranslation();
  const rarityColor = RARITY_COLORS[egg.rarity] ?? '#9E9E9E';
  const progress = egg.workoutsRequired > 0 ? egg.workoutsCompleted / egg.workoutsRequired : 0;
  const isEpicOrLegendary = egg.rarity === 'epic' || egg.rarity === 'legendary';
  const animalName = isEpicOrLegendary
    ? '???'
    : (ANIMAL_CONFIGS[egg.hatchesInto]?.nameKey ? t(ANIMAL_CONFIGS[egg.hatchesInto].nameKey) : egg.hatchesInto);

  const rarityLabel = t(`animals.rarity${egg.rarity.charAt(0).toUpperCase()}${egg.rarity.slice(1)}`);

  return (
    <View style={[styles.eggCard, { borderColor: rarityColor }]}>
      <View style={styles.eggHeader}>
        <Text style={styles.eggEmoji}>🥚</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.eggTitle}>{rarityLabel}-Ei</Text>
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '30', borderColor: rarityColor }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>{rarityLabel}</Text>
            </View>
          </View>
          <Text style={styles.eggAnimalName}>{animalName}</Text>
        </View>
      </View>

      {/* Fortschrittsbalken */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: rarityColor }]} />
      </View>
      <Text style={styles.progressText}>{egg.workoutsCompleted}/{egg.workoutsRequired} Workouts</Text>

      {/* Hinweise */}
      {egg.requiresMinHRmax !== null && (
        <Text style={styles.eggHint}>
          Nur Workouts mit mindestens {egg.requiresMinHRmax}% HRmax zählen!
        </Text>
      )}
      {egg.requiresConsecutive && (
        <Text style={styles.eggHintConsecutive}>
          Aufeinanderfolgende Workouts nötig! Pausieren setzt den Fortschritt zurück.
        </Text>
      )}
    </View>
  );
}

function EmptyStallHint() {
  return (
    <View style={styles.emptyHint}>
      <MaterialCommunityIcons name="paw" size={32} color="rgba(255,255,255,0.15)" />
      <Text style={styles.emptyHintTitle}>Noch keine Tiere</Text>
      <Text style={styles.emptyHintText}>
        Erhalte Tiere durch Streaks, Erkundungsreisen oder als Loot aus Monsterkämpfen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1A1C2A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 12,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  collectionBtn: {
    backgroundColor: 'rgba(0,180,216,0.12)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,180,216,0.3)',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  collectionBtnText: { fontSize: 12, color: AppColors.teal, fontWeight: '600' },
  stallVisual: { alignItems: 'center', paddingVertical: 12 },
  constructionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(245,166,35,0.15)', borderRadius: 8, padding: 6,
    marginTop: 8,
  },
  constructionText: { fontSize: 12, color: AppColors.gold },
  animalCard: {
    backgroundColor: '#252547', borderRadius: 12, borderWidth: 1.5,
    padding: 12, marginBottom: 10, gap: 8,
  },
  animalHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  animalSpriteContainer: {
    width: 44, height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  animalName: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  rarityBadge: {
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  rarityText: { fontSize: 10, fontWeight: '600' },
  assignmentText: { fontSize: 12, color: '#607D8B', marginTop: 3 },
  vpText: { fontSize: 11, color: '#EF5350', marginTop: 2 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bonusText: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  abilityText: { fontSize: 11, color: '#9E9E9E', flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  assignBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: 'rgba(0,180,216,0.12)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,180,216,0.25)',
    paddingVertical: 7,
  },
  assignBtnText: { fontSize: 13, color: AppColors.teal, fontWeight: '600' },
  releaseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: 'rgba(239,83,80,0.1)',
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,83,80,0.25)',
    paddingVertical: 7,
  },
  releaseBtnText: { fontSize: 13, color: '#ef5350', fontWeight: '600' },
  dropdown: {
    backgroundColor: '#1A1D2C', borderRadius: 8, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItemActive: { backgroundColor: 'rgba(0,180,216,0.08)' },
  dropdownItemText: { fontSize: 13, color: '#d0d4e0', flex: 1 },
  noTargetText: { fontSize: 12, color: '#4A4F68', padding: 10, fontStyle: 'italic' },
  emptySlot: {
    backgroundColor: '#1D1F30', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dashed', padding: 14, alignItems: 'center', marginBottom: 8, gap: 4,
  },
  emptySlotText: { fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },
  emptySlotHint: { fontSize: 11, color: 'rgba(255,255,255,0.12)', textAlign: 'center' },
  emptyHint: { alignItems: 'center', padding: 24, gap: 8 },
  emptyHintTitle: { fontSize: 15, color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  emptyHintText: { fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 18 },
  infoCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: 'rgba(96,125,139,0.1)', borderRadius: 8, padding: 10, marginTop: 4,
  },
  infoText: { fontSize: 12, color: '#607D8B', flex: 1, lineHeight: 17 },
  tabBar: {
    flexDirection: 'row', borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12,
  },
  tab: {
    flex: 1, paddingVertical: 9, alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(0,180,216,0.15)',
    borderBottomWidth: 2, borderBottomColor: AppColors.teal,
  },
  tabText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  tabTextActive: { color: AppColors.teal },
  eggCard: {
    backgroundColor: '#252547', borderRadius: 12, borderWidth: 1.5,
    padding: 12, marginBottom: 10, gap: 8,
  },
  eggHeader: { flexDirection: 'row', alignItems: 'center' },
  eggEmoji: { fontSize: 28 },
  eggTitle: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  eggAnimalName: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'right' },
  eggHint: { fontSize: 11, color: '#FF9800', fontStyle: 'italic' },
  eggHintConsecutive: { fontSize: 11, color: '#9C27B0', fontStyle: 'italic' },
});
