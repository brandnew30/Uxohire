-- HIGH: Add UPDATE policy on applications
-- Allows employers to update application status (submitted -> reviewed/rejected/hired)

CREATE POLICY "Employers can update application status" ON applications
  FOR UPDATE USING (
    job_id IN (
      SELECT id FROM job_posts WHERE user_id = auth.uid()
    )
  );
