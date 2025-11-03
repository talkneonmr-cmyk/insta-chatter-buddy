-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own tester session" ON public.tester_sessions;

-- Allow public (anon) access to validate tester sessions by token
CREATE POLICY "Public can validate tester sessions"
ON public.tester_sessions
FOR SELECT
TO anon, authenticated
USING (true);