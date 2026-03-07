import { supabase } from '@/lib/supabase/client';

export async function getClasses(schoolId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      ref_levels (
        cycle_name,
        level_name
      )
    `)
    .eq('school_id', schoolId)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getClassById(classId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (error) throw error;
  return data;
}

export async function getClassStudents(classId: string) {
  const { data, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('class_id', classId);

  if (error) throw error;
  return data;
}

export async function createClass(classData: {
  school_id: string;
  ref_level_id: string;
  name: string;
  academic_year: string;
}) {
  const { data, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClass(classId: string, updates: Partial<{
  name: string;
  academic_year: string;
  ref_level_id: string;
}>) {
  const { data, error } = await supabase
    .from('classes')
    .update(updates)
    .eq('id', classId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClass(classId: string) {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;
}
