-- Remove ai_voice_isolation_count column (feature not implemented)
ALTER TABLE public.usage_tracking DROP COLUMN IF EXISTS ai_voice_isolation_count;

-- Update reset_daily_usage function to exclude ai_voice_isolation
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    ai_shorts_packages_count = 0,
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
$function$;

-- Update manual_reset_user_usage function to exclude ai_voice_isolation
CREATE OR REPLACE FUNCTION public.manual_reset_user_usage(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    ai_shorts_packages_count = 0,
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
$function$;

COMMENT ON COLUMN public.usage_tracking.ai_shorts_packages_count IS 'Counter for AI Shorts Factory package generations';