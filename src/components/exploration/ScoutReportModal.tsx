import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BiomeId } from '../../features/exploration/types';
import { BIOME_CONFIGS } from '../../features/exploration/biomeConfig';
import { useExplorationStore } from '../../features/exploration/useExplorationStore';
import { StepProgressBar } from './StepProgressBar';

interface Props {
  biomeId: BiomeId;
  visible: boolean;
  onClose: () => void;
}

export function ScoutReportModal({ biomeId, visible, onClose }: Props) {
  const config = BIOME_CONFIGS[biomeId];
  const biomeState = useExplorationStore(s => s.biomes[biomeId]);
  const acknowledgeReport = useExplorationStore(s => s.acknowledgeReport);
  const report = biomeState.report;

  if (!report) return null;

  const isUnlocking = biomeState.status === 'unlocking';

  const handleStartUnlocking = () => {
    acknowledgeReport(biomeId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: '#1a2535', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%', paddingBottom: 40 }}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={{ position: 'absolute', right: 16, top: 16, zIndex: 10 }}>
            <MaterialCommunityIcons name="close" size={24} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 32 }}>{config.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginTop: 4 }}>{config.name} - Erkundungsbericht</Text>
            </View>

            {/* Fun fact */}
            <View style={{ backgroundColor: '#2a3545', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
                "{report.funFact}"
              </Text>
            </View>

            {/* Resources */}
            <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Gefundene Ressourcen</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {report.resources.map(r => (
                <View key={r} style={{ backgroundColor: '#2a3545', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6 }}>
                  <Text style={{ color: '#FFD700', fontSize: 12 }}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Animals */}
            <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Entdeckte Tiere</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {report.animals.map(a => (
                <View key={a} style={{ backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6 }}>
                  <Text style={{ color: '#4CAF50', fontSize: 12 }}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={{ backgroundColor: '#2a3545', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Entfernung</Text>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{report.distanceKm} km</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Workout-Typ</Text>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{report.workoutType}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Schritte benötigt</Text>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{report.stepsRequired.toLocaleString()}</Text>
              </View>
            </View>

            {/* Step progress or start button */}
            {isUnlocking ? (
              <StepProgressBar current={biomeState.stepsCompleted} total={report.stepsRequired} />
            ) : (
              biomeState.status === 'scout_returned' && (
                <TouchableOpacity
                  onPress={handleStartUnlocking}
                  style={{
                    backgroundColor: '#FFD700', borderRadius: 12,
                    paddingVertical: 14, alignItems: 'center', marginTop: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000' }}>
                    Los geht's! {report.stepsRequired.toLocaleString()} Schritte 🚶
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
