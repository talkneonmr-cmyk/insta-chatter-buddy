-- Add ai_face_swap_count column to usage_tracking table
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS ai_face_swap_count INTEGER NOT NULL DEFAULT 0;