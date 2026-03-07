import { supabase } from '@/lib/supabase/client';

export async function getExams(schoolId: string, filters?: {
  classId?: string;
  teacherId?: string;
}) {
  let query = supabase
    .from('exams')
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

  const { data, error } = await query.order('exam_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getExamResults(examId: string) {
  const { data, error } = await supabase
    .from('exam_results')
    .select(`
      *,
      profiles:student_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('exam_id', examId)
    .order('score_obtained', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createExam(examData: {
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  exam_date: string;
  max_score?: number;
  coefficient?: number;
  term?: string;
}) {
  const { data, error } = await supabase
    .from('exams')
    .insert(examData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function recordExamResult(resultData: {
  exam_id: string;
  student_id: string;
  score_obtained: number;
  teacher_comment?: string;
  attendance_status?: string;
}) {
  const { data, error } = await supabase
    .from('exam_results')
    .upsert(resultData, {
      onConflict: 'exam_id,student_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExam(examId: string, updates: Partial<{
  title: string;
  exam_date: string;
  max_score: number;
  coefficient: number;
  term: string;
  class_id: string;
  subject_id: string;
}>) {
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', examId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExam(examId: string) {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId);

  if (error) throw error;
}

export async function getStudentExamResults(studentId: string) {
  const { data, error } = await supabase
    .from('exam_results')
    .select(`
      *,
      exams (
        title,
        exam_date,
        max_score,
        coefficient,
        term,
        school_subjects (custom_label, ref_subjects (label)),
        classes (name)
      )
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
