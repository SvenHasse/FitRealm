// FriendsService.ts
// FitRealm — Supabase CRUD for friendships.

import { supabase } from './supabaseClient';
import { FitnessFocus } from '../models/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FriendStats {
  friend_id: string;
  display_name: string;
  focus_goal: string;
  invite_code: string;
  streak_count: number;
  last_workout_at: string | null;
  weekly_mm: number;
  total_mm: number;
}

export interface FriendsResult {
  success: boolean;
  friends: FriendStats[];
  error: string | null;
}

export interface AddFriendResult {
  success: boolean;
  friend: FriendStats | null;
  error: string | null;
}

// ── getFriendsWithStats ───────────────────────────────────────────────────────
// Calls the get_friends_with_stats() RPC — single query, returns everything.

export async function getFriendsWithStats(): Promise<FriendsResult> {
  const { data, error } = await supabase.rpc('get_friends_with_stats');
  if (error) return { success: false, friends: [], error: error.message };
  return { success: true, friends: (data ?? []) as FriendStats[], error: null };
}

// ── addFriendByInviteCode ─────────────────────────────────────────────────────
// 1. Find profile by invite code
// 2. Insert bidirectional friendship (two rows)
// Returns the new friend's stats.

export async function addFriendByInviteCode(code: string): Promise<AddFriendResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, friend: null, error: 'Nicht eingeloggt.' };

  // 1. Find the profile with this invite code
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('invite_code', code.toUpperCase().trim())
    .single();

  if (profileError || !profile) {
    return { success: false, friend: null, error: 'Kein Spieler mit diesem Code gefunden.' };
  }

  if (profile.id === user.id) {
    return { success: false, friend: null, error: 'Du kannst dich nicht selbst als Freund hinzufügen.' };
  }

  // 2. Check if already friends
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', profile.id)
    .single();

  if (existing) {
    return { success: false, friend: null, error: 'Ihr seid bereits befreundet.' };
  }

  // 3. Insert both directions (bidirectional)
  const { error: insertError } = await supabase
    .from('friendships')
    .insert([
      { user_id: user.id,    friend_id: profile.id },
      { user_id: profile.id, friend_id: user.id    },
    ]);

  if (insertError) {
    // Duplicate key = already friends (race condition)
    if (insertError.code === '23505') {
      return { success: false, friend: null, error: 'Ihr seid bereits befreundet.' };
    }
    return { success: false, friend: null, error: insertError.message };
  }

  // 4. Return updated friends list to get the new friend's stats
  const result = await getFriendsWithStats();
  const newFriend = result.friends.find(f => f.friend_id === profile.id) ?? null;
  return { success: true, friend: newFriend, error: null };
}

// ── removeFriend ─────────────────────────────────────────────────────────────
// Deletes both directions of the friendship.

export async function removeFriend(friendId: string): Promise<{ success: boolean; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht eingeloggt.' };

  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
