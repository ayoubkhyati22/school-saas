import { supabase } from './supabase/client';
import { Profile } from '@/types/database';

// In-memory profile cache — avoids re-fetching on every page navigation
let _cachedProfile: Profile | null = null;
let _cachedUserId: string | null = null;

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  _cachedProfile = null;
  _cachedUserId = null;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  // getSession reads from localStorage — no network call, instant
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) {
    _cachedProfile = null;
    _cachedUserId = null;
    return null;
  }

  // Return cached profile if same user — instant, no DB round-trip
  if (_cachedProfile && _cachedUserId === user.id) {
    return _cachedProfile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getCurrentProfile] error:', error.message, error.code);
    return null;
  }

  _cachedProfile = data;
  _cachedUserId = user.id;
  return data;
}

// Call this after updating profile fields to keep the cache fresh
export function invalidateProfileCache() {
  _cachedProfile = null;
  _cachedUserId = null;
}

export function checkPermission(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
