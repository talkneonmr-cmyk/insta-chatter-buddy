-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create user_read_announcements to track which users have read which announcements
CREATE TABLE public.user_read_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_read_announcements ENABLE ROW LEVEL SECURITY;

-- Announcements: Everyone can read active announcements
CREATE POLICY "Anyone can read active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Announcements: Only admins can insert
CREATE POLICY "Admins can create announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Announcements: Only admins can update
CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Announcements: Only admins can delete
CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- User read announcements: Users can see their own reads
CREATE POLICY "Users can see their own read announcements"
ON public.user_read_announcements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- User read announcements: Users can mark as read
CREATE POLICY "Users can mark announcements as read"
ON public.user_read_announcements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User read announcements: Users can delete their own
CREATE POLICY "Users can delete their own read marks"
ON public.user_read_announcements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);