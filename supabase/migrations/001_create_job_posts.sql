CREATE TABLE IF NOT EXISTS job_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company text NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  type text DEFAULT 'Contract',
  salary text,
  description text,
  required_certs text[] DEFAULT '{}',
  preferred_certs text[] DEFAULT '{}',
  status text DEFAULT 'pending_payment',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published job posts
CREATE POLICY "Public can read published jobs" ON job_posts
  FOR SELECT USING (status = 'published' OR status = 'pending_payment');

-- Allow anyone to insert (no auth yet)
CREATE POLICY "Anyone can insert job posts" ON job_posts
  FOR INSERT WITH CHECK (true);
