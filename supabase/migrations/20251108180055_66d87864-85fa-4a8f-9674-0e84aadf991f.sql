-- Add shorts packages count to usage tracking
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS ai_shorts_packages_count integer NOT NULL DEFAULT 0;