-- Fix search path security for the reset functions
DROP FUNCTION IF EXISTS public.reset_daily_usage();
DROP FUNCTION IF EXISTS public.manual_reset_user_usage(UUID);

-- Recreate reset_daily_usage with secure search_path
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset all users whose last reset was more than 24 hours ago
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

-- Recreate manual_reset_user_usage with secure search_path
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

COMMENT ON FUNCTION public.reset_daily_usage IS 'Automatically reset all user daily usage counters (runs via cron at midnight UTC) - Secure version with fixed search_path';
COMMENT ON FUNCTION public.manual_reset_user_usage IS 'Manually reset a specific user usage counters for admin/testing - Secure version with fixed search_path';
