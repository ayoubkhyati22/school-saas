export type UserRole =
  | 'super_admin'
  | 'school_admin'
  | 'teacher'
  | 'assistant'
  | 'parent'
  | 'student';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  school_id: string | null;
  managed_by: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  logo_url: string | null;
  massar_id: string | null;
  subscription_plan: string;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  ref_level_id: string;
  name: string;
  academic_year: string;
}

export interface Course {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  title: string;
  file_path: string;
  is_published: boolean;
  created_at: string;
}

export interface Homework {
  id: string;
  school_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  title: string;
  description: string | null;
  attachment_url: string | null;
  due_date: string;
  submission_type: string;
  created_at: string;
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content_text: string | null;
  file_url: string | null;
  submitted_at: string;
  grade: number | null;
  teacher_feedback: string | null;
  status: string;
}

export interface Exam {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  exam_date: string;
  max_score: number;
  coefficient: number;
  term: string | null;
  created_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  score_obtained: number | null;
  teacher_comment: string | null;
  attendance_status: string;
}

export interface Notification {
  id: string;
  school_id: string;
  sender_id: string;
  title: string;
  content: string;
  target_role: UserRole | null;
  target_class_id: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  school_id: string;
  student_id: string;
  title: string;
  amount: number;
  status: string;
  due_date: string | null;
}

export interface GalleryAlbum {
  id: string;
  school_id: string;
  title: string;
  created_at: string;
}

export interface TransportRoute {
  id: string;
  school_id: string;
  route_name: string;
  vehicle_info: string | null;
  driver_name: string | null;
  morning_departure: string | null;
}
