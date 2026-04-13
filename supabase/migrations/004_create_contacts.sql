CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_profile_id uuid REFERENCES tech_profiles(id) ON DELETE CASCADE,
  employer_name text NOT NULL,
  employer_email text NOT NULL,
  company text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact request
CREATE POLICY "Anyone can submit contacts" ON contacts
  FOR INSERT WITH CHECK (true);
