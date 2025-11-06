-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table for auto-responder settings
CREATE TABLE public.youtube_comment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  response_style text DEFAULT 'friendly',
  custom_instructions text,
  blacklist_keywords text[],
  min_comment_length integer DEFAULT 10,
  reply_delay_minutes integer DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table to track processed comments
CREATE TABLE public.youtube_comment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  comment_id text NOT NULL,
  comment_text text NOT NULL,
  reply_text text,
  status text NOT NULL, -- 'pending', 'replied', 'skipped', 'failed'
  skip_reason text,
  created_at timestamptz DEFAULT now(),
  replied_at timestamptz,
  UNIQUE(comment_id)
);

-- Enable RLS
ALTER TABLE public.youtube_comment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_comment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
CREATE POLICY "Users can view own settings"
  ON public.youtube_comment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.youtube_comment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.youtube_comment_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for logs
CREATE POLICY "Users can view own logs"
  ON public.youtube_comment_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.youtube_comment_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_comment_settings_user ON public.youtube_comment_settings(user_id);
CREATE INDEX idx_comment_logs_user ON public.youtube_comment_logs(user_id);
CREATE INDEX idx_comment_logs_status ON public.youtube_comment_logs(status);
CREATE INDEX idx_comment_logs_created ON public.youtube_comment_logs(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_youtube_comment_settings_updated_at
  BEFORE UPDATE ON public.youtube_comment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();