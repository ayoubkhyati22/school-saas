import { supabase } from './supabase/client';
import { Profile } from '@/types/database';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[getCurrentProfile] error:', error.message, error.code);
    // 500 usually means RLS infinite recursion — run supabase/fix_rls_recursion.sql
    return null;
  }
  return data;
}

export function checkPermission(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
