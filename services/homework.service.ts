import { supabase } from '@/lib/supabase/client';

export async function getHomework(schoolId: string, filters?: {
  classId?: string;
  teacherId?: string;
  studentId?: string;
}) {
  let query = supabase
    .from('homework')
    .select(`
      *,
      profiles:teacher_id (full_name),
      school_subjects (custom_label, ref_subjects (label)),
      classes (name)
    `)
    .eq('school_id', schoolId);

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }
  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }

  const { data, error } = await query.order('due_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getHomeworkById(homeworkId: string) {
  const { data, error } = await supabase
    .from('homework')
    .select(`
      *,
      profiles:teacher_id (full_name),
      school_subjects (custom_label, ref_subjects (label)),
      classes (name)
    `)
    .eq('id', homeworkId)
    .single();

  if (error) throw error;
  return data;
}

export async function getHomeworkSubmissions(homeworkId: string) {
  const { data, error } = await supabase
    .from('homework_submissions')
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('homework_id', homeworkId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createHomework(homeworkData: {
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  title: string;
  description?: string;
  attachment_url?: string;
  due_date: string;
  submission_type?: string;
}) {
  const { data, error } = await supabase
    .from('homework')
    .insert(homeworkData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitHomework(submissionData: {
  homework_id: string;
  student_id: string;
  content_text?: string;
  file_url?: string;
}) {
  const { data, error } = await supabase
    .from('homework_submissions')
    .insert(submissionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHomework(homeworkId: string, updates: Partial<{
  title: string;
  description: string;
  due_date: string;
  class_id: string;
  subject_id: string;
}>) {
  const { data, error } = await supabase
    .from('homework')
    .update(updates)
    .eq('id', homeworkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteHomework(homeworkId: string) {
  const { error } = await supabase
    .from('homework')
    .delete()
    .eq('id', homeworkId);

  if (error) throw error;
}

export async function gradeSubmission(
  submissionId: string,
  grade: number,
  feedback?: string
) {
  const { data, error } = await supabase
    .from('homework_submissions')
    .update({
      grade,
      teacher_feedback: feedback,
      status: 'graded',
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
