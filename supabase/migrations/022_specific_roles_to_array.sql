-- Convert specific_roles from text to text[] for multi-select role chips
ALTER TABLE tech_profiles
  ALTER COLUMN specific_roles DROP DEFAULT,
  ALTER COLUMN specific_roles TYPE text[] USING
    CASE
      WHEN specific_roles IS NULL OR specific_roles = '' THEN '{}'::text[]
      ELSE string_to_array(specific_roles, ',')
    END,
  ALTER COLUMN specific_roles SET DEFAULT '{}';
