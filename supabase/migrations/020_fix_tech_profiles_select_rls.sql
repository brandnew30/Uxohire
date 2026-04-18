-- Fix: Allow authenticated users to SELECT their own tech_profile.
-- Without this, PostgREST upsert fails because the conflict row is invisible,
-- and pre-fill / fetchMyProfile break when open_to_work = false.

CREATE POLICY "Users can read own profile"
  ON tech_profiles
  FOR SELECT
  USING (auth.uid() = user_id);
