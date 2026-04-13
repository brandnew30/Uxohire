-- HIGH: Add DELETE policy on job_posts
-- Employers can delete their own job listings

CREATE POLICY "Employers can delete own job posts" ON job_posts
  FOR DELETE USING (auth.uid() = user_id);
