import { supabase } from '@/lib/supabase/client';

export async function getCourses(schoolId: string, filters?: {
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  publishedOnly?: boolean;
}) {
  let query = supabase
    .from('courses_pdf')
    .select(`
      *,
      profiles:teacher_id (full_name),
      school_subjects!courses_pdf_subject_id_fkey (custom_label, ref_subjects (label)),
      classes (name)
    `)
    .eq('school_id', schoolId);

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }
  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId);
  }
  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }
  if (filters?.publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createCourse(courseData: {
  school_id: string;
  teacher_id: string;
  subject_id?: string | null;
  class_id: string;
  title: string;
  file_path: string;
  is_published?: boolean;
}) {
  const { data, error } = await supabase
    .from('courses_pdf')
    .insert(courseData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadCourseFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('school-saas')
    .upload(path, file);

  if (error) throw error;
  return data;
}

export async function toggleCoursePublish(courseId: string, isPublished: boolean) {
  const { data, error } = await supabase
    .from('courses_pdf')
    .update({ is_published: isPublished })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(courseId: string, updates: Partial<{
  title: string;
  class_id: string;
  subject_id: string;
  is_published: boolean;
}>) {
  const { data, error } = await supabase
    .from('courses_pdf')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(courseId: string) {
  const { error } = await supabase
    .from('courses_pdf')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
}
