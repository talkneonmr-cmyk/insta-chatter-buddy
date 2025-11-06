-- Create table for monitored videos for comment auto-responder
CREATE TABLE public.youtube_monitored_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable Row Level Security
ALTER TABLE public.youtube_monitored_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own monitored videos" 
ON public.youtube_monitored_videos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitored videos" 
ON public.youtube_monitored_videos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitored videos" 
ON public.youtube_monitored_videos 
FOR DELETE 
USING (auth.uid() = user_id);