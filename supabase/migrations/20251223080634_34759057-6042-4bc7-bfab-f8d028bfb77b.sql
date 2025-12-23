-- Fix storage bucket security: Make analyzed-images private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'analyzed-images';

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view analyzed images" ON storage.objects;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Create owner-only access policy for viewing images
CREATE POLICY "Users can view own images" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload to their own folder
CREATE POLICY "Users can upload own images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);