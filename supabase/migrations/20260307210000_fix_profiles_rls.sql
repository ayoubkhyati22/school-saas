-- ============================================================
-- Fix profiles RLS: allow school_admin to create/update/delete
-- members of their school, and users to update their own profile
-- ============================================================

-- School admin can INSERT new profiles into their school
CREATE POLICY "School admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

-- School admin can UPDATE profiles in their school
CREATE POLICY "School admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

-- School admin can DELETE profiles in their school
CREATE POLICY "School admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role = 'school_admin'
    )
  );

-- Users can update their own profile (name, phone, avatar)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
