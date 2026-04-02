// AuthScreen.tsx
// FitRealm — Login / Register screen with Apple, Google, Email.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  ActivityIndicator, KeyboardAvoidingView, ScrollView, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
// GoogleSignin is lazy-required inside handleGoogle to avoid loading the native
// module at bundle time (crashes Expo Go when native binary is not present).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getGoogleSignin = () => require('@react-native-google-signin/google-signin').GoogleSignin;
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import * as Auth from '../services/AuthService';
import { AppColors } from '../models/types';
import { DEV } from '../config/developerConfig';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, signInWithApple, signInWithGoogle, updateProfile, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // ── Apple Sign-In ──────────────────────────────────────────────────────
  const handleApple = async () => {
    try {
      const rawNonce = Array.from(Crypto.getRandomBytes(32))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert(t('common.error'), t('auth.appleNoToken'));
        return;
      }

      const success = await signInWithApple(credential.identityToken, rawNonce);

      // WICHTIG: Apple liefert fullName NUR beim allerersten Login!
      // Sofort in Profile speichern, sonst ist der Name für immer verloren.
      if (success && credential.fullName) {
        const appleName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ');
        if (appleName) {
          await updateProfile({ display_name: appleName });
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(t('common.error'), t('auth.appleFailed'));
      }
    }
  };

  // ── Google Sign-In ─────────────────────────────────────────────────────
  const handleGoogle = async () => {
    try {
      const GoogleSignin = getGoogleSignin();
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) {
        Alert.alert(t('common.error'), t('auth.googleNoToken'));
        return;
      }
      const success = await signInWithGoogle(idToken);

      // Google liefert Name zuverlässig — in Profile speichern
      if (success && response.data?.user) {
        const { givenName, familyName } = response.data.user;
        const googleName = [givenName, familyName].filter(Boolean).join(' ');
        if (googleName) {
          await updateProfile({ display_name: googleName });
        }
      }
    } catch (e: any) {
      if (e.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert(t('common.error'), t('auth.googleFailed'));
      }
    }
  };

  // ── Email Auth ─────────────────────────────────────────────────────────
  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) return;
    clearError();
    if (mode === 'login') {
      await signInWithEmail(email.trim(), password);
    } else {
      await signUpWithEmail(email.trim(), password, name.trim() || undefined);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('auth.forgotPasswordTitle'), t('auth.forgotPasswordEnterEmail'));
      return;
    }
    const result = await Auth.resetPassword(email.trim());
    if (result.success) {
      Alert.alert(t('auth.forgotPasswordTitle'), t('auth.forgotPasswordSent'));
    } else {
      Alert.alert(t('common.error'), result.error ?? t('auth.forgotPasswordFailed'));
    }
  };

  const toggleMode = () => {
    clearError();
    setMode(m => (m === 'login' ? 'register' : 'login'));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo / Title */}
        <View style={styles.header}>
          <Ionicons name="shield" size={64} color={AppColors.gold} />
          <Text style={styles.title}>FitRealm</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        {/* Social Buttons */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={isLoading}>
            <Ionicons name="logo-apple" size={22} color="#000" />
            <Text style={styles.appleBtnText}>{t('auth.continueApple')}</Text>
          </TouchableOpacity>
        )}

        {!DEV.SKIP_GOOGLE_SIGNIN && (
          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={isLoading}>
            <Ionicons name="logo-google" size={20} color="#fff" />
            <Text style={styles.socialBtnText}>{t('auth.continueGoogle')}</Text>
          </TouchableOpacity>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email Form */}
        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder={t('auth.namePlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.emailBtn} onPress={handleEmail} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.emailBtnText}>
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </Text>
          )}
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 36, fontWeight: 'bold', color: AppColors.gold, marginTop: 12 },
  subtitle: { fontSize: 16, color: AppColors.textSecondary, marginTop: 6 },
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 12, height: 52, marginBottom: 12,
  },
  appleBtnText: { color: '#000', fontWeight: '600', fontSize: 16, marginLeft: 10 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#4285F4', borderRadius: 12, height: 52, marginBottom: 12,
  },
  socialBtnText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 10 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  dividerText: { color: AppColors.textSecondary, marginHorizontal: 12, fontSize: 13 },
  input: {
    backgroundColor: AppColors.cardBackground, borderRadius: 12, height: 52,
    paddingHorizontal: 16, color: '#fff', fontSize: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  errorText: { color: '#FF6B6B', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  emailBtn: {
    backgroundColor: AppColors.gold, borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  emailBtnText: { color: '#000', fontWeight: 'bold', fontSize: 17 },
  forgotBtn: { marginTop: 12, alignItems: 'center' },
  forgotText: { color: AppColors.textSecondary, fontSize: 14 },
  toggleBtn: { marginTop: 16, alignItems: 'center' },
  toggleText: { color: AppColors.gold, fontSize: 15 },
});
