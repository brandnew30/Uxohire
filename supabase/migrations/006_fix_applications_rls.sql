-- HIGH: Fix applications SELECT policy — currently wide open (anyone can read all apps)
-- Replace with scoped policies: applicants see their own, employers see apps for their jobs.

DROP POLICY IF EXISTS "Public can read applications" ON applications;

-- Techs who submitted an application (matched via tech_profile) can read their own
CREATE POLICY "Applicants can read own applications" ON applications
  FOR SELECT USING (
    tech_profile_id IN (
      SELECT id FROM tech_profiles WHERE user_id = auth.uid()
    )
  );

-- Employers can read all applications submitted to their job posts
CREATE POLICY "Employers can read applications for their jobs" ON applications
  FOR SELECT USING (
    job_id IN (
      SELECT id FROM job_posts WHERE user_id = auth.uid()
    )
  );
