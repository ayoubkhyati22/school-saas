import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

export async function getProfilesBySchool(schoolId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTeachers(schoolId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .order('full_name');

  if (error) throw error;
  return data;
}

export async function getStudents(schoolId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .order('full_name');

  if (error) throw error;
  return data;
}

export async function getParents(schoolId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'parent')
    .order('full_name');

  if (error) throw error;
  return data;
}

export async function updateProfile(profileId: string, updates: Partial<{
  full_name: string;
  phone_number: string;
  email: string;
}>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProfile(profileId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
}
