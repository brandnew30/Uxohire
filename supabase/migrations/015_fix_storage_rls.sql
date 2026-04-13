-- MEDIUM: Fix storage RLS policies on uxo-uploads bucket
-- Current policies incorrectly target the 'anon' role — anyone can upload/read.
-- Should require authentication.

-- Drop incorrect policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read own files" ON storage.objects;

-- Authenticated users can upload to uxo-uploads (any path)
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uxo-uploads');

-- Users can read only their own uploaded files (path starts with their user id)
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'uxo-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'uxo-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
