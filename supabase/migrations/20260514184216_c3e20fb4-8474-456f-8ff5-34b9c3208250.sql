ALTER TABLE public.scheduled_videos
  ALTER COLUMN youtube_account_id DROP NOT NULL;

ALTER TABLE public.scheduled_videos
  ADD COLUMN IF NOT EXISTS target_platform text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS instagram_account_id uuid REFERENCES public.instagram_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS instagram_caption text,
  ADD COLUMN IF NOT EXISTS instagram_media_id text,
  ADD COLUMN IF NOT EXISTS instagram_permalink text,
  ADD COLUMN IF NOT EXISTS instagram_error text;

ALTER TABLE public.scheduled_videos
  DROP CONSTRAINT IF EXISTS scheduled_videos_status_check;

ALTER TABLE public.scheduled_videos
  ADD CONSTRAINT scheduled_videos_status_check
  CHECK (status = ANY (ARRAY[
    'pending','scheduled','processing','uploading',
    'uploaded','published','failed','partial'
  ]));

ALTER TABLE public.scheduled_videos
  DROP CONSTRAINT IF EXISTS scheduled_videos_target_platform_check;

ALTER TABLE public.scheduled_videos
  ADD CONSTRAINT scheduled_videos_target_platform_check
  CHECK (target_platform = ANY (ARRAY['youtube','instagram','both']));

CREATE INDEX IF NOT EXISTS idx_scheduled_videos_target_platform
  ON public.scheduled_videos(target_platform);