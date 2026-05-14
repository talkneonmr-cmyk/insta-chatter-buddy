
CREATE TABLE public.channel_dna_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  youtube_account_id uuid NOT NULL,
  channel_id text NOT NULL,
  channel_title text NOT NULL,
  niche text,
  sub_niche text,
  target_audience jsonb,
  content_pillars jsonb,
  voice_tone jsonb,
  viral_patterns jsonb,
  weaknesses jsonb,
  strengths jsonb,
  recommendations jsonb,
  growth_score integer,
  bottleneck text,
  next_action text,
  videos_analyzed integer NOT NULL DEFAULT 0,
  raw_summary text,
  ai_model_used text DEFAULT 'google/gemini-2.5-flash',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_dna_user ON public.channel_dna_profiles(user_id);
CREATE INDEX idx_channel_dna_account ON public.channel_dna_profiles(youtube_account_id);

ALTER TABLE public.channel_dna_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own dna" ON public.channel_dna_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own dna" ON public.channel_dna_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own dna" ON public.channel_dna_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own dna" ON public.channel_dna_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_channel_dna_updated_at
  BEFORE UPDATE ON public.channel_dna_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.viral_video_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel_dna_id uuid REFERENCES public.channel_dna_profiles(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  video_title text NOT NULL,
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments bigint DEFAULT 0,
  published_at timestamp with time zone,
  hook_analysis text,
  pacing_analysis text,
  emotion_analysis text,
  structure jsonb,
  why_it_worked jsonb,
  replicable_formula text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_viral_insights_user ON public.viral_video_insights(user_id);
CREATE INDEX idx_viral_insights_dna ON public.viral_video_insights(channel_dna_id);

ALTER TABLE public.viral_video_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own viral insights" ON public.viral_video_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own viral insights" ON public.viral_video_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own viral insights" ON public.viral_video_insights FOR DELETE USING (auth.uid() = user_id);
