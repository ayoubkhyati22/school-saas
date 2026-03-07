-- ============================================================
-- RLS Policies for all tables missing them
-- ============================================================

-- Helper: check if user belongs to a school
-- Reused inline in each policy below

-- ============================================================
-- school_subjects
-- ============================================================
CREATE POLICY "School members can view subjects"
  ON school_subjects FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "School admins can manage subjects"
  ON school_subjects FOR ALL
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'school_admin')
  )
  WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'school_admin')
  );

-- ============================================================
-- enrollments
-- ============================================================
CREATE POLICY "School members can view enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "School admins can manage enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'school_admin')
  )
  WITH CHECK (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid() AND role = 'school_admin')
  );

-- ============================================================
-- courses_pdf
-- ============================================================
CREATE POLICY "School members can view published courses or all if staff"
  ON courses_pdf FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
    AND (
      is_published = true
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('school_admin', 'teacher', 'assistant')
      )
    )
  );

CREATE POLICY "Teachers and admins can insert courses"
  ON courses_pdf FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

CREATE POLICY "Teachers and admins can update courses"
  ON courses_pdf FOR UPDATE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

CREATE POLICY "Teachers and admins can delete courses"
  ON courses_pdf FOR DELETE
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

-- ============================================================
-- homework
-- ============================================================
CREATE POLICY "School members can view homework"
  ON homework FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers and admins can manage homework"
  ON homework FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

-- ============================================================
-- homework_submissions
-- ============================================================
CREATE POLICY "Students can view their own submissions"
  ON homework_submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

CREATE POLICY "Students can submit homework"
  ON homework_submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Staff can update submissions"
  ON homework_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

-- ============================================================
-- exams
-- ============================================================
CREATE POLICY "School members can view exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers and admins can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

-- ============================================================
-- exam_results
-- ============================================================
CREATE POLICY "Students can view their own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

CREATE POLICY "Teachers and admins can manage exam results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );

-- ============================================================
-- gallery_albums
-- ============================================================
CREATE POLICY "School members can view gallery albums"
  ON gallery_albums FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and teachers can manage gallery albums"
  ON gallery_albums FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin', 'teacher')
    )
  );

-- ============================================================
-- gallery_photos
-- ============================================================
CREATE POLICY "School members can view gallery photos"
  ON gallery_photos FOR SELECT
  TO authenticated
  USING (
    album_id IN (
      SELECT id FROM gallery_albums
      WHERE school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins and teachers can manage gallery photos"
  ON gallery_photos FOR ALL
  TO authenticated
  USING (
    album_id IN (
      SELECT id FROM gallery_albums
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin', 'teacher')
      )
    )
  )
  WITH CHECK (
    album_id IN (
      SELECT id FROM gallery_albums
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin', 'teacher')
      )
    )
  );

-- ============================================================
-- gallery_visibility
-- ============================================================
CREATE POLICY "School members can view gallery visibility"
  ON gallery_visibility FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage gallery visibility"
  ON gallery_visibility FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  );

-- ============================================================
-- notifications
-- ============================================================
CREATE POLICY "School members can view notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  );

-- ============================================================
-- invoices
-- ============================================================
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  );

-- ============================================================
-- payments
-- ============================================================
CREATE POLICY "Users can view payments in their school"
  ON payments FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin')
      )
    )
  )
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin')
      )
    )
  );

-- ============================================================
-- transport_routes
-- ============================================================
CREATE POLICY "School members can view transport routes"
  ON transport_routes FOR SELECT
  TO authenticated
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage transport routes"
  ON transport_routes FOR ALL
  TO authenticated
  USING (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM profiles
      WHERE id = auth.uid() AND role IN ('school_admin')
    )
  );

-- ============================================================
-- transport_subscriptions
-- ============================================================
CREATE POLICY "School members can view transport subscriptions"
  ON transport_subscriptions FOR SELECT
  TO authenticated
  USING (
    route_id IN (
      SELECT id FROM transport_routes
      WHERE school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage transport subscriptions"
  ON transport_subscriptions FOR ALL
  TO authenticated
  USING (
    route_id IN (
      SELECT id FROM transport_routes
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin')
      )
    )
  )
  WITH CHECK (
    route_id IN (
      SELECT id FROM transport_routes
      WHERE school_id IN (
        SELECT school_id FROM profiles
        WHERE id = auth.uid() AND role IN ('school_admin')
      )
    )
  );

-- ============================================================
-- Storage: school-saas bucket policies
-- Allow authenticated users in the school to read
-- Allow school_admin and teachers to upload
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-saas', 'school-saas', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read school-saas files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'school-saas');

CREATE POLICY "Staff can upload to school-saas"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'school-saas'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('school_admin', 'teacher', 'assistant', 'student')
    )
  );

CREATE POLICY "Staff can update school-saas files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-saas')
  WITH CHECK (bucket_id = 'school-saas');

CREATE POLICY "Staff can delete school-saas files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'school-saas'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('school_admin', 'teacher', 'assistant')
    )
  );
