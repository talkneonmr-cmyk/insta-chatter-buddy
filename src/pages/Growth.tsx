import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dna,
  Sparkles,
  Lightbulb,
  PenLine,
  Activity,
  TrendingUp,
  Users,
  Clock,
  Target,
  Gauge,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GrowthModule {
  id: string;
  title: string;
  description: string;
  icon: typeof Dna;
  to?: string;
  status: "ready" | "soon";
}

const modules: GrowthModule[] = [
  { id: "dna", title: "Channel DNA", description: "Deep scan of your channel: niche, audience, viral patterns, weaknesses, and content pillars.", icon: Dna, status: "ready" },
  { id: "viral", title: "Viral Intelligence", description: "Reverse-engineer your top videos: hook, pacing, emotion, and what made them work.", icon: Sparkles, status: "soon" },
  { id: "ideas", title: "Content Strategist", description: "Personalized video, Reel, and Short ideas built around your real channel data.", icon: Lightbulb, status: "soon" },
  { id: "optimizer", title: "Title & Hook Optimizer", description: "Paste a title or hook and get stronger rewrites scored against your DNA.", icon: PenLine, status: "soon" },
  { id: "retention", title: "Retention Improver", description: "Find weak intros, slow transitions, and moments that lose viewers.", icon: Activity, status: "soon" },
  { id: "trends", title: "Smart Trend Matching", description: "Trends filtered by your niche with clear ways to use each one.", icon: TrendingUp, status: "soon" },
  { id: "competitor", title: "Competitor Intel", description: "Track competitors and find opportunities they are missing.", icon: Users, status: "soon" },
  { id: "upload", title: "Upload Optimizer", description: "Best posting times, days, and frequency based on audience activity.", icon: Clock, status: "soon" },
  { id: "gap", title: "Content Gap Detector", description: "Important content your channel should be making but is not yet covering.", icon: Target, status: "soon" },
  { id: "score", title: "Growth Score", description: "One number, one bottleneck, and one clear next action.", icon: Gauge, status: "soon" },
];

export default function Growth() {
  const navigate = useNavigate();
  const [hasChannel, setHasChannel] = useState(false);
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      if (!user) {
        setLoading(false);
        return;
      }

      const [{ data: account }, { data: existing }] = await Promise.all([
        supabase.from("youtube_accounts").select("id").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("channel_dna_profiles")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (!mounted) return;
      setHasChannel(!!account);
      setDna(existing);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const runScan = async () => {
    if (!hasChannel) {
      navigate("/youtube-manager");
      return;
    }

    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-channel-dna");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDna(data.dna);
      toast.success("Channel DNA scan complete");
    } catch (error: any) {
      toast.error(error.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8 animate-fade-in">
        <section className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%),radial-gradient(circle_at_70%_50%,hsl(var(--secondary)/0.1),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Growth Engine · v1
              </Badge>
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text leading-tight">
                  Channel DNA Growth Coach
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg mt-3 max-w-2xl">
                  Connect your YouTube channel and Fabuos will scan your content, learn your patterns, and tell you what to do next to grow.
                </p>
              </div>
            </div>
            <Button
              size="lg"
              onClick={runScan}
              disabled={scanning || loading}
              className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0 hover:opacity-90 transition-opacity shadow-lg w-full sm:w-auto"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : hasChannel ? (
                <>
                  Run DNA Scan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Connect YouTube
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </section>

        {!dna ? (
          <Card className="card-3d border-2 overflow-hidden">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <Dna className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{hasChannel ? "Run your Channel DNA scan" : "Connect your YouTube channel"}</CardTitle>
                  <CardDescription className="mt-1">
                    {hasChannel
                      ? "We'll analyze your latest videos to build your creator profile. This usually takes about a minute."
                      : "Link YouTube first, then the Growth Engine can analyze your channel."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={runScan} disabled={scanning || loading} className="bg-gradient-to-r from-primary to-secondary text-white">
                {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {hasChannel ? "Analyze my channel" : "Go to YouTube Manager"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DnaPanel dna={dna} onRescan={runScan} scanning={scanning} />
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Growth Systems</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">The first system is live. The rest unlock as the Growth Engine expands.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {modules.map((module) => (
              <Card
                key={module.id}
                className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                      <module.icon className="w-5 h-5 text-primary" />
                    </div>
                    {module.status === "soon" ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Lock className="w-3 h-3" />
                        Soon
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/10">Live</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1.5">{module.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DnaPanel({ dna, onRescan, scanning }: { dna: any; onRescan: () => void; scanning: boolean }) {
  const score = dna.growth_score ?? 0;

  return (
    <section className="space-y-4">
      <Card className="card-3d border-2 overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Channel DNA</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold">{dna.channel_title}</h2>
              <p className="text-muted-foreground text-sm">
                {dna.niche}{dna.sub_niche ? ` · ${dna.sub_niche}` : ""} · {dna.videos_analyzed} videos analyzed
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold gradient-text tabular-nums">{score}</div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Growth Score</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>
            <div className="flex lg:justify-end">
              <Button variant="outline" onClick={onRescan} disabled={scanning}>
                {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Re-scan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-3d border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-accent" />
              Primary Bottleneck
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-relaxed">{dna.bottleneck || "—"}</CardContent>
        </Card>
        <Card className="card-3d border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Next Action
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm leading-relaxed">{dna.next_action || "—"}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ListCard title="Content Pillars" items={dna.content_pillars} />
        <ListCard title="Strengths" items={dna.strengths} />
        <ListCard title="Weaknesses" items={dna.weaknesses} />
      </div>

      {Array.isArray(dna.viral_patterns) && dna.viral_patterns.length > 0 && (
        <Card className="card-3d border-2">
          <CardHeader>
            <CardTitle>Viral Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dna.viral_patterns.map((pattern: any, index: number) => (
              <div key={index} className="border-l-4 border-primary pl-3">
                <p className="text-sm font-medium">{pattern.pattern}</p>
                <p className="text-xs text-muted-foreground mt-1">{pattern.evidence}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(dna.recommendations) && dna.recommendations.length > 0 && (
        <Card className="card-3d border-2">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dna.recommendations.map((recommendation: any, index: number) => (
              <div key={index} className="flex gap-3 items-start">
                <Badge variant="outline" className="capitalize shrink-0">{recommendation.priority || "medium"}</Badge>
                <div>
                  <p className="text-sm font-medium">{recommendation.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{recommendation.why}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function ListCard({ title, items }: { title: string; items?: any[] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Card className="card-3d border-2">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary">•</span>
              <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
