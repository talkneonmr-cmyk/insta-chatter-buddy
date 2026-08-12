import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Stethoscope,
  Plus,
  Send,
  ImagePlus,
  Mic,
  Square,
  X,
  AlertTriangle,
  LogIn,
  History,
  Trash2,
  Sparkles,
  Pill,
  ScanLine,
  HeartPulse,
  Sun,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useDrFabuosChat, Attachment } from "@/hooks/useDrFabuosChat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Conv = { id: string; title: string; updated_at: string };

const SUGGESTED = [
  { icon: ScanLine, label: "Explain my prescription", prompt: "Can you explain what's in my prescription? I'll upload a photo." },
  { icon: Sun, label: "Skin concern check", prompt: "I have a skin concern I'd like you to look at." },
  { icon: HeartPulse, label: "Symptom guidance", prompt: "I've been feeling unwell. Can you help me figure out what might be going on?" },
  { icon: Pill, label: "Medicine info", prompt: "What is this medicine for and how should I take it?" },
];

type Plan = { plan: 'free' | 'trial' | 'pro'; current_period_end: string | null };

export default function DrFabuos() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<null | 'trial' | 'pro'>(null);
  const [plan, setPlan] = useState<Plan>({ plan: 'free', current_period_end: null });
  const [todayCount, setTodayCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { messages, sendMessage, isStreaming, stop, reset, guestUsage, guestLimit } = useDrFabuosChat({
    isAuthed: !!authed,
    conversationId,
    onConversationCreated: (id) => {
      setConversationId(id);
      loadConversations();
    },
    onLimitReached: () => setPaywallOpen(true),
  });

  const loadPlan = async () => {
    if (!authed) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('dr_fabuos_subscriptions')
      .select('plan, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setPlan({ plan: data.plan as any, current_period_end: data.current_period_end });
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data: u } = await supabase
      .from('dr_fabuos_daily_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();
    setTodayCount(u?.count ?? 0);
  };

  useEffect(() => { if (authed) loadPlan(); }, [authed, isStreaming]);

  // Handle Razorpay redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('dr_payment')) return;
    const linkId = params.get('razorpay_payment_link_id') || localStorage.getItem('dr_fabuos_payment_link_id');
    if (!linkId) return;
    (async () => {
      const { data, error } = await supabase.functions.invoke('dr-fabuos-verify', {
        body: { paymentLinkId: linkId },
      });
      if (!error && data?.success) {
        toast.success(data.plan === 'pro' ? 'Pro activated. Unlimited chats unlocked.' : 'Trial activated. Enjoy 30 days unlimited.');
        localStorage.removeItem('dr_fabuos_payment_link_id');
        loadPlan();
      } else if (data?.paymentStatus && data.paymentStatus !== 'paid') {
        toast.error('Payment not completed.');
      }
      window.history.replaceState({}, '', '/dr-fabuos');
    })();
  }, [authed]);

  const startCheckout = async (planType: 'trial' | 'pro') => {
    if (!authed) { navigate('/auth'); return; }
    try {
      setCheckoutLoading(planType);
      const { data, error } = await supabase.functions.invoke('dr-fabuos-subscribe', { body: { planType } });
      if (error) throw error;
      if (data?.shortUrl && data?.paymentLinkId) {
        localStorage.setItem('dr_fabuos_payment_link_id', data.paymentLinkId);
        window.location.href = data.shortUrl;
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not start checkout.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const isPaid = plan.plan !== 'free' && plan.current_period_end && new Date(plan.current_period_end) > new Date();
  const FREE_LIMIT = 20;

  const loadConversations = async () => {
    if (!authed) return;
    const { data } = await supabase
      .from("dr_fabuos_conversations")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data as Conv[]);
  };

  useEffect(() => {
    if (authed) loadConversations();
  }, [authed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!authed && pending.length + files.length > 1) {
      toast.error("Sign in to upload more images.");
      return;
    }
    files.forEach((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is too large (max 5MB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setPending((p) => [...p, { type: "image", dataUrl: reader.result as string, name: f.name }]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };

  const submit = (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && pending.length === 0) return;
    sendMessage(text, pending);
    setInput("");
    setPending([]);
  };

  const newChat = () => {
    setConversationId(null);
    reset();
  };

  const deleteConv = async (id: string) => {
    await supabase.from("dr_fabuos_conversations").delete().eq("id", id);
    if (conversationId === id) newChat();
    loadConversations();
  };

  const showWelcome = messages.length === 0;

  return (
    <>
      <Helmet>
        <title>Dr. Fabuos AI — Your Personal AI Doctor & Health Assistant</title>
        <meta
          name="description"
          content="Chat with Dr. Fabuos AI — a premium AI doctor for medical questions, prescription scanning, skin analysis, symptom guidance and medicine help. Multilingual, free to start."
        />
        <link rel="canonical" href="https://fabuos.com/dr-fabuos" />
      </Helmet>

      <div className="flex h-[100dvh] w-full bg-gradient-to-br from-background via-muted/10 to-background text-foreground">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r border-border/50 bg-card/80 backdrop-blur-xl transition-transform md:static md:translate-x-0",
            showHistory ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center justify-between px-4 border-b border-border/50">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">Dr. Fabuos</span>
            </Link>
            <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setShowHistory(false)} aria-label="Close history">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-3">
            <Button onClick={newChat} className="w-full justify-start gap-2" variant="outline">
              <Plus className="h-4 w-4" /> New consultation
            </Button>
          </div>

          <ScrollArea className="h-[calc(100dvh-9rem)] px-2">
            {authed ? (
              conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground px-3 py-6 text-center">No past chats yet.</p>
              ) : (
                <div className="space-y-1 py-2">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setConversationId(c.id)}
                      className={cn(
                        "group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm hover:bg-accent/60 transition",
                        conversationId === c.id && "bg-accent/80"
                      )}
                    >
                      <span className="truncate">{c.title}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Delete conversation ${c.title}`}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition shrink-0 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConv(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <div className="px-3 py-6 text-center space-y-3">
                <p className="text-xs text-muted-foreground">Sign in to save your chat history and unlock unlimited messages.</p>
                <Button size="sm" onClick={() => navigate("/auth")} className="w-full gap-2">
                  <LogIn className="h-3.5 w-3.5" /> Sign in
                </Button>
              </div>
            )}
          </ScrollArea>

          <div className="absolute bottom-0 inset-x-0 p-3 border-t border-border/50 text-xs text-muted-foreground space-y-2">
            {!authed ? (
              <div>Guest: {guestUsage.count}/{guestLimit} messages today</div>
            ) : isPaid ? (
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 font-medium capitalize">{plan.plan} active</span>
                <span className="text-[10px]">until {plan.current_period_end ? new Date(plan.current_period_end).toLocaleDateString() : ''}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div>Free: {todayCount}/{FREE_LIMIT} today</div>
                <Button size="sm" className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white" onClick={() => setPaywallOpen(true)}>
                  Upgrade · ₹99 trial
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/60 backdrop-blur-xl">
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setShowHistory(true)}
              aria-label="Open history"
            >
              <History className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Stethoscope className="h-3.5 w-3.5 text-white" />
              </div>
              <h1 className="font-semibold text-sm md:text-base">Dr. Fabuos AI — Your AI Doctor</h1>
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Beta
              </span>
            </div>
            {!authed ? (
              <Button size="sm" variant="outline" onClick={() => navigate("/auth")} className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" /> Sign in
              </Button>
            ) : isPaid ? (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 capitalize">
                {plan.plan}
              </span>
            ) : (
              <Button size="sm" onClick={() => setPaywallOpen(true)} className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Upgrade
              </Button>
            )}
          </header>

          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {showWelcome ? (
              <div className="max-w-2xl mx-auto px-4 py-10 md:py-16">
                <div className="text-center space-y-3 mb-10">
                  <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center shadow-xl shadow-emerald-500/20 mb-2">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                    How can I help you today?
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base">
                    Ask anything about your health, medicines, prescriptions, or skin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => submit(s.prompt)}
                      className="group text-left p-4 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/80 hover:border-emerald-500/40 transition-all hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                          <s.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{s.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-10 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Dr. Fabuos AI provides general health information and is not a substitute for a licensed physician.
                    For emergencies, call your local emergency number immediately.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex gap-3 animate-fade-in", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {m.role === "assistant" && (
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                        <Stethoscope className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md"
                          : "bg-card/80 border border-border/60 backdrop-blur-sm"
                      )}
                    >
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {m.attachments.map((a, i) => (
                            <img
                              key={i}
                              src={a.dataUrl}
                              alt={`Image attached to message ${i + 1} for Dr. Fabuos AI to analyze`}
                              className="h-24 w-24 object-cover rounded-lg border border-border/40"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                          <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isStreaming && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-card/80 border border-border/60 rounded-2xl px-4 py-3 flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="max-w-3xl mx-auto p-3 md:p-4">
              {pending.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {pending.map((a, i) => (
                    <div key={i} className="relative">
                      <img src={a.dataUrl} alt={`Pending upload ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => setPending((p) => p.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-foreground text-background flex items-center justify-center"
                        aria-label={`Remove pending upload ${i + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2 p-2 rounded-2xl border border-border/60 bg-card/60 focus-within:border-emerald-500/60 transition shadow-sm">
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFile} />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-xl shrink-0"
                  onClick={() => fileRef.current?.click()}
                  aria-label="Attach image"
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Ask Dr. Fabuos about your health…"
                  aria-label="Message Dr. Fabuos AI"
                  rows={1}
                  className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 max-h-40"
                />
                {isStreaming ? (
                  <Button size="icon" variant="destructive" className="rounded-xl shrink-0" onClick={stop} aria-label="Stop generating response">
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="rounded-xl shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    onClick={() => submit()}
                    disabled={!input.trim() && pending.length === 0}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Dr. Fabuos AI can make mistakes. For emergencies, contact a real doctor or emergency services.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={paywallOpen} onOpenChange={setPaywallOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" /> Unlock unlimited Dr. Fabuos
            </DialogTitle>
            <DialogDescription>
              {!authed
                ? "Sign in to get 20 free messages a day, then upgrade for unlimited."
                : `You've used ${todayCount}/${FREE_LIMIT} free messages today. Pick a plan to keep chatting without limits.`}
            </DialogDescription>
          </DialogHeader>

          {!authed ? (
            <Button className="w-full" onClick={() => navigate('/auth')}>Sign in</Button>
          ) : (
            <div className="grid gap-3 mt-2">
              <button
                onClick={() => startCheckout('trial')}
                disabled={!!checkoutLoading}
                className="text-left rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 hover:border-emerald-500 transition relative"
              >
                <span className="absolute -top-2 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">Best value</span>
                <div className="flex items-baseline justify-between">
                  <div className="font-semibold">1 Month Trial</div>
                  <div className="text-2xl font-bold">₹99</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unlimited chats, image analysis, prescription scans for 30 days.</p>
                <p className="text-[11px] text-muted-foreground mt-2">After trial: ₹399/month</p>
              </button>

              <button
                onClick={() => startCheckout('pro')}
                disabled={!!checkoutLoading}
                className="text-left rounded-2xl border border-border p-4 hover:border-emerald-500/60 transition"
              >
                <div className="flex items-baseline justify-between">
                  <div className="font-semibold">Monthly</div>
                  <div className="text-xl font-bold">₹399<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Unlimited everything. Cancel anytime.</p>
              </button>

              {checkoutLoading && (
                <p className="text-xs text-center text-muted-foreground">Redirecting to secure payment…</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
