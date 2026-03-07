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

export async function getStudentsWithClass(schoolId: string) {
  const { data: students, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'student')
    .order('full_name');

  if (error) throw error;
  if (!students || students.length === 0) return [];

  const { data: enrollData } = await supabase
    .from('enrollments')
    .select('student_id, classes(id, name)')
    .in('student_id', students.map((s) => s.id));

  const enrollMap: Record<string, string> = {};
  (enrollData || []).forEach((e: any) => {
    if (e.classes?.name) enrollMap[e.student_id] = e.classes.name;
  });

  return students.map((s) => ({ ...s, className: enrollMap[s.id] || null }));
}

export async function getTeachersWithSubjects(schoolId: string) {
  const { data: teachers, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'teacher')
    .order('full_name');

  if (error) throw error;
  if (!teachers || teachers.length === 0) return [];

  const { data: coursesData } = await supabase
    .from('courses_pdf')
    .select('teacher_id, school_subjects(custom_label, ref_subjects(label))')
    .eq('school_id', schoolId)
    .in('teacher_id', teachers.map((t) => t.id));

  const subjectMap: Record<string, string[]> = {};
  (coursesData || []).forEach((c: any) => {
    const label = c.school_subjects?.custom_label || c.school_subjects?.ref_subjects?.label;
    if (label) {
      if (!subjectMap[c.teacher_id]) subjectMap[c.teacher_id] = [];
      if (!subjectMap[c.teacher_id].includes(label)) subjectMap[c.teacher_id].push(label);
    }
  });

  return teachers.map((t) => ({ ...t, subjects: subjectMap[t.id] || [] }));
}

export async function getParentsWithChildCount(schoolId: string) {
  const { data: parents, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'parent')
    .order('full_name');

  if (error) throw error;
  if (!parents || parents.length === 0) return [];

  const { data: childrenData } = await supabase
    .from('profiles')
    .select('id, full_name, managed_by')
    .in('managed_by', parents.map((p) => p.id));

  const childrenMap: Record<string, any[]> = {};
  (childrenData || []).forEach((c: any) => {
    if (c.managed_by) {
      if (!childrenMap[c.managed_by]) childrenMap[c.managed_by] = [];
      childrenMap[c.managed_by].push(c);
    }
  });

  return parents.map((p) => ({
    ...p,
    children: childrenMap[p.id] || [],
    childrenCount: (childrenMap[p.id] || []).length,
  }));
}

export async function createProfile(data: {
  full_name: string;
  email: string;
  phone_number?: string;
  school_id: string;
  role: string;
  username: string;
}) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return profile;
}
