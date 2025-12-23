-- Create app_settings table for global settings like maintenance mode
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed to check maintenance mode)
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert app settings"
ON public.app_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update app settings"
ON public.app_settings
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete app settings"
ON public.app_settings
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Insert default maintenance mode setting (off by default)
INSERT INTO public.app_settings (key, value) 
VALUES ('maintenance_mode', '{"enabled": false, "message": "We are currently performing scheduled maintenance. Please check back soon."}'::jsonb);