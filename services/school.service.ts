import { supabase } from '@/lib/supabase/client';

export async function getSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSchoolById(schoolId: string) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single();
  if (error) throw error;
  return data;
}

export async function createSchool(schoolData: {
  name: string;
  address?: string;
  massar_id?: string;
  subscription_plan?: string;
  logo_url?: string;
}) {
  const { data, error } = await supabase
    .from('schools')
    .insert({ subscription_plan: 'free', ...schoolData })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSchool(schoolId: string, updates: Partial<{
  name: string;
  address: string;
  massar_id: string;
  subscription_plan: string;
  logo_url: string;
}>) {
  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', schoolId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSchool(schoolId: string) {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', schoolId);
  if (error) throw error;
}

export async function updateSchoolPlan(schoolId: string, plan: string) {
  return updateSchool(schoolId, { subscription_plan: plan });
}

export async function getSchoolStats(schoolId: string) {
  const [studentsRes, teachersRes, classesRes] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher'),
    supabase.from('classes').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
  ]);
  return {
    students: studentsRes.count || 0,
    teachers: teachersRes.count || 0,
    classes: classesRes.count || 0,
  };
}
