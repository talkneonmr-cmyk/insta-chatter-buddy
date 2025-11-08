-- Create video_performance_tracking table
CREATE TABLE IF NOT EXISTS public.video_performance_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_title text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  performance_score numeric NOT NULL DEFAULT 0,
  optimization_suggested boolean NOT NULL DEFAULT false,
  optimization_applied boolean NOT NULL DEFAULT false,
  last_checked timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Create optimization_suggestions table
CREATE TABLE IF NOT EXISTS public.optimization_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  user_id uuid NOT NULL,
  suggestion_type text NOT NULL,
  original_content text,
  suggested_content text NOT NULL,
  ai_reasoning text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_performance_tracking
CREATE POLICY "Users can view own performance tracking"
  ON public.video_performance_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance tracking"
  ON public.video_performance_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance tracking"
  ON public.video_performance_tracking
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance tracking"
  ON public.video_performance_tracking
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for optimization_suggestions
CREATE POLICY "Users can view own optimization suggestions"
  ON public.optimization_suggestions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own optimization suggestions"
  ON public.optimization_suggestions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own optimization suggestions"
  ON public.optimization_suggestions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own optimization suggestions"
  ON public.optimization_suggestions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_performance_user_id ON public.video_performance_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_video_performance_score ON public.video_performance_tracking(performance_score);
CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_user_id ON public.optimization_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_suggestions_video_id ON public.optimization_suggestions(video_id);