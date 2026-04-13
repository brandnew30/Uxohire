-- MEDIUM: Migrate legacy column data then drop orphaned columns
-- 
-- tech_profiles:
--   'certs' (old array) → 'dod_certs' (new array): only map values matching valid DOD certs
--   'experience' (text, old numeric hours) → 'uxo_hours' if uxo_hours is null/empty
--
-- job_posts:
--   'certs' (old array) → 'required_certs' if required_certs is null/empty
--   'active' (boolean, old status flag) already handled by migration 005

-- Migrate tech_profiles.certs → dod_certs (where dod_certs is empty)
UPDATE tech_profiles
SET dod_certs = ARRAY(
  SELECT val FROM unnest(certs) AS val
  WHERE val = ANY(ARRAY[
    'DOD UXO Tech I', 'DOD UXO Tech II', 'DOD UXO Tech III',
    'QC Specialist', 'UXO Safety Officer'
  ])
)
WHERE (dod_certs IS NULL OR dod_certs = '{}')
  AND certs IS NOT NULL
  AND array_length(certs, 1) > 0;

-- Migrate tech_profiles.experience → uxo_hours (where uxo_hours is null/empty)
UPDATE tech_profiles
SET uxo_hours = experience
WHERE (uxo_hours IS NULL OR uxo_hours = '')
  AND experience IS NOT NULL
  AND experience != '';

-- Migrate job_posts.certs → required_certs (where required_certs is null/empty)
UPDATE job_posts
SET required_certs = certs
WHERE (required_certs IS NULL OR required_certs = '{}')
  AND certs IS NOT NULL
  AND array_length(certs, 1) > 0;

-- Drop legacy columns now that data is migrated
ALTER TABLE tech_profiles DROP COLUMN IF EXISTS certs;
ALTER TABLE tech_profiles DROP COLUMN IF EXISTS experience;
ALTER TABLE job_posts DROP COLUMN IF EXISTS certs;
ALTER TABLE job_posts DROP COLUMN IF EXISTS active;
