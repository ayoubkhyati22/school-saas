/*
  # School Management System Database Schema

  1. Configuration & Extensions
    - Enable UUID extension
    - Create user_role enum type
  
  2. Global Reference Tables (Super Admin managed)
    - `ref_subjects` - Standard subjects
    - `ref_levels` - Education levels and cycles
    - `ref_competencies` - Standard competencies per level/subject
  
  3. School Infrastructure
    - `schools` - School entities
    - `profiles` - User profiles with roles
  
  4. Academic Structure
    - `classes` - School classes
    - `school_subjects` - School-specific subjects
    - `enrollments` - Student enrollments
  
  5. Pedagogy
    - `courses_pdf` - PDF courses
    - `homework` - Homework assignments
    - `homework_submissions` - Student submissions
    - `exams` - Exam records
    - `exam_results` - Student exam scores
  
  6. Additional Features
    - `transport_routes` - Bus routes
    - `transport_subscriptions` - Student transport subscriptions
    - `gallery_albums` - Photo albums
    - `gallery_photos` - Album photos
    - `gallery_visibility` - Album visibility per class
    - `notifications` - System notifications
  
  7. Finance
    - `invoices` - Student invoices
    - `payments` - Payment records
  
  8. Security
    - Enable RLS on all tables
    - Create role-based access policies
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'school_admin',
    'teacher',
    'assistant',
    'parent',
    'student'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Global Reference Tables
CREATE TABLE IF NOT EXISTS ref_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL UNIQUE,
    code_massar TEXT,
    icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ref_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cycle_name TEXT NOT NULL,
    level_name TEXT NOT NULL,
    order_index INT,
    UNIQUE(cycle_name, level_name)
);

CREATE TABLE IF NOT EXISTS ref_competencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id UUID REFERENCES ref_levels(id),
    subject_id UUID REFERENCES ref_subjects(id),
    label TEXT NOT NULL,
    description TEXT
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  logo_url TEXT,
  massar_id TEXT UNIQUE,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  school_id UUID REFERENCES schools(id),
  managed_by UUID REFERENCES profiles(id),
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  ref_level_id UUID REFERENCES ref_levels(id),
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL
);

-- School Subjects
CREATE TABLE IF NOT EXISTS school_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  ref_subject_id UUID REFERENCES ref_subjects(id),
  custom_label TEXT,
  coefficient DECIMAL(3,1) DEFAULT 1.0
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id),
  academic_year TEXT NOT NULL
);

-- Courses PDF
CREATE TABLE IF NOT EXISTS courses_pdf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  subject_id UUID REFERENCES school_subjects(id),
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework
CREATE TABLE IF NOT EXISTS homework (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  subject_id UUID REFERENCES school_subjects(id),
  class_id UUID REFERENCES classes(id),
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  submission_type TEXT DEFAULT 'both',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homework_id UUID REFERENCES homework(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content_text TEXT,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  grade DECIMAL(5,2),
  teacher_feedback TEXT,
  status TEXT DEFAULT 'submitted'
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES school_subjects(id),
  teacher_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 20.00,
  coefficient DECIMAL(3,1) DEFAULT 1.0,
  term TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score_obtained DECIMAL(5,2),
  teacher_comment TEXT,
  attendance_status TEXT DEFAULT 'present',
  UNIQUE(exam_id, student_id)
);

-- Transport
CREATE TABLE IF NOT EXISTS transport_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  vehicle_info TEXT,
  driver_name TEXT,
  morning_departure TIME
);

CREATE TABLE IF NOT EXISTS transport_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID REFERENCES transport_routes(id),
  monthly_fee DECIMAL(10,2) DEFAULT 0.00
);

-- Gallery
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_visibility (
  album_id UUID REFERENCES gallery_albums(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  PRIMARY KEY (album_id, class_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role user_role,
  target_class_id UUID REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finance
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date DATE
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses_pdf ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ref_competencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admin full access to profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can view profiles in their school"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for reference tables
CREATE POLICY "Reference subjects readable by all"
  ON ref_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reference subjects writable by super admin"
  ON ref_subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Reference levels readable by all"
  ON ref_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Reference levels writable by super admin"
  ON ref_levels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for schools
CREATE POLICY "Super admin can manage all schools"
  ON schools FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can view their own school"
  ON schools FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policies for classes
CREATE POLICY "Users can view classes in their school"
  ON classes FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "School admins and teachers can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher')
    )
  );