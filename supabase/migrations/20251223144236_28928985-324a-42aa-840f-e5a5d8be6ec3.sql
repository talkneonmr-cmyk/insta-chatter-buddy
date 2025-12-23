-- Add You Research usage tracking column
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS ai_you_research_count integer NOT NULL DEFAULT 0;

-- Update the reset_daily_usage function to include the new column
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    ai_shorts_packages_count = 0,
    ai_creator_helper_bot_count = 0,
    ai_you_research_count = 0,
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

-- Update the manual_reset_user_usage function to include the new column
CREATE OR REPLACE FUNCTION public.manual_reset_user_usage(target_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    ai_background_removal_count = 0,
    ai_image_enhancement_count = 0,
    ai_text_summarizer_count = 0,
    ai_shorts_packages_count = 0,
    ai_creator_helper_bot_count = 0,
    ai_you_research_count = 0,
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