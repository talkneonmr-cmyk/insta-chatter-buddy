-- Add music generation tracking to usage_tracking table
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS ai_music_count integer NOT NULL DEFAULT 0;