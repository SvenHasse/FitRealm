import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BiomeId } from '../../features/exploration/types';
import { BIOME_CONFIGS } from '../../features/exploration/biomeConfig';
import { ANIMAL_FIT, getFitColor, getFitLabel, AnimalFit } from '../../features/exploration/animalFitConfig';
import { useExplorationStore } from '../../features/exploration/useExplorationStore';
import { StepProgressBar } from './StepProgressBar';

const ANIMAL_LABELS: Record<string, { emoji: string; name: string }> = {
  cow:   { emoji: '🐄', name: 'Kuh' },
  horse: { emoji: '🐴', name: 'Pferd' },
  llama: { emoji: '🦙', name: 'Lama' },
  pig:   { emoji: '🐷', name: 'Schwein' },
  pug:   { emoji: '🐶', name: 'Mops' },
  sheep: { emoji: '🐑', name: 'Schaf' },
  zebra: { emoji: '🦓', name: 'Zebra' },
};

const FIT_ORDER: Record<AnimalFit, number> = { perfect: 0, good: 1, possible: 2 };

interface Props {
  biomeId: BiomeId;
  visible: boolean;
  onClose: () => void;
}

export function SendScoutModal({ biomeId, visible, onClose }: Props) {
  const config = BIOME_CONFIGS[biomeId];
  const biomeState = useExplorationStore(s => s.biomes[biomeId]);
  const sendScout = useExplorationStore(s => s.sendScout);
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);

  const fitMap = ANIMAL_FIT[biomeId] ?? {};
  const animalKeys = Object.keys(ANIMAL_LABELS).sort((a, b) => {
    const fitA = fitMap[a]?.fit ?? 'possible';
    const fitB = fitMap[b]?.fit ?? 'possible';
    return FIT_ORDER[fitA] - FIT_ORDER[fitB];
  });

  // Scouting progress
  const isScouting = biomeState.status === 'scouting';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isScouting || !biomeState.mission) return;
    const update = () => {
      const now = Date.now();
      const { departureTime, returnTime } = biomeState.mission!;
      const total = returnTime - departureTime;
      const elapsed = now - departureTime;
      setProgress(Math.min(elapsed / total, 1));
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [isScouting, biomeState.mission]);

  const handleSend = () => {
    if (!selectedAnimal) return;
    sendScout(biomeId, selectedAnimal);
    setSelectedAnimal(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#1a2535', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 40 }}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}>
            <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Header */}
          <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 28 }}>{config.emoji}</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginTop: 4 }}>{config.name}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, textAlign: 'center', paddingHorizontal: 24 }}>{config.description}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
              Erkundungszeit: ~{config.scoutDurationHours}h
            </Text>
          </View>

          {isScouting ? (
            <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
              <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
                🐾 {ANIMAL_LABELS[biomeState.mission?.animalType ?? '']?.emoji ?? '🐾'}{' '}
                {ANIMAL_LABELS[biomeState.mission?.animalType ?? '']?.name ?? 'Tier'} ist unterwegs...
              </Text>
              <View style={{ marginTop: 16 }}>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: '#FFD700', borderRadius: 5 }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                  {Math.round(progress * 100)}% erkundet
                </Text>
              </View>
            </View>
          ) : (
            <>
              <ScrollView style={{ paddingHorizontal: 16, maxHeight: 380 }}>
                {animalKeys.map(key => {
                  const label = ANIMAL_LABELS[key];
                  const fit = fitMap[key];
                  if (!fit) return null;
                  const isSelected = selectedAnimal === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setSelectedAnimal(key)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#2a3545', borderRadius: 12, padding: 12, marginBottom: 8,
                        borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? '#FFD700' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Text style={{ fontSize: 28, marginRight: 10 }}>{label.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginRight: 8 }}>{label.name}</Text>
                          <View style={{ backgroundColor: getFitColor(fit.fit), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{getFitLabel(fit.fit)}</Text>
                          </View>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>{fit.bonus}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Send button */}
              <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!selectedAnimal}
                  style={{
                    backgroundColor: selectedAnimal ? '#FFD700' : 'rgba(128,128,128,0.3)',
                    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: selectedAnimal ? '#000' : '#888' }}>
                    🐾 Auf Erkundung schicken
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
