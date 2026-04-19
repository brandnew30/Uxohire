-- Create user_accounts table for account type tracking
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type text NOT NULL DEFAULT 'technician' CHECK (account_type IN ('technician', 'employer')),
  is_paid_employer boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own account" ON user_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own account" ON user_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON user_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow any authenticated user to read account types (needed for employer paid status checks)
CREATE POLICY "Authenticated users can read all accounts" ON user_accounts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add phone and website to employer_profiles if not present
ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text;
