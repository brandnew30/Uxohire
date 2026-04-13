-- Add user_id to tech_profiles for auth linking
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE tech_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update RLS: logged-in users can update their own profiles
CREATE POLICY "Users can update own profile" ON tech_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own
CREATE POLICY "Users can delete own profile" ON tech_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Add user_id to job_posts too
ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Employers can update their own job posts
CREATE POLICY "Users can update own job posts" ON job_posts
  FOR UPDATE USING (auth.uid() = user_id);
