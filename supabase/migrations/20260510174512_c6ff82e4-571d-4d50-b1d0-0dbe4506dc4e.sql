
-- Dr. Fabuos subscriptions
CREATE TABLE public.dr_fabuos_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free', -- free | trial | pro
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dr_fabuos_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can view own dr_fabuos sub" ON public.dr_fabuos_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE TRIGGER dr_fabuos_subs_updated BEFORE UPDATE ON public.dr_fabuos_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily usage per user for Dr. Fabuos
CREATE TABLE public.dr_fabuos_daily_usage (
  user_id uuid NOT NULL,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
);
ALTER TABLE public.dr_fabuos_daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user can view own dr_fabuos usage" ON public.dr_fabuos_daily_usage
  FOR SELECT USING (auth.uid() = user_id);
