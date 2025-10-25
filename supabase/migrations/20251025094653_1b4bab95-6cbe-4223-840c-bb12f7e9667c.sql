-- Create generated_captions table
CREATE TABLE public.generated_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Input from user
  reel_idea TEXT NOT NULL,
  content_type TEXT DEFAULT 'reel',
  target_audience TEXT,
  brand_voice TEXT,
  
  -- AI-generated content
  caption TEXT NOT NULL,
  hashtags TEXT[],
  description TEXT,
  hook_line TEXT,
  call_to_action TEXT,
  emoji_suggestions TEXT[],
  
  -- Metadata
  ai_model_used TEXT DEFAULT 'google/gemini-2.5-flash',
  generation_time_ms INTEGER,
  is_saved BOOLEAN DEFAULT false,
  saved_to_post_id UUID REFERENCES public.monitored_posts(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_captions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_captions
CREATE POLICY "Users can view own captions"
  ON public.generated_captions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own captions"
  ON public.generated_captions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captions"
  ON public.generated_captions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own captions"
  ON public.generated_captions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_generated_captions_user_id ON public.generated_captions(user_id);
CREATE INDEX idx_generated_captions_created_at ON public.generated_captions(created_at DESC);

-- Create caption_templates table
CREATE TABLE public.caption_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  template_structure TEXT NOT NULL,
  example_caption TEXT,
  suggested_hashtags TEXT[],
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for templates (public read access)
ALTER TABLE public.caption_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
  ON public.caption_templates FOR SELECT
  USING (true);

-- Seed with popular templates
INSERT INTO public.caption_templates (name, category, template_structure, suggested_hashtags, icon) VALUES
('Viral Hook Formula', 'engagement', 'Stop scrolling! 🛑 [Your hook here]

[Problem statement]

[Your solution]

Double tap if you agree! 💯', ARRAY['viral', 'trending', 'explore'], 'Zap'),
('Storytelling', 'emotional', '[Start with emotion] 💭

[Tell the story]

[Lesson learned]

Tag someone who needs this! 👇', ARRAY['story', 'motivation', 'inspiration'], 'Heart'),
('Educational Value', 'educational', '3 things I wish I knew about [topic]:

1️⃣ [Point 1]
2️⃣ [Point 2]
3️⃣ [Point 3]

Save this for later! 📌', ARRAY['tips', 'education', 'howto'], 'BookOpen'),
('Promotional', 'promotional', '🎉 NEW [Product/Service] ALERT!

[Key benefit 1]
[Key benefit 2]
[Key benefit 3]

Link in bio 👆', ARRAY['newproduct', 'launch', 'announcement'], 'Megaphone'),
('Question Hook', 'engagement', 'Would you rather [Option A] or [Option B]? 🤔

Comment below! I''ll go first... 👇', ARRAY['question', 'poll', 'engagement'], 'MessageCircle');

-- Add trigger for updated_at
CREATE TRIGGER update_generated_captions_updated_at
  BEFORE UPDATE ON public.generated_captions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();