-- Create table for tester access keys
CREATE TABLE public.tester_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  usage_count integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.tester_keys ENABLE ROW LEVEL SECURITY;

-- Admins can manage tester keys
CREATE POLICY "Admins can insert tester keys"
ON public.tester_keys
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all tester keys"
ON public.tester_keys
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tester keys"
ON public.tester_keys
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tester keys"
ON public.tester_keys
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create table to track tester sessions
CREATE TABLE public.tester_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_key_id uuid REFERENCES public.tester_keys(id) ON DELETE CASCADE NOT NULL,
  session_token text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.tester_sessions ENABLE ROW LEVEL SECURITY;

-- Allow reading own tester session
CREATE POLICY "Users can view their own tester session"
ON public.tester_sessions
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_tester_keys_key_code ON public.tester_keys(key_code);
CREATE INDEX idx_tester_sessions_token ON public.tester_sessions(session_token);