import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { BiomeId, BiomeState } from '../../features/exploration/types';
import { BIOME_CONFIGS } from '../../features/exploration/biomeConfig';
import { ANIMAL_FIT, AnimalFit, getFitColor, getFitLabel } from '../../features/exploration/animalFitConfig';

const ANIMAL_EMOJIS: Record<string, string> = {
  llama: '🦙', horse: '🐴', pig: '🐷', pug: '🐶', sheep: '🐑', cow: '🐄', zebra: '🦓',
};
const ANIMAL_NAMES: Record<string, string> = {
  llama: 'Lama', horse: 'Pferd', pig: 'Schwein', pug: 'Mops', sheep: 'Schaf', cow: 'Kuh', zebra: 'Zebra',
};

const FIT_ORDER: Record<AnimalFit, number> = { perfect: 0, good: 1, possible: 2 };

interface SendScoutModalProps {
  visible: boolean;
  biomeId: BiomeId;
  biomeState: BiomeState;
  onSend: (animalType: string) => void;
  onClose: () => void;
}

export default function SendScoutModal({ visible, biomeId, biomeState, onSend, onClose }: SendScoutModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const config = BIOME_CONFIGS[biomeId];
  const fits = ANIMAL_FIT[biomeId] ?? {};

  const animals = Object.entries(fits)
    .sort(([, a], [, b]) => FIT_ORDER[a.fit] - FIT_ORDER[b.fit]);

  // Scouting progress animation
  useEffect(() => {
    if (biomeState.status === 'scouting' && biomeState.mission) {
      const { departureTime, returnTime } = biomeState.mission;
      const total = returnTime - departureTime;
      const elapsed = Date.now() - departureTime;
      const startPct = Math.min(elapsed / total, 1);
      progressAnim.setValue(startPct);

      const remaining = returnTime - Date.now();
      if (remaining > 0) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: remaining,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [biomeState.status, biomeState.mission, progressAnim]);

  const isScouting = biomeState.status === 'scouting';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{config.emoji} {config.name} erkunden</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>{config.description}</Text>

          {isScouting && biomeState.mission ? (
            /* Scouting in progress */
            <View style={styles.scoutingContainer}>
              <Text style={styles.scoutingEmoji}>
                {ANIMAL_EMOJIS[biomeState.mission.animalType] ?? '🐾'}
              </Text>
              <Text style={styles.scoutingText}>
                {ANIMAL_NAMES[biomeState.mission.animalType] ?? biomeState.mission.animalType} ist unterwegs...
              </Text>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.scoutingSubtext}>
                Kommt zurück in ca. {Math.ceil(biomeState.mission.durationHours)} Stunden
              </Text>
            </View>
          ) : (
            /* Animal selection */
            <>
              <Text style={styles.sectionLabel}>Wähle einen Kundschafter:</Text>
              <ScrollView style={styles.animalList} showsVerticalScrollIndicator={false}>
                {animals.map(([key, info]) => {
                  const isSelected = selected === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.animalRow, isSelected && styles.animalRowSelected]}
                      onPress={() => setSelected(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.animalEmoji}>{ANIMAL_EMOJIS[key] ?? '🐾'}</Text>
                      <View style={styles.animalInfo}>
                        <View style={styles.animalNameRow}>
                          <Text style={styles.animalName}>{ANIMAL_NAMES[key] ?? key}</Text>
                          <View style={[styles.fitBadge, { backgroundColor: getFitColor(info.fit) }]}>
                            <Text style={styles.fitBadgeText}>{getFitLabel(info.fit)}</Text>
                          </View>
                        </View>
                        <Text style={styles.animalBonus}>{info.bonus}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={[styles.sendBtn, !selected && styles.sendBtnDisabled]}
                onPress={() => { if (selected) onSend(selected); }}
                disabled={!selected}
                activeOpacity={0.7}
              >
                <Text style={styles.sendBtnText}>
                  {selected
                    ? `${ANIMAL_EMOJIS[selected] ?? ''} ${ANIMAL_NAMES[selected] ?? selected} losschicken!`
                    : 'Tier auswählen...'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a2535',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFD700',
  },
  closeBtn: {
    fontSize: 20,
    color: '#aab4c2',
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#aab4c2',
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  animalList: {
    maxHeight: 300,
  },
  animalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#2a3545',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  animalRowSelected: {
    borderColor: '#FFD700',
  },
  animalEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  animalInfo: {
    flex: 1,
  },
  animalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  animalName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  fitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  animalBonus: {
    fontSize: 12,
    color: '#aab4c2',
    marginTop: 2,
  },
  sendBtn: {
    marginTop: 12,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#3a4555',
  },
  sendBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2535',
  },
  // Scouting progress
  scoutingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoutingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  scoutingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2a3545',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  scoutingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#aab4c2',
  },
});
