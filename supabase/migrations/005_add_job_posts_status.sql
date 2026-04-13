-- CRITICAL: Add missing status column to job_posts
-- The frontend filters by status and inserts with status='pending_payment'
-- Without this column, job browsing returns empty and job posting fails.

ALTER TABLE job_posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_payment';

-- Backfill existing rows: active=true => published, else pending_payment
UPDATE job_posts
SET status = CASE WHEN active = true THEN 'published' ELSE 'pending_payment' END
WHERE status IS NULL;

-- Drop the old overly broad SELECT policy and replace with status-scoped one
DROP POLICY IF EXISTS "Allow public select on job_posts" ON job_posts;
DROP POLICY IF EXISTS "Public can read published jobs" ON job_posts;

CREATE POLICY "Public can read active jobs" ON job_posts
  FOR SELECT USING (status IN ('published', 'pending_payment'));
