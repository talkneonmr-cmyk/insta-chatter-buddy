-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', false);

-- Allow authenticated users to upload their own videos
CREATE POLICY "Users can upload own videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to read their own videos
CREATE POLICY "Users can read own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to access all videos (for edge function uploads)
CREATE POLICY "Service role can access all videos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'videos');