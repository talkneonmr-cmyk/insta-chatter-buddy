-- Create table for AI trend analysis
CREATE TABLE public.trend_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  niche TEXT NOT NULL,
  analysis_content TEXT NOT NULL,
  trends JSONB,
  suggestions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI SEO optimization
CREATE TABLE public.seo_optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_title TEXT NOT NULL,
  optimized_title TEXT NOT NULL,
  keywords JSONB,
  tags JSONB,
  optimized_description TEXT,
  seo_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI hashtag generation
CREATE TABLE public.hashtag_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  hashtags JSONB NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI content repurposing
CREATE TABLE public.content_repurposing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  repurposed_content TEXT NOT NULL,
  suggestions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trend_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_repurposing ENABLE ROW LEVEL SECURITY;

-- Create policies for trend_analyses
CREATE POLICY "Users can view their own trend analyses" 
ON public.trend_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trend analyses" 
ON public.trend_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trend analyses" 
ON public.trend_analyses FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for seo_optimizations
CREATE POLICY "Users can view their own SEO optimizations" 
ON public.seo_optimizations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SEO optimizations" 
ON public.seo_optimizations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SEO optimizations" 
ON public.seo_optimizations FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for hashtag_generations
CREATE POLICY "Users can view their own hashtag generations" 
ON public.hashtag_generations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hashtag generations" 
ON public.hashtag_generations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hashtag generations" 
ON public.hashtag_generations FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for content_repurposing
CREATE POLICY "Users can view their own content repurposing" 
ON public.content_repurposing FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content repurposing" 
ON public.content_repurposing FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content repurposing" 
ON public.content_repurposing FOR DELETE 
USING (auth.uid() = user_id);

-- Add new usage tracking columns
ALTER TABLE public.usage_tracking 
ADD COLUMN IF NOT EXISTS ai_trends_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_seo_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_hashtags_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_repurpose_count INTEGER DEFAULT 0;