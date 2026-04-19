-- Add visible_to_techs column to control profile visibility on /techs page
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS visible_to_techs boolean NOT NULL DEFAULT true;
