-- Create storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-samples',
  'voice-samples',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload voice samples
CREATE POLICY "Allow public uploads to voice-samples"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'voice-samples');

-- Allow public access to voice samples
CREATE POLICY "Allow public access to voice-samples"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'voice-samples');