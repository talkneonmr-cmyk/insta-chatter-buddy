import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  Sparkles, Youtube, Instagram, ArrowRight, Zap, Dna, PenLine,
  TrendingUp, Crown, Image as ImageIcon, FileText,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import DashboardSkeleton from "./DashboardSkeleton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ytConnected, setYtConnected] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const { plan, isLoading: subLoading } = useSubscription();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!session) { navigate("/auth"); return; }
      const [yt, ig] = await Promise.all([
        supabase.from("scheduled_videos").select("id", { head: true, count: "exact" }).eq("user_id", session.user.id).limit(1),
        supabase.from("instagram_accounts").select("id", { head: true, count: "exact" }).eq("user_id", session.user.id).limit(1),
      ]);
      if (!mounted) return;
      setYtConnected((yt.count ?? 0) > 0);
      setIgConnected((ig.count ?? 0) > 0);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [navigate]);

  if (loading || subLoading) return <DashboardSkeleton />;

  const greet = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  };
  const name = user?.email?.split("@")[0] ?? "creator";

  return (
    <div className="min-h-screen ucs-surface-0 ucs-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-10">

        {/* Hero */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-sm ucs-text-dim mb-2">{greet()},</div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight capitalize">{name}</h1>
          </div>
          {plan !== "pro" && (
            <button onClick={() => navigate("/pricing")} className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border ucs-hairline hover:bg-[hsl(240_8%_10%)] transition-colors text-sm font-medium">
              <Crown className="w-4 h-4 ucs-accent" /> Upgrade to Pro
            </button>
          )}
        </header>

        {/* Growth Score hero card */}
        <section
          onClick={() => navigate("/growth")}
          className="ucs-card ucs-card-interactive p-6 sm:p-8 relative overflow-hidden group"
        >
          <div className="ucs-grid-bg absolute inset-0 opacity-25 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <span className="ucs-chip mb-4"><Zap className="w-3 h-3" /> GROWTH ENGINE</span>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 leading-tight">
                Unlock your Channel DNA
              </h2>
              <p className="ucs-text-muted text-sm sm:text-base max-w-xl">
                Connect YouTube and the AI will analyze your channel, find what's working, and tell you exactly what to fix to grow faster.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] ucs-text-dim font-mono uppercase tracking-wider">Growth Score</div>
                <div className="text-4xl font-bold ucs-mono">—</div>
              </div>
              <ArrowRight className="w-6 h-6 ucs-text-muted group-hover:translate-x-1 group-hover:ucs-accent transition-all" />
            </div>
          </div>
        </section>

        {/* Connected accounts */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold ucs-text-muted uppercase tracking-wider">Connected accounts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AccountCard
              icon={Youtube}
              name="YouTube"
              connected={ytConnected}
              accent="text-red-500"
              onClick={() => navigate("/youtube-manager")}
            />
            <AccountCard
              icon={Instagram}
              name="Instagram"
              connected={igConnected}
              accent="text-pink-500"
              onClick={() => navigate("/youtube-manager")}
            />
          </div>
        </section>

        {/* What to do next */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold ucs-text-muted uppercase tracking-wider">What to do next</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ActionCard icon={Dna}        title="Scan my channel"  desc="Build your Channel DNA profile." onClick={() => navigate("/growth")} />
            <ActionCard icon={PenLine}    title="Optimize a title" desc="Get high-CTR title rewrites."   onClick={() => navigate("/seo-optimizer")} />
            <ActionCard icon={ImageIcon}  title="Make a thumbnail" desc="AI thumbnail generator."         onClick={() => navigate("/thumbnail-generator")} />
            <ActionCard icon={FileText}   title="Write a script"   desc="Hook → body → CTA in seconds."  onClick={() => navigate("/script-writer")} />
            <ActionCard icon={Sparkles}   title="Generate captions" desc="Captions tuned to your voice." onClick={() => navigate("/caption-generator")} />
            <ActionCard icon={TrendingUp} title="Find a trend"     desc="Trends matched to your niche."  onClick={() => navigate("/trend-analyzer")} />
          </div>
        </section>

      </div>
    </div>
  );
};

function AccountCard({
  icon: Icon, name, connected, accent, onClick,
}: { icon: any; name: string; connected: boolean; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ucs-card ucs-card-interactive p-5 text-left flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[hsl(240_8%_10%)] ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-[15px]">{name}</div>
          <div className="text-xs ucs-text-muted flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-600"}`} />
            {connected ? "Connected" : "Not connected"}
          </div>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 ucs-text-dim group-hover:translate-x-1 group-hover:ucs-text transition-all" />
    </button>
  );
}

function ActionCard({
  icon: Icon, title, desc, onClick,
}: { icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ucs-card ucs-card-interactive p-5 text-left group">
      <div className="w-9 h-9 rounded-lg ucs-accent-soft flex items-center justify-center mb-4">
        <Icon className="w-[18px] h-[18px] ucs-accent" />
      </div>
      <div className="text-[15px] font-semibold mb-1">{title}</div>
      <div className="text-[13px] ucs-text-muted leading-relaxed">{desc}</div>
    </button>
  );
}

export default Dashboard;
