import { useNavigate } from "react-router-dom";
import {
  Dna, Sparkles, Lightbulb, PenLine, Activity, TrendingUp,
  Users, Clock, Target, Gauge, Lock, ArrowRight,
} from "lucide-react";

type Module = {
  id: string;
  title: string;
  description: string;
  icon: any;
  to?: string;
  status: "ready" | "soon";
};

const modules: Module[] = [
  { id: "dna",        title: "Channel DNA",          description: "Deep scan of your channel — niche, audience, viral patterns, weaknesses, content pillars.", icon: Dna,         status: "soon" },
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

        {/* Connect CTA */}
        <div className="ucs-card p-6 sm:p-8 mb-10 relative overflow-hidden">
          <div className="ucs-grid-bg absolute inset-0 opacity-30 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm ucs-accent font-semibold mb-1">Step 1</div>
              <div className="text-xl font-bold mb-1">Connect your YouTube channel</div>
              <div className="text-sm ucs-text-muted">We'll analyze your last 50 videos to build your Channel DNA. Takes ~60 seconds.</div>
            </div>
            <button
              onClick={() => navigate("/youtube-manager")}
              className="ucs-accent-bg text-white font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-2 shrink-0"
            >
              Connect channel <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modules grid */}
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">10 systems. One brain.</h2>
          <span className="text-xs ucs-text-dim ucs-mono">UNLOCKS AFTER DNA SCAN</span>
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
                {m.status === "soon" && (
                  <Lock className="w-3.5 h-3.5 ucs-text-dim" />
                )}
              </div>
              <div className="text-[15px] font-semibold mb-1.5 leading-snug">{m.title}</div>
              <div className="text-[13px] ucs-text-muted leading-relaxed">{m.description}</div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-xs ucs-text-dim">
          v1 focuses on real, measurable creator growth. No dashboards full of vanity metrics.
        </div>
      </div>
    </div>
  );
}
