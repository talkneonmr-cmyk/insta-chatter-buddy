-- Add missing usage tracking columns for AI features
ALTER TABLE public.usage_tracking
ADD COLUMN IF NOT EXISTS ai_speech_to_text_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_text_to_speech_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_voice_cloning_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_dubbing_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_voice_isolation_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_background_removal_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_image_enhancement_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_text_summarizer_count integer NOT NULL DEFAULT 0;