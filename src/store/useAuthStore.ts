// useAuthStore.ts
// FitRealm — Zustand store for authentication state.

import { create } from 'zustand';
import { Session, User, Subscription } from '@supabase/supabase-js';
import { DBProfile } from '../services/supabaseClient';
import * as Auth from '../services/AuthService';

interface AuthState {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: DBProfile | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<boolean>;
  signInWithApple: (idToken: string, nonce: string) => Promise<boolean>;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<DBProfile, 'display_name' | 'avatar_url' | 'focus_goal'>>) => Promise<boolean>;
  clearError: () => void;
}

let authSubscription: Subscription | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  // ── Initial state ───────────────────────────────────────────────────────
  isInitialized: false,
  isLoading: false,
  session: null,
  user: null,
  profile: null,
  error: null,

  // ── Initialize ──────────────────────────────────────────────────────────
  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });

    try {
      // Load existing session
      const session = await Auth.getSession();
      const user = session?.user ?? null;

      // Load profile if logged in
      let profile: DBProfile | null = null;
      if (user) {
        const result = await Auth.getMyProfile();
        if (result.success) profile = result.profile;
      }

      set({ session, user, profile, isInitialized: true, isLoading: false });

      // Start auth state listener
      if (authSubscription) authSubscription.unsubscribe();
      authSubscription = Auth.onAuthStateChange(async (event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });

        if (event === 'SIGNED_IN') {
          const result = await Auth.getMyProfile();
          if (result.success) set({ profile: result.profile });
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null, profile: null, error: null });
        }
        // TOKEN_REFRESHED: session already updated above
      });
    } catch (err) {
      set({ isInitialized: true, isLoading: false, error: 'Initialisierung fehlgeschlagen.' });
    }
  },

  // ── Email Auth ──────────────────────────────────────────────────────────
  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    const result = await Auth.signInWithEmail(email, password);
    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ session: result.session, user: result.user, isLoading: false });
    // Profile will be loaded by the auth state change listener
    return true;
  },

  signUpWithEmail: async (email, password, name) => {
    set({ isLoading: true, error: null });
    const result = await Auth.signUpWithEmail(email, password, name);
    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ session: result.session, user: result.user, isLoading: false });
    return true;
  },

  // ── Social Auth ─────────────────────────────────────────────────────────
  signInWithApple: async (idToken, nonce) => {
    set({ isLoading: true, error: null });
    const result = await Auth.signInWithApple(idToken, nonce);
    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ session: result.session, user: result.user, isLoading: false });
    return true;
  },

  signInWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    const result = await Auth.signInWithGoogle(idToken);
    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ session: result.session, user: result.user, isLoading: false });
    return true;
  },

  // ── Sign Out ────────────────────────────────────────────────────────────
  signOut: async () => {
    set({ isLoading: true });
    await Auth.signOut();
    set({ session: null, user: null, profile: null, isLoading: false, error: null });
  },

  // ── Profile ─────────────────────────────────────────────────────────────
  refreshProfile: async () => {
    const result = await Auth.getMyProfile();
    if (result.success) set({ profile: result.profile });
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    const result = await Auth.updateProfile(updates);
    if (!result.success) {
      set({ isLoading: false, error: result.error });
      return false;
    }
    set({ profile: result.profile, isLoading: false });
    return true;
  },

  // ── Helpers ─────────────────────────────────────────────────────────────
  clearError: () => set({ error: null }),
}));
