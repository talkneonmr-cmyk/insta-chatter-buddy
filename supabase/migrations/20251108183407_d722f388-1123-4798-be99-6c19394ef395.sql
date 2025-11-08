-- Create auto_pilot_settings table
CREATE TABLE public.auto_pilot_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  performance_threshold INTEGER NOT NULL DEFAULT 40,
  check_frequency_hours INTEGER NOT NULL DEFAULT 24,
  auto_apply BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_pilot_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own auto pilot settings"
  ON public.auto_pilot_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto pilot settings"
  ON public.auto_pilot_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto pilot settings"
  ON public.auto_pilot_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto pilot settings"
  ON public.auto_pilot_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_auto_pilot_settings_user_id ON public.auto_pilot_settings(user_id);
CREATE INDEX idx_auto_pilot_enabled ON public.auto_pilot_settings(enabled, last_run_at) WHERE enabled = true;