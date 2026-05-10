
CREATE TABLE public.dr_fabuos_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New consultation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.dr_fabuos_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dr_fabuos_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drfab_conv_user ON public.dr_fabuos_conversations(user_id, updated_at DESC);
CREATE INDEX idx_drfab_msg_conv ON public.dr_fabuos_messages(conversation_id, created_at);

ALTER TABLE public.dr_fabuos_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dr_fabuos_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own conv select" ON public.dr_fabuos_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own conv insert" ON public.dr_fabuos_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conv update" ON public.dr_fabuos_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own conv delete" ON public.dr_fabuos_conversations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own msg select" ON public.dr_fabuos_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.dr_fabuos_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msg update" ON public.dr_fabuos_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own msg delete" ON public.dr_fabuos_messages FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_drfab_conv_updated
BEFORE UPDATE ON public.dr_fabuos_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
