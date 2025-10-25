-- Create youtube_accounts table to store connected YouTube channels
CREATE TABLE public.youtube_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled_videos table for video scheduling
CREATE TABLE public.scheduled_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  youtube_account_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  category_id TEXT DEFAULT '22',
  privacy_status TEXT DEFAULT 'private' CHECK (privacy_status IN ('public', 'private', 'unlisted')),
  video_file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'uploaded', 'failed')),
  youtube_video_id TEXT,
  ai_generated_metadata BOOLEAN DEFAULT false,
  upload_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video_uploads_history table for tracking all uploads
CREATE TABLE public.video_uploads_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  youtube_account_id UUID NOT NULL,
  scheduled_video_id UUID,
  title TEXT NOT NULL,
  youtube_video_id TEXT,
  status TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.youtube_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_uploads_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_accounts
CREATE POLICY "Users can view own youtube accounts"
  ON public.youtube_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own youtube accounts"
  ON public.youtube_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own youtube accounts"
  ON public.youtube_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own youtube accounts"
  ON public.youtube_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_videos
CREATE POLICY "Users can view own scheduled videos"
  ON public.scheduled_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled videos"
  ON public.scheduled_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled videos"
  ON public.scheduled_videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled videos"
  ON public.scheduled_videos FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for video_uploads_history
CREATE POLICY "Users can view own video uploads history"
  ON public.video_uploads_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video uploads history"
  ON public.video_uploads_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_youtube_accounts_user_id ON public.youtube_accounts(user_id);
CREATE INDEX idx_scheduled_videos_user_id ON public.scheduled_videos(user_id);
CREATE INDEX idx_scheduled_videos_status ON public.scheduled_videos(status);
CREATE INDEX idx_scheduled_videos_scheduled_for ON public.scheduled_videos(scheduled_for);
CREATE INDEX idx_video_uploads_history_user_id ON public.video_uploads_history(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_youtube_accounts_updated_at
  BEFORE UPDATE ON public.youtube_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_videos_updated_at
  BEFORE UPDATE ON public.scheduled_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();