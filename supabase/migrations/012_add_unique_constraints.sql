-- MEDIUM: Add UNIQUE constraint on tech_profiles.user_id
-- Prevents a single user from creating multiple tech profiles.
-- Safe: no duplicate user_ids exist in the DB.

ALTER TABLE tech_profiles 
  ADD CONSTRAINT tech_profiles_user_id_unique UNIQUE (user_id);

-- Also enforce NOT NULL on job_posts.location (no nulls exist)
ALTER TABLE job_posts ALTER COLUMN location SET NOT NULL;
