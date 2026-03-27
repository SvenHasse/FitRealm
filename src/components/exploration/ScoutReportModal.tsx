import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { BiomeId, BiomeState } from '../../features/exploration/types';
import { BIOME_CONFIGS } from '../../features/exploration/biomeConfig';
import StepProgressBar from './StepProgressBar';

interface ScoutReportModalProps {
  visible: boolean;
  biomeId: BiomeId;
  biomeState: BiomeState;
  onStartUnlocking: () => void;
  onClose: () => void;
}

export default function ScoutReportModal({
  visible, biomeId, biomeState, onStartUnlocking, onClose,
}: ScoutReportModalProps) {
  const config = BIOME_CONFIGS[biomeId];
  const report = biomeState.report;

  if (!report) return null;

  const isUnlocking = biomeState.status === 'unlocking';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{config.emoji} Kundschafterbericht</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Fun fact */}
            <Text style={styles.funFact}>"{report.funFact}"</Text>

            {/* Resources */}
            <Text style={styles.sectionTitle}>Entdeckte Ressourcen</Text>
            <View style={styles.tagRow}>
              {report.resources.map(r => (
                <View key={r} style={styles.resourceTag}>
                  <Text style={styles.resourceTagText}>{r}</Text>
                </View>
              ))}
            </View>

            {/* Animals */}
            <Text style={styles.sectionTitle}>Entdeckte Tiere</Text>
            <View style={styles.tagRow}>
              {report.animals.map(a => (
                <View key={a} style={styles.animalTag}>
                  <Text style={styles.animalTagText}>{a}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{report.distanceKm} km</Text>
                <Text style={styles.statLabel}>Entfernung</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{report.workoutType}</Text>
                <Text style={styles.statLabel}>Workout-Typ</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{report.stepsRequired.toLocaleString('de-DE')}</Text>
                <Text style={styles.statLabel}>Schritte nötig</Text>
              </View>
            </View>

            {/* Progress bar if unlocking */}
            {isUnlocking && (
              <View style={styles.progressSection}>
                <Text style={styles.sectionTitle}>Fortschritt</Text>
                <StepProgressBar current={biomeState.stepsCompleted} total={report.stepsRequired} />
              </View>
            )}
          </ScrollView>

          {/* Action button */}
          {!isUnlocking ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onStartUnlocking} activeOpacity={0.7}>
              <Text style={styles.actionBtnText}>Los geht's!</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Schließen</Text>
            </TouchableOpacity>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  funFact: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#c8d0dc',
    backgroundColor: '#2a3545',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  resourceTag: {
    backgroundColor: '#3a4a5a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resourceTagText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  animalTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  animalTagText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a3545',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#aab4c2',
    marginTop: 2,
  },
  progressSection: {
    marginBottom: 8,
  },
  actionBtn: {
    marginTop: 12,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2535',
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#2a3545',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aab4c2',
  },
});
