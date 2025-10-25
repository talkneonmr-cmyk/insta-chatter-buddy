-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create instagram_accounts table
CREATE TABLE public.instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, instagram_user_id)
);

ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instagram accounts"
  ON public.instagram_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram accounts"
  ON public.instagram_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram accounts"
  ON public.instagram_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram accounts"
  ON public.instagram_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create monitored_posts table
CREATE TABLE public.monitored_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  post_url TEXT NOT NULL,
  post_title TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.monitored_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monitored posts"
  ON public.monitored_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitored posts"
  ON public.monitored_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitored posts"
  ON public.monitored_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitored posts"
  ON public.monitored_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monitored_post_id UUID NOT NULL REFERENCES public.monitored_posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_keywords TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',
  goal TEXT DEFAULT 'share coupon',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation rules"
  ON public.automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own automation rules"
  ON public.automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own automation rules"
  ON public.automation_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create comments_log table
CREATE TABLE public.comments_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monitored_post_id UUID NOT NULL REFERENCES public.monitored_posts(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL UNIQUE,
  commenter_username TEXT NOT NULL,
  commenter_name TEXT,
  comment_text TEXT NOT NULL,
  trigger_matched BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.comments_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comments logs"
  ON public.comments_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments logs"
  ON public.comments_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create dms_sent table
CREATE TABLE public.dms_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_log_id UUID NOT NULL REFERENCES public.comments_log(id) ON DELETE CASCADE,
  recipient_username TEXT NOT NULL,
  message_text TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dms_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dms sent"
  ON public.dms_sent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dms sent"
  ON public.dms_sent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instagram_accounts_updated_at
  BEFORE UPDATE ON public.instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monitored_posts_updated_at
  BEFORE UPDATE ON public.monitored_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();