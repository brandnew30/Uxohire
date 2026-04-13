-- LOW: Create payments table for Stripe integration
-- Tracks payment sessions per job post; Stripe webhook updates status here
-- and triggers job_posts.status -> 'published'

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id         uuid REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
  employer_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id   text UNIQUE,
  stripe_payment_intent text,
  amount_cents        integer NOT NULL DEFAULT 14900,  -- $149.00
  currency            text NOT NULL DEFAULT 'usd',
  status              text NOT NULL DEFAULT 'pending',
  -- status values: pending | paid | failed | refunded
  paid_at             timestamptz,
  expires_at          timestamptz,  -- job post expiry (paid_at + 30 days)
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Employers can view their own payments
CREATE POLICY "Employers can read own payments" ON payments
  FOR SELECT USING (auth.uid() = employer_id);

-- Only service role (Stripe webhook) can insert/update payments
-- No INSERT/UPDATE policies for authenticated users — handled server-side

-- Index for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS payments_stripe_session_idx ON payments (stripe_session_id);
CREATE INDEX IF NOT EXISTS payments_job_post_idx ON payments (job_post_id);
