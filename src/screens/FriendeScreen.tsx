// FriendeScreen.tsx
// Main screen for the Freunde (Friends) tab.
// Contains three inner tabs: Stamm, Freunde, Einladen.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StammScreen } from '../components/friends/StammScreen';
import { FreundeListeScreen } from '../components/friends/FreundeListeScreen';
import { EinladenScreen } from '../components/friends/EinladenScreen';
import { friendStyles as s } from '../components/friends/styles';
import { AppColors } from '../models/types';
import GameIcon, { GameIconName } from '../components/GameIcon';

type FriendsTab = 'stamm' | 'freunde' | 'einladen';
const TABS: FriendsTab[] = ['stamm', 'freunde', 'einladen'];

export default function FriendeScreen() {
  const [activeTab, setActiveTab] = useState<FriendsTab>('freunde');

  const switchTab = (tab: FriendsTab) => {
    setActiveTab(tab);
  };

  const tabIconName = (tab: FriendsTab): GameIconName => {
    if (tab === 'stamm') return 'stamm';
    if (tab === 'freunde') return 'people';
    return 'send';
  };

  const tabLabelText = (tab: FriendsTab): string => {
    if (tab === 'stamm') return 'Stamm';
    if (tab === 'freunde') return 'Freunde';
    return 'Einladen';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.background }} edges={['top']}>
      {/* Inner tab bar */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tabItem, activeTab === tab && s.tabItemActive]}
            onPress={() => switchTab(tab)}
            activeOpacity={0.8}
          >
            <View style={{ alignItems: 'center', gap: 2 }}>
              <GameIcon name={tabIconName(tab)} size={18} color={activeTab === tab ? AppColors.gold : 'rgba(255,255,255,0.45)'} />
              <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
                {tabLabelText(tab)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'stamm'    && <StammScreen />}
      {activeTab === 'freunde'  && <FreundeListeScreen />}
      {activeTab === 'einladen' && <EinladenScreen />}
    </SafeAreaView>
  );
}
