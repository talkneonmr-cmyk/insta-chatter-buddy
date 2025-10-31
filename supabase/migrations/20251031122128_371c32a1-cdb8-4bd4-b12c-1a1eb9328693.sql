-- Create generated_thumbnails table
CREATE TABLE public.generated_thumbnails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_id UUID,
  generation_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'google/gemini-2.5-flash-image-preview',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for thumbnails
CREATE POLICY "Users can view own thumbnails"
  ON public.generated_thumbnails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own thumbnails"
  ON public.generated_thumbnails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thumbnails"
  ON public.generated_thumbnails FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thumbnails"
  ON public.generated_thumbnails FOR DELETE
  USING (auth.uid() = user_id);

-- Create generated_scripts table
CREATE TABLE public.generated_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  video_topic TEXT NOT NULL,
  video_length TEXT NOT NULL,
  tone TEXT NOT NULL,
  target_audience TEXT,
  script_content TEXT NOT NULL,
  hook TEXT,
  key_points JSONB,
  call_to_action TEXT,
  timestamps JSONB,
  generation_time_ms INTEGER,
  ai_model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  is_favorite BOOLEAN DEFAULT false,
  video_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scripts
CREATE POLICY "Users can view own scripts"
  ON public.generated_scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scripts"
  ON public.generated_scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON public.generated_scripts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON public.generated_scripts FOR DELETE
  USING (auth.uid() = user_id);

-- Add new columns to usage_tracking
ALTER TABLE public.usage_tracking
ADD COLUMN ai_thumbnails_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN ai_scripts_count INTEGER NOT NULL DEFAULT 0;

-- Create thumbnails storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies for thumbnails
CREATE POLICY "Thumbnails are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload own thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thumbnails' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add triggers for updated_at
CREATE TRIGGER update_generated_thumbnails_updated_at
  BEFORE UPDATE ON public.generated_thumbnails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_scripts_updated_at
  BEFORE UPDATE ON public.generated_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();