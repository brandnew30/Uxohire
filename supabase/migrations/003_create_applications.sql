CREATE TABLE IF NOT EXISTS applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES job_posts(id) ON DELETE CASCADE,
  tech_profile_id uuid REFERENCES tech_profiles(id) ON DELETE CASCADE,
  applicant_name text NOT NULL,
  applicant_email text NOT NULL,
  message text,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application
CREATE POLICY "Anyone can submit applications" ON applications
  FOR INSERT WITH CHECK (true);

-- Users can see their own applications (when auth is linked later)
CREATE POLICY "Public can read applications" ON applications
  FOR SELECT USING (true);
