-- =============================================================
-- SEED: Create initial Super Admin user
-- =============================================================
-- Run this AFTER creating a user through Supabase Dashboard:
--   Authentication → Users → Add User → Enter email + password
--
-- Then replace the UUID below with the user's actual ID from
-- the Authentication → Users table.
-- =============================================================

-- Step 1: Get the user ID of the account you just created
-- (Replace 'YOUR-USER-UUID-HERE' with the actual UUID)

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Get the most recently created auth user (the one you just made)
  SELECT id, email INTO v_user_id, v_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Create a user first via Supabase Dashboard → Authentication → Users → Add User.';
  END IF;

  -- Insert their profile as super_admin
  INSERT INTO public.profiles (id, username, email, full_name, role, school_id)
  VALUES (
    v_user_id,
    split_part(v_email, '@', 1),
    v_email,
    'Super Administrator',
    'super_admin',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    email = EXCLUDED.email;

  RAISE NOTICE 'Super admin profile created for user: % (%)', v_email, v_user_id;
END $$;

-- =============================================================
-- OPTIONAL: Seed reference data (subjects, levels)
-- =============================================================

INSERT INTO ref_subjects (label, code_massar) VALUES
  ('Mathematics', 'MATH'),
  ('French Language', 'FR'),
  ('Arabic Language', 'AR'),
  ('Science', 'SCI'),
  ('History & Geography', 'HG'),
  ('English Language', 'EN'),
  ('Physics & Chemistry', 'PC'),
  ('Life & Earth Sciences', 'SVT'),
  ('Physical Education', 'EPS'),
  ('Islamic Studies', 'IS'),
  ('Computer Science', 'INFO'),
  ('Philosophy', 'PHILO')
ON CONFLICT (label) DO NOTHING;

INSERT INTO ref_levels (cycle_name, level_name, order_index) VALUES
  ('Primary', 'Grade 1', 1),
  ('Primary', 'Grade 2', 2),
  ('Primary', 'Grade 3', 3),
  ('Primary', 'Grade 4', 4),
  ('Primary', 'Grade 5', 5),
  ('Primary', 'Grade 6', 6),
  ('Middle School', 'Grade 7 (1AC)', 7),
  ('Middle School', 'Grade 8 (2AC)', 8),
  ('Middle School', 'Grade 9 (3AC)', 9),
  ('High School', 'Grade 10 (TC)', 10),
  ('High School', 'Grade 11 (1BAC)', 11),
  ('High School', 'Grade 12 (2BAC)', 12)
ON CONFLICT (cycle_name, level_name) DO NOTHING;
