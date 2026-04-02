// AuthService.ts
// FitRealm — Authentication service wrapping Supabase Auth.

import { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import { supabase, DBProfile } from './supabaseClient';

// ── Types ───────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
}

export interface ProfileResult {
  success: boolean;
  profile: DBProfile | null;
  error: string | null;
}

// ── Error mapping (German UI messages) ──────────────────────────────────────

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials'))
    return 'E-Mail oder Passwort ist falsch.';
  if (lower.includes('email not confirmed'))
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (lower.includes('user already registered'))
    return 'Diese E-Mail ist bereits registriert.';
  if (lower.includes('password'))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  if (lower.includes('rate limit'))
    return 'Zu viele Versuche. Bitte warte einen Moment.';
  return message;
}

// ── Session ─────────────────────────────────────────────────────────────────

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ── Email Auth ──────────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { full_name: displayName } : undefined,
    },
  });
  if (error) return { success: false, user: null, session: null, error: mapAuthError(error.message) };
  return { success: true, user: data.user, session: data.session, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, user: null, session: null, error: mapAuthError(error.message) };
  return { success: true, user: data.user, session: data.session, error: null };
}

export async function resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { success: false, error: mapAuthError(error.message) };
  return { success: true, error: null };
}

// ── Social Auth ─────────────────────────────────────────────────────────────

export async function signInWithApple(
  idToken: string,
  nonce: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
    nonce,
  });
  if (error) return { success: false, user: null, session: null, error: mapAuthError(error.message) };
  return { success: true, user: data.user, session: data.session, error: null };
}

export async function signInWithGoogle(idToken: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) return { success: false, user: null, session: null, error: mapAuthError(error.message) };
  return { success: true, user: data.user, session: data.session, error: null };
}

// ── Sign Out ────────────────────────────────────────────────────────────────

export async function signOut(): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function getMyProfile(): Promise<ProfileResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, profile: null, error: 'Nicht eingeloggt.' };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return { success: false, profile: null, error: error.message };
  return { success: true, profile: data as DBProfile, error: null };
}

export async function updateProfile(
  updates: Partial<Pick<DBProfile, 'display_name' | 'avatar_url' | 'focus_goal'>>,
): Promise<ProfileResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, profile: null, error: 'Nicht eingeloggt.' };

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) return { success: false, profile: null, error: error.message };
  return { success: true, profile: data as DBProfile, error: null };
}

export async function findProfileByInviteCode(code: string): Promise<ProfileResult> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single();

  if (error) return { success: false, profile: null, error: error.message };
  return { success: true, profile: data as DBProfile, error: null };
}

// ── Auth State Listener ─────────────────────────────────────────────────────

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): Subscription {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
