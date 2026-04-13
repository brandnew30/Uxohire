-- HIGH: Add SELECT policy to contacts table
-- Currently contacts are write-only — no one can retrieve them via API.
-- Techs should be able to see contact requests sent to their profile.

CREATE POLICY "Techs can read contacts sent to them" ON contacts
  FOR SELECT USING (
    tech_profile_id IN (
      SELECT id FROM tech_profiles WHERE user_id = auth.uid()
    )
  );
