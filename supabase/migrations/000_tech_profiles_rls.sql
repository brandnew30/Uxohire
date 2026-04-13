-- Enable RLS on tech_profiles if not already
ALTER TABLE tech_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public to read open-to-work profiles
CREATE POLICY "Public can read open profiles" ON tech_profiles
  FOR SELECT USING (open_to_work = true);

-- Allow anyone to insert
CREATE POLICY "Anyone can insert tech profiles" ON tech_profiles
  FOR INSERT WITH CHECK (true);
