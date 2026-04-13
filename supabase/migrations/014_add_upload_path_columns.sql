-- MEDIUM: Add upload_paths columns to persist file paths returned by supabase.storage.upload()
-- The frontend calls uploadFile() which returns a path but never stores it in the DB.
-- These columns give the app somewhere to save certificate and resume file paths.

ALTER TABLE tech_profiles
  ADD COLUMN IF NOT EXISTS resume_path       text,
  ADD COLUMN IF NOT EXISTS cert_paths        text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hazwoper8_cert_path  text,
  ADD COLUMN IF NOT EXISTS physical_cert_path   text;
