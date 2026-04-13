-- Migration 016: Add dashboard fields to tech_profiles
-- Adds career progression, expiring cert tracking, and new cert types.

-- Career progression: integer hours (replaces text uxo_hours for math)
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS total_field_hours  integer DEFAULT 0;

-- Backfill: parse existing text uxo_hours into integer (strip commas, spaces)
UPDATE tech_profiles
SET total_field_hours = CAST(
  REGEXP_REPLACE(COALESCE(uxo_hours, '0'), '[^0-9]', '', 'g') AS integer
)
WHERE uxo_hours IS NOT NULL AND uxo_hours != '';

-- Optional manual experience level override (auto-computed in frontend from hours)
-- Values: 'Tech I' | 'Tech II' | 'Senior Tech' | 'QC Specialist'
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS experience_level  text;

-- HAZWOPER 8-hour refresher: explicit expiry date (defaults to issue date + 12 months)
-- Stored separately so it can be manually overridden if needed
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS hazwoper_8_expiry  date;

-- Backfill: set hazwoper_8_expiry = hazwoper_8_date + 1 year for existing rows
UPDATE tech_profiles
SET hazwoper_8_expiry = hazwoper_8_date + INTERVAL '1 year'
WHERE hazwoper_8_date IS NOT NULL AND hazwoper_8_expiry IS NULL;

-- DOD cert expiry: nullable — not all DOD certs have renewals, but some do
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS dod_cert_expiry  date;

-- First Aid / CPR cert (new cert type — expires every 2 years)
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS first_aid_cpr       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_aid_cpr_date  date,
  ADD COLUMN IF NOT EXISTS first_aid_cpr_expiry date;

-- Backfill CPR expiry from issue date
UPDATE tech_profiles
SET first_aid_cpr_expiry = first_aid_cpr_date + INTERVAL '2 years'
WHERE first_aid_cpr_date IS NOT NULL AND first_aid_cpr_expiry IS NULL;

-- State-specific license (free text name + expiry)
ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS state_license        text,
  ADD COLUMN IF NOT EXISTS state_license_expiry date;
