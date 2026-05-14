
CREATE TABLE public.instagram_reel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instagram_account_id uuid NOT NULL,
  scheduled_video_id uuid,
  source_video_path text,
  caption text,
  ig_media_id text,
  ig_permalink text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_reel_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reel posts" ON public.instagram_reel_posts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reel posts" ON public.instagram_reel_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reel posts" ON public.instagram_reel_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_instagram_reel_posts_user ON public.instagram_reel_posts(user_id, created_at DESC);
