-- Fix job_posts public SELECT policy to only expose published listings.
-- pending_payment posts are now only visible to the owning employer (via a new scoped policy).
-- This ensures free-riders cannot view a job that has not been paid for.

-- Drop the overly broad public policy
DROP POLICY IF EXISTS "Public can read active jobs" ON job_posts;

-- Strangers can only see published jobs
CREATE POLICY "Public can read published jobs" ON job_posts
  FOR SELECT USING (status = 'published');

-- Employers can always see their own posts regardless of status
CREATE POLICY "Employers can read own job posts" ON job_posts
  FOR SELECT USING (auth.uid() = user_id);

-- Allow payments INSERT by service role only (no authenticated user policy needed;
-- create-checkout-session uses the service-role key which bypasses RLS).
-- This comment is intentional — no policy change required for payments INSERT.
