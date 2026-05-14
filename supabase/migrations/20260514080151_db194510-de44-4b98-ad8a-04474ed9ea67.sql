
-- 1. user_subscriptions: drop user UPDATE policy (admins still can; edge functions use service role)
DROP POLICY IF EXISTS "Users can update own subscription" ON public.user_subscriptions;

-- 2. usage_tracking: drop user UPDATE policy
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;

-- 3. voice-samples bucket: tighten policies
DROP POLICY IF EXISTS "Allow public uploads to voice-samples" ON storage.objects;
CREATE POLICY "Authenticated users upload own voice-samples"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'voice-samples'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users delete own voice-samples"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'voice-samples'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. videos bucket: add DELETE / UPDATE for owners
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. oauth_states table for OAuth CSRF protection
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes')
);
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
-- Only edge functions (service role) read/write; no public policies needed.
CREATE POLICY "Users can create own oauth state"
ON public.oauth_states FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own oauth state"
ON public.oauth_states FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 6. Realtime: require authenticated for channel subscriptions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='realtime' AND c.relname='messages') THEN
    EXECUTE 'ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages';
    EXECUTE 'CREATE POLICY "Authenticated users can receive realtime" ON realtime.messages FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;
