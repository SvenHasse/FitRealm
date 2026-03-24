// App.tsx
// FitRealm - Root entry point with tab navigation

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import './src/i18n'; // initialize i18n before anything renders
import { useGameStore } from './src/store/useGameStore';
import { AppColors } from './src/models/types';
import DashboardScreen from './src/screens/DashboardScreen';
import RealmScreen from './src/screens/RealmScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: AppColors.background,
    card: AppColors.cardBackground,
    text: AppColors.textPrimary,
    border: 'transparent',
    primary: AppColors.gold,
  },
};

export default function App() {
  const initialize = useGameStore(s => s.initialize);
  const { t } = useTranslation();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Dashboard') iconName = 'home';
            else if (route.name === 'Realm') iconName = 'map';
            else if (route.name === 'Goals') iconName = 'trophy';
            else if (route.name === 'Settings') iconName = 'settings';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: AppColors.gold,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          tabBarStyle: {
            backgroundColor: AppColors.cardBackground,
            borderTopColor: 'transparent',
          },
          headerStyle: { backgroundColor: AppColors.background },
          headerTintColor: AppColors.textPrimary,
          headerTitleStyle: { fontWeight: 'bold' },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tabs.dashboard') }} />
        <Tab.Screen name="Realm" component={RealmScreen} options={{ headerShown: false, title: t('tabs.realm') }} />
        <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: t('tabs.goals') }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tabs.settings') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
