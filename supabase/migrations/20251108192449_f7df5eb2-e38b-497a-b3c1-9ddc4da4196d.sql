-- Add consolidated YouTube operations counter
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS youtube_operations_count INTEGER NOT NULL DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usage_tracking_youtube_ops ON public.usage_tracking(youtube_operations_count);

-- Update the reset functions to include new counter
DROP FUNCTION IF EXISTS public.reset_daily_usage();
DROP FUNCTION IF EXISTS public.manual_reset_user_usage(UUID);

-- Recreate reset_daily_usage with new counter
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE public.usage_tracking
  SET 
    video_uploads_count = 0,
    ai_captions_count = 0,
    ai_music_count = 0,
    ai_thumbnails_count = 0,
    ai_scripts_count = 0,
    ai_trends_count = 0,
    ai_seo_count = 0,
    ai_hashtags_count = 0,
    ai_speech_to_text_count = 0,
    ai_text_to_speech_count = 0,
    ai_voice_cloning_count = 0,
    ai_dubbing_count = 0,
    ai_voice_isolation_count = 0,
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    youtube_operations_count = 0,
    reset_at = NOW()
  WHERE reset_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'reset_count', reset_count,
    'message', format('Successfully reset %s user(s)', reset_count),
    'reset_time', NOW()
  );
END;
$$;

-- Recreate manual reset with new counter
CREATE OR REPLACE FUNCTION public.manual_reset_user_usage(target_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  UPDATE public.usage_tracking
  SET 
    video_uploads_count = 0,
    ai_captions_count = 0,
    ai_music_count = 0,
    ai_thumbnails_count = 0,
    ai_scripts_count = 0,
    ai_trends_count = 0,
    ai_seo_count = 0,
    ai_hashtags_count = 0,
    ai_speech_to_text_count = 0,
    ai_text_to_speech_count = 0,
    ai_voice_cloning_count = 0,
    ai_dubbing_count = 0,
    ai_voice_isolation_count = 0,
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    youtube_operations_count = 0,
    reset_at = NOW()
  WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'reset_count', reset_count,
    'user_id', target_user_id,
    'message', CASE 
      WHEN reset_count > 0 THEN 'Successfully reset user usage'
      ELSE 'User not found'
    END
  );
END;
$$;

COMMENT ON COLUMN public.usage_tracking.youtube_operations_count IS 'Combined counter for all YouTube operations (uploads, analytics, bulk ops, playlists, etc.)';
COMMENT ON FUNCTION public.reset_daily_usage IS 'Automatically reset all user daily usage counters including YouTube operations (runs via cron at midnight UTC)';
COMMENT ON FUNCTION public.manual_reset_user_usage IS 'Manually reset a specific user usage counters including YouTube operations for admin/testing';
