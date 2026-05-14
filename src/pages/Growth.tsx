import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dna, Sparkles, Lightbulb, PenLine, Activity, TrendingUp,
  Users, Clock, Target, Gauge, Lock, ArrowRight, Loader2, RefreshCw, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Module = {
  id: string;
  title: string;
  description: string;
  icon: any;
  to?: string;
  status: "ready" | "soon";
};

const modules: Module[] = [
  { id: "dna",        title: "Channel DNA",          description: "Deep scan of your channel — niche, audience, viral patterns, weaknesses, content pillars.", icon: Dna,         status: "ready" },
  { id: "viral",      title: "Viral Intelligence",   description: "Reverse-engineer your top videos. What exactly made them work — hook, pacing, emotion.",    icon: Sparkles,    status: "soon" },
  { id: "ideas",      title: "Content Strategist",   description: "Personalized video, Reel and Short ideas — not generic AI fluff.",                          icon: Lightbulb,   status: "soon" },
  { id: "optimizer",  title: "Title & Hook Optimizer", description: "Paste a title or hook, get high-CTR rewrites scored against your DNA.",                   icon: PenLine,     status: "soon" },
  { id: "retention",  title: "Retention Improver",   description: "Find drop-off points and exactly what to fix — slow intros, weak transitions, lost moments.", icon: Activity,    status: "soon" },
  { id: "trends",     title: "Smart Trend Matching", description: "Trends filtered by YOUR niche — and how to use each one.",                                   icon: TrendingUp,  status: "soon" },
  { id: "competitor", title: "Competitor Intel",     description: "Track competitors, find opportunities they're missing.",                                    icon: Users,       status: "soon" },
  { id: "upload",     title: "Upload Optimizer",     description: "Best posting times, days, frequency — based on your audience activity.",                    icon: Clock,       status: "soon" },
  { id: "gap",        title: "Content Gap Detector", description: "Important content you should be making — but aren't.",                                      icon: Target,      status: "soon" },
  { id: "score",      title: "Growth Score",         description: "One number, one bottleneck, one clear next action.",                                        icon: Gauge,       status: "soon" },
];

