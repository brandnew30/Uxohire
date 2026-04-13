-- LOW: Create employer_profiles table
-- Persists company-level account info tied to auth.users
-- Eliminates re-entering company name on every job post

CREATE TABLE IF NOT EXISTS employer_profiles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name  text NOT NULL,
  contact_name  text,
  contact_email text,
  phone         text,
  website       text,
  description   text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;

-- Employers can read their own profile
CREATE POLICY "Employers can read own profile" ON employer_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Employers can create their profile
CREATE POLICY "Employers can insert own profile" ON employer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Employers can update their own profile
CREATE POLICY "Employers can update own profile" ON employer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Employers can delete their own profile
CREATE POLICY "Employers can delete own profile" ON employer_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public to read employer name/description for job card display
CREATE POLICY "Public can read employer display info" ON employer_profiles
  FOR SELECT USING (true);
