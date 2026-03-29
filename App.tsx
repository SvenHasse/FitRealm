// App.tsx
// FitRealm – Root navigator:
//   RootStack (native stack, no header)
//     ├─ Main  → Tab navigator (Dashboard / Realm / Goals / Settings)
//     └─ WorkoutReward → WorkoutRewardScreen (modal presentation)
//
// Fonts are pre-loaded before anything renders so icons never show as "?".

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import './src/i18n';
import { useGameStore } from './src/store/useGameStore';
import { AppColors } from './src/models/types';
import { RootStackParamList } from './src/navigation/types';

import DashboardScreen from './src/screens/DashboardScreen';
import RealmScreen from './src/screens/RealmScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WorkoutRewardScreen from './src/screens/WorkoutRewardScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MinigameScreen from './src/minigame/MinigameScreen';
import GLBTestScreen from './src/screens/GLBTestScreen';
import RealmScreen3D from './src/screens/RealmScreen3D';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator<RootStackParamList>();

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

function TabNavigator() {
  const { t } = useTranslation();
  return (
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
        headerTitleStyle: { fontWeight: 'bold' as const },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('tabs.dashboard') }} />
      <Tab.Screen name="Realm" component={RealmScreen} options={{ headerShown: false, title: t('tabs.realm') }} />
      <Tab.Screen name="Goals" component={GoalsScreen} options={{ title: t('tabs.goals') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('tabs.settings') }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const initialize           = useGameStore(s => s.initialize);
  const initializeWaveSystem = useGameStore(s => s.initializeWaveSystem);
  const refreshGoalProgress  = useGameStore(s => s.refreshGoalProgress);
  const hasCompletedOnboarding = useGameStore(s => s.hasCompletedOnboarding);

  // Pre-load ALL icon fonts before rendering anything.
  // Without this, icons on the first screen can render as "?" on cold start.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    initialize().then(() => {
      initializeWaveSystem();
      refreshGoalProgress();
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={AppColors.gold} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar style="light" />
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding && (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <RootStack.Screen name="Main" component={TabNavigator} />
        <RootStack.Screen
          name="WorkoutReward"
          component={WorkoutRewardScreen}
          options={{ presentation: 'modal' }}
        />
        <RootStack.Screen
          name="Minigame"
          component={MinigameScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <RootStack.Screen
          name="GLBTest"
          component={GLBTestScreen}
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
        <RootStack.Screen
          name="RealmScreen3D"
          component={RealmScreen3D}
          options={{ presentation: 'fullScreenModal', headerShown: false }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
