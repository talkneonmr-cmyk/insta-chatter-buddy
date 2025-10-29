-- Create music_generations table to store all generated music
CREATE TABLE public.music_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT,
  lyrics TEXT,
  tags TEXT[],
  bpm INTEGER,
  instrumental BOOLEAN DEFAULT false,
  output_format TEXT DEFAULT 'mp3',
  audio_urls TEXT[],
  task_id TEXT,
  generation_time_ms INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create music_presets table for quick presets
CREATE TABLE public.music_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT,
  tags TEXT[],
  bpm INTEGER,
  instrumental BOOLEAN DEFAULT false,
  icon TEXT,
  is_system_preset BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on music_generations
ALTER TABLE public.music_generations ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_generations
CREATE POLICY "Users can view own music generations"
  ON public.music_generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own music generations"
  ON public.music_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own music generations"
  ON public.music_generations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own music generations"
  ON public.music_generations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on music_presets
ALTER TABLE public.music_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_presets
CREATE POLICY "Users can view all presets"
  ON public.music_presets
  FOR SELECT
  USING (is_system_preset = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own presets"
  ON public.music_presets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system_preset = false);

CREATE POLICY "Users can update own presets"
  ON public.music_presets
  FOR UPDATE
  USING (auth.uid() = user_id AND is_system_preset = false);

CREATE POLICY "Users can delete own presets"
  ON public.music_presets
  FOR DELETE
  USING (auth.uid() = user_id AND is_system_preset = false);

-- Create trigger for updated_at on music_generations
CREATE TRIGGER update_music_generations_updated_at
  BEFORE UPDATE ON public.music_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system presets
INSERT INTO public.music_presets (name, description, prompt_template, tags, bpm, instrumental, icon, is_system_preset) VALUES
  ('Chill Lo-fi', 'Relaxed lo-fi beats perfect for studying or working', 'chill lofi hip hop beats to relax study', ARRAY['lofi', 'chill', 'hip-hop', 'beats'], 85, true, '🎧', true),
  ('Epic Cinematic', 'Grand orchestral music for dramatic moments', 'epic cinematic orchestral adventure music', ARRAY['cinematic', 'orchestral', 'epic', 'soundtrack'], 120, true, '🎬', true),
  ('Upbeat Pop', 'Energetic pop music with catchy melodies', 'upbeat pop song with catchy melody', ARRAY['pop', 'upbeat', 'energetic', 'catchy'], 128, false, '🎤', true),
  ('Relaxing Piano', 'Peaceful piano melodies for meditation', 'peaceful relaxing piano meditation music', ARRAY['piano', 'relaxing', 'meditation', 'ambient'], 72, true, '🎹', true),
  ('Electronic Dance', 'High-energy EDM for parties and workouts', 'energetic electronic dance music edm', ARRAY['edm', 'electronic', 'dance', 'energetic'], 140, true, '🎛️', true),
  ('Acoustic Guitar', 'Warm acoustic guitar melodies', 'warm acoustic guitar folk music', ARRAY['acoustic', 'guitar', 'folk', 'indie'], 95, true, '🎸', true),
  ('Jazz Smooth', 'Smooth jazz with sultry saxophone', 'smooth jazz with saxophone and piano', ARRAY['jazz', 'smooth', 'saxophone', 'chill'], 100, true, '🎷', true),
  ('Rock Energy', 'Powerful rock music with electric guitars', 'powerful energetic rock music electric guitar', ARRAY['rock', 'energetic', 'electric', 'guitar'], 130, true, '🤘', true);