export default function Growth() {
  const navigate = useNavigate();
  const [hasChannel, setHasChannel] = useState(false);
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const [{ data: acc }, { data: existing }] = await Promise.all([
        supabase.from("youtube_accounts").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("channel_dna_profiles").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setHasChannel(!!acc);
      setDna(existing);
      setLoading(false);
    })();
  }, []);

  const runScan = async () => {
    if (!hasChannel) { navigate("/youtube-manager"); return; }
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-channel-dna");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDna(data.dna);
      toast.success("Channel DNA scan complete");
    } catch (e: any) {
      toast.error(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen ucs-surface-0 ucs-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-10">
          <span className="ucs-chip mb-4">GROWTH ENGINE · v1</span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-3">
            A genius creator coach<br/>
            <span className="ucs-text-muted">that actually understands your channel.</span>
          </h1>
          <p className="ucs-text-muted text-base sm:text-lg max-w-2xl">
            Connect your YouTube channel and the AI will scan your content, learn your DNA, and tell you exactly what to do next to grow.
          </p>
        </div>

        {/* Step / DNA card */}
        {!dna ? (
          <div className="ucs-card p-6 sm:p-8 mb-10 relative overflow-hidden">
            <div className="ucs-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm ucs-accent font-semibold mb-1">Step 1</div>
                <div className="text-xl font-bold mb-1">
                  {hasChannel ? "Run your Channel DNA scan" : "Connect your YouTube channel"}
                </div>
                <div className="text-sm ucs-text-muted">
                  {hasChannel
                    ? "We'll analyze your last 50 videos to build your Channel DNA. ~60 seconds."
                    : "Link YouTube first, then we'll scan your last 50 videos."}
                </div>
              </div>
              <button
                onClick={runScan}
                disabled={scanning || loading}
                className="ucs-accent-bg text-white font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
              >
                {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> :
                 hasChannel ? <>Run DNA scan <ArrowRight className="w-4 h-4" /></> :
                 <>Connect channel <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>
        ) : (
          <DnaPanel dna={dna} onRescan={runScan} scanning={scanning} />
        )}

        {/* Modules grid */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">10 systems. One brain.</h2>
          <span className="text-xs ucs-text-dim ucs-mono">{dna ? "DNA ACTIVE" : "UNLOCKS AFTER DNA SCAN"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => m.to && navigate(m.to)}
              disabled={m.status === "soon"}
              className="ucs-card p-5 text-left disabled:cursor-not-allowed group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg ucs-accent-soft flex items-center justify-center">
                  <m.icon className="w-[18px] h-[18px] ucs-accent" />
                </div>
                {m.status === "soon" && <Lock className="w-3.5 h-3.5 ucs-text-dim" />}
              </div>
              <div className="text-[15px] font-semibold mb-1.5 leading-snug">{m.title}</div>
              <div className="text-[13px] ucs-text-muted leading-relaxed">{m.description}</div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center text-xs ucs-text-dim">
          v1 focuses on real, measurable creator growth. No dashboards full of vanity metrics.
        </div>
      </div>
    </div>
  );
}

function DnaPanel({ dna, onRescan, scanning }: { dna: any; onRescan: () => void; scanning: boolean }) {
  const score = dna.growth_score ?? 0;
  return (
    <div className="space-y-3 mb-10">
      {/* Hero score row */}
      <div className="ucs-card p-6 sm:p-8 relative overflow-hidden">
        <div className="ucs-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div>
            <div className="text-xs ucs-text-dim ucs-mono mb-2">CHANNEL DNA</div>
            <div className="text-2xl font-bold mb-1">{dna.channel_title}</div>
            <div className="text-sm ucs-text-muted">
              {dna.niche}{dna.sub_niche ? ` · ${dna.sub_niche}` : ""} · {dna.videos_analyzed} videos analyzed
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold ucs-accent tabular-nums">{score}</div>
            <div>
              <div className="text-xs ucs-text-dim ucs-mono">GROWTH SCORE</div>
              <div className="text-sm ucs-text-muted">out of 100</div>
            </div>
          </div>
          <div className="flex lg:justify-end">
            <button
              onClick={onRescan}
              disabled={scanning}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-scan
            </button>
          </div>
        </div>
      </div>

      {/* Bottleneck + next action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="ucs-card p-5">
          <div className="flex items-center gap-2 text-xs ucs-text-dim ucs-mono mb-2"><AlertTriangle className="w-3.5 h-3.5" /> BOTTLENECK</div>
          <div className="text-[15px] leading-relaxed">{dna.bottleneck || "—"}</div>
        </div>
        <div className="ucs-card p-5">
          <div className="flex items-center gap-2 text-xs ucs-accent ucs-mono mb-2"><CheckCircle2 className="w-3.5 h-3.5" /> NEXT ACTION</div>
          <div className="text-[15px] leading-relaxed">{dna.next_action || "—"}</div>
        </div>
      </div>

      {/* Pillars / Strengths / Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ListCard title="CONTENT PILLARS" items={dna.content_pillars} />
        <ListCard title="STRENGTHS" items={dna.strengths} />
        <ListCard title="WEAKNESSES" items={dna.weaknesses} />
      </div>

      {/* Viral patterns */}
      {Array.isArray(dna.viral_patterns) && dna.viral_patterns.length > 0 && (
        <div className="ucs-card p-5">
          <div className="text-xs ucs-text-dim ucs-mono mb-3">VIRAL PATTERNS</div>
          <div className="space-y-3">
            {dna.viral_patterns.map((p: any, i: number) => (
              <div key={i} className="border-l-2 ucs-accent-border pl-3">
                <div className="text-[14px] font-medium">{p.pattern}</div>
                <div className="text-xs ucs-text-muted mt-0.5">{p.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {Array.isArray(dna.recommendations) && dna.recommendations.length > 0 && (
        <div className="ucs-card p-5">
          <div className="text-xs ucs-text-dim ucs-mono mb-3">RECOMMENDATIONS</div>
          <div className="space-y-2">
            {dna.recommendations.map((r: any, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <span className={`text-[10px] ucs-mono px-1.5 py-0.5 rounded ${
                  r.priority === "high" ? "bg-red-500/15 text-red-400" :
                  r.priority === "medium" ? "bg-yellow-500/15 text-yellow-400" :
                  "bg-white/5 ucs-text-muted"
                }`}>{(r.priority || "med").toUpperCase()}</span>
                <div>
                  <div className="text-[14px]">{r.action}</div>
                  <div className="text-xs ucs-text-muted mt-0.5">{r.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items?: any[] }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="ucs-card p-5">
      <div className="text-xs ucs-text-dim ucs-mono mb-3">{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-[13px] ucs-text leading-relaxed flex gap-2">
            <span className="ucs-accent">·</span>
            <span>{typeof it === "string" ? it : JSON.stringify(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
