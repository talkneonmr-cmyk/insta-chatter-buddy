-- Add admin policies for usage_tracking table
CREATE POLICY "Admins can view all usage"
  ON public.usage_tracking
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all usage"
  ON public.usage_tracking
  FOR UPDATE
  USING (public.is_admin(auth.uid()));