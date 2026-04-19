-- Add job role preference fields to tech_profiles
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS job_role_preference text NOT NULL DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS specific_roles text DEFAULT '';

-- job_role_preference: 'any' = open to any qualifying job, 'specific' = specific roles only
-- specific_roles: comma-separated or free-text list of desired roles (used when preference = 'specific')
