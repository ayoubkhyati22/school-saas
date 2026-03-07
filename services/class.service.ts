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

export async function getClassesWithCounts(schoolId: string) {
  const { data: classes, error } = await supabase
    .from('classes')
    .select('*, ref_levels(cycle_name, level_name)')
    .eq('school_id', schoolId)
    .order('name');

  if (error) throw error;
  if (!classes || classes.length === 0) return [];

  const { data: enrollData } = await supabase
    .from('enrollments')
    .select('class_id')
    .in('class_id', classes.map((c) => c.id));

  const countMap: Record<string, number> = {};
  (enrollData || []).forEach((e: any) => {
    countMap[e.class_id] = (countMap[e.class_id] || 0) + 1;
  });

  return classes.map((c) => ({ ...c, studentCount: countMap[c.id] || 0 }));
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
