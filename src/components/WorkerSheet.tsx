// WorkerSheet.tsx
// FitRealm - Worker management: train, assign, view workers + i18n

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AppColors, Worker, WorkerStatus, workerStatus, findBuildingById } from '../models/types';
import { Workers as WorkersConfig } from '../config/GameConfig';
import { canAfford, costString } from '../engines/GameEngine';

interface Props {
  onClose: () => void;
}

export default function WorkerSheet({ onClose }: Props) {
  const store = useGameStore();
  const { gameState } = store;
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={{ padding: 16, paddingTop: 4 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: AppColors.gold, fontWeight: '600' }}>{t('common.close')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('workerSheet.title')}</Text>
        <View style={{ width: 70 }} />
      </View>

      <FoodStatusCard food={gameState.food} />
      <TrainWorkerCard />
      <WorkerListSection />
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function FoodStatusCard({ food }: { food: number }) {
  const { t } = useTranslation();
  const isFed = food > 0;
  return (
    <View style={[styles.card, { borderWidth: 1, borderColor: isFed ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.3)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Ionicons name={isFed ? 'checkmark-circle' : 'warning'} size={24} color={isFed ? '#4CAF50' : '#F44336'} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: isFed ? AppColors.textPrimary : '#F44336' }}>
            {isFed ? t('workerSheet.workersFed') : t('workerSheet.noFood')}
          </Text>
          <Text style={{ fontSize: 12, color: AppColors.textSecondary }}>{t('workerSheet.foodUnits', { count: food })}</Text>
        </View>
      </View>
    </View>
  );
}

function TrainWorkerCard() {
  const store = useGameStore();
  const { gameState } = store;
  const { t } = useTranslation();
  const kaserne = gameState.buildings.find(b => b.type === 'kaserne');

  if (!kaserne) {
    return (
      <View style={styles.card}>
        <SectionHeader title={t('workerSheet.barracks')} icon="shield" />
        <Text style={{ fontSize: 13, color: AppColors.textSecondary }}>{t('workerSheet.buildBarracks')}</Text>
      </View>
    );
  }

  const currentCount = gameState.workers.length;
  const cap = kaserne.level;
  const cost = WorkersConfig.trainingCost;
  const canTrain = currentCount < cap && canAfford(gameState, cost);

  return (
    <View style={styles.card}>
      <SectionHeader title={t('workerSheet.barracks')} icon="shield" />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: AppColors.textPrimary }}>{t('workerSheet.capacity', { current: currentCount, max: cap })}</Text>
          <Text style={{ fontSize: 11, color: AppColors.textSecondary, marginTop: 2 }}>{t('workerSheet.cost', { cost: costString(cost) })}</Text>
          <Text style={{ fontSize: 11, color: AppColors.textSecondary }}>{t('workerSheet.trainingTime', { minutes: Math.floor(WorkersConfig.trainingTime / 60) })}</Text>
        </View>
        <TouchableOpacity
          style={[styles.trainButton, { backgroundColor: canTrain ? AppColors.gold : 'rgba(255,255,255,0.1)' }]}
          onPress={() => store.trainWorker()}
          disabled={!canTrain}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: canTrain ? '#000' : '#888' }}>{t('workerSheet.train')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WorkerListSection() {
  const store = useGameStore();
  const { gameState } = store;
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <SectionHeader title={t('workerSheet.yourWorkers')} icon="people" />
      {gameState.workers.length === 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: 'rgba(0,180,216,0.1)', borderRadius: 10 }}>
          <Ionicons name="information-circle" size={18} color={AppColors.teal} />
          <Text style={{ fontSize: 13, color: AppColors.textSecondary, flex: 1 }}>{t('workerSheet.noWorkers')}</Text>
        </View>
      ) : (
        gameState.workers.map(w => <WorkerRow key={w.id} worker={w} />)
      )}
    </View>
  );
}

function WorkerRow({ worker }: { worker: Worker }) {
  const store = useGameStore();
  const { t } = useTranslation();
  const status = workerStatus(worker);

  const statusColorMap: Record<WorkerStatus, string> = {
    [WorkerStatus.active]: '#4CAF50',
    [WorkerStatus.idle]: '#FFEB3B',
    [WorkerStatus.training]: '#42A5F5',
    [WorkerStatus.hungry]: '#F44336',
  };
  const statusColor = statusColorMap[status];

  let statusLabel: string;
  switch (status) {
    case WorkerStatus.active:
      if (worker.assignedBuildingID) {
        const b = findBuildingById(store.gameState, worker.assignedBuildingID);
        statusLabel = b ? t('workerSheet.statusActiveAt', { building: t(`buildings.${b.type}`) }) : t('workerSheet.statusActive');
      } else {
        statusLabel = t('workerSheet.statusActive');
      }
      break;
    case WorkerStatus.idle: statusLabel = t('workerSheet.statusIdle'); break;
    case WorkerStatus.training:
      if (worker.trainingEndDate) {
        const rem = Math.max(0, (new Date(worker.trainingEndDate).getTime() - Date.now()) / 1000);
        const m = Math.floor(rem / 60);
        const s = Math.floor(rem % 60);
        statusLabel = t('workerSheet.statusTrainingTime', { time: `${m}m ${s}s` });
      } else {
        statusLabel = t('workerSheet.statusTraining');
      }
      break;
    case WorkerStatus.hungry: statusLabel = t('workerSheet.statusHungry'); break;
  }

  return (
    <View style={styles.workerRow}>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: AppColors.textPrimary }}>{worker.name}</Text>
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: 'rgba(0,180,216,0.2)', borderRadius: 4 }}>
            <Text style={{ fontSize: 11, color: AppColors.teal }}>{t('workerSheet.levelLabel', { level: worker.level })}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: `${statusColor}CC` }}>{statusLabel}</Text>
      </View>
      {status === WorkerStatus.active && worker.assignedBuildingID && (
        <TouchableOpacity onPress={() => store.unassignWorker(worker.id)}>
          <Ionicons name="close-circle-outline" size={18} color="rgba(244,67,54,0.6)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <Ionicons name={icon as any} size={16} color={AppColors.gold} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: AppColors.textPrimary }}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#1E1E3A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#252547', borderRadius: 16, padding: 16, marginBottom: 12 },
  trainButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
