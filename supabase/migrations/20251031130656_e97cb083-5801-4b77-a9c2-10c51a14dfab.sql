-- Remove Content Repurposer feature
-- Drop the content_repurposing table
DROP TABLE IF EXISTS public.content_repurposing;

-- Remove ai_repurpose_count column from usage_tracking
ALTER TABLE public.usage_tracking
DROP COLUMN IF EXISTS ai_repurpose_count;