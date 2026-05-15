CREATE TABLE IF NOT EXISTS public.creator_ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  primary_country text NOT NULL DEFAULT 'US',
  target_countries text[] NOT NULL DEFAULT ARRAY['US']::text[],
  timezone text NOT NULL DEFAULT 'UTC',
  niche text,
  audience_notes text,
  ai_upload_mode text NOT NULL DEFAULT 'assisted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creator_ai_settings_upload_mode_check CHECK (ai_upload_mode IN ('manual','assisted','automatic'))
);

ALTER TABLE public.creator_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own creator AI settings" ON public.creator_ai_settings;
DROP POLICY IF EXISTS "Users insert own creator AI settings" ON public.creator_ai_settings;
DROP POLICY IF EXISTS "Users update own creator AI settings" ON public.creator_ai_settings;
DROP POLICY IF EXISTS "Users delete own creator AI settings" ON public.creator_ai_settings;

CREATE POLICY "Users view own creator AI settings"
ON public.creator_ai_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own creator AI settings"
ON public.creator_ai_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own creator AI settings"
ON public.creator_ai_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own creator AI settings"
ON public.creator_ai_settings
FOR DELETE
USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_creator_ai_settings_updated_at ON public.creator_ai_settings;
CREATE TRIGGER update_creator_ai_settings_updated_at
BEFORE UPDATE ON public.creator_ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.scheduled_videos
  ADD COLUMN IF NOT EXISTS schedule_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS best_time_reason text,
  ADD COLUMN IF NOT EXISTS targeting_context jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.scheduled_videos
  DROP CONSTRAINT IF EXISTS scheduled_videos_schedule_mode_check;

ALTER TABLE public.scheduled_videos
  ADD CONSTRAINT scheduled_videos_schedule_mode_check
  CHECK (schedule_mode IN ('instant','manual','ai_best_time'));

CREATE INDEX IF NOT EXISTS idx_creator_ai_settings_user_id
  ON public.creator_ai_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_videos_schedule_mode
  ON public.scheduled_videos(schedule_mode);

DROP POLICY IF EXISTS "Users update own reel posts" ON public.instagram_reel_posts;
CREATE POLICY "Users update own reel posts"
ON public.instagram_reel_posts
FOR UPDATE
USING (auth.uid() = user_id);