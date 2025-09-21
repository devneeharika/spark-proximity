-- Fix RLS policy for avatar uploads during signup
-- Drop existing INSERT policy and recreate with better logic
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Create new policy that allows uploads during signup (when user is not yet authenticated)
-- or when user is authenticated and uploading to their own folder
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (
    -- Allow uploads during signup when not authenticated
    auth.uid() IS NULL
    -- Or allow authenticated users to upload to their own folder
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);

-- Also update the existing policies to be more permissive for unauthenticated uploads
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND (
    -- Allow during signup
    auth.uid() IS NULL
    -- Or for authenticated users in their own folder
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND (
    -- Allow during signup
    auth.uid() IS NULL
    -- Or for authenticated users in their own folder
    OR (auth.uid())::text = (storage.foldername(name))[1]
  )
);