import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dna, Sparkles, Lightbulb, PenLine, Activity, TrendingUp, Users, Clock, Target, Gauge,
  ArrowRight, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Youtube, Instagram, Upload, Settings,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GrowthModule {
  id: string; title: string; description: string; icon: typeof Dna; action: string; route: string;
}

const ytModules: GrowthModule[] = [
  { id: "dna", title: "Channel DNA", description: "Deep scan of your channel: niche, audience, viral patterns, weaknesses, and content pillars.", icon: Dna, action: "Scan / re-scan", route: "/growth" },
  { id: "bulk", title: "AI Bulk Optimizer", description: "Apply AI title, description, and tag improvements to selected videos or your full channel.", icon: PenLine, action: "Optimize videos", route: "/youtube-manager?tab=bulk" },
  { id: "upload", title: "Smart Upload Studio", description: "AI metadata, Shorts/Reels workflows, platform selection, and best-time scheduling.", icon: Upload, action: "Upload smarter", route: "/youtube-upload-studio" },
  { id: "performance", title: "Auto-Pilot", description: "Detect underperforming videos and run automatic optimizations when you allow it.", icon: Activity, action: "Open auto-pilot", route: "/youtube-manager?tab=performance" },
  { id: "targeting", title: "Audience Targeting", description: "Country, timezone, and audience settings that guide AI metadata and upload timing.", icon: Target, action: "Edit targeting", route: "/settings" },
  { id: "trends", title: "Trend Analyzer", description: "Generate niche and platform-specific trend ideas for your next content batch.", icon: TrendingUp, action: "Analyze trends", route: "/trend-analyzer" },
];

const igModules: GrowthModule[] = [
  { id: "ig-upload", title: "Reels Publisher", description: "Publish or schedule vertical videos to Instagram with AI captions and status tracking.", icon: Instagram, action: "Create Reel upload", route: "/youtube-upload-studio" },
  { id: "ig-cross", title: "Cross-Post Shorts/Reels", description: "Send the same short-form video to YouTube, Instagram, or both from one queue.", icon: Sparkles, action: "Cross-post", route: "/youtube-upload-studio" },
  { id: "ig-targeting", title: "Audience Targeting", description: "Use country and timezone settings for caption hashtags and best-time scheduling.", icon: Settings, action: "Edit targeting", route: "/settings" },
];

export default function Growth() {
  const navigate = useNavigate();
  const [hasYouTube, setHasYouTube] = useState(false);
  const [hasInstagram, setHasInstagram] = useState(false);
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) { setLoading(false); return; }
      const [{ data: yt }, { data: ig }, { data: existing }] = await Promise.all([
        supabase.from("youtube_accounts").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("instagram_accounts").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("channel_dna_profiles").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      setHasYouTube(!!yt); setHasInstagram(!!ig); setDna(existing); setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const runScan = async () => {
    if (!hasYouTube) { navigate("/youtube-manager"); return; }
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-channel-dna");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDna(data.dna);
      toast.success("Channel DNA scan complete");
    } catch (error: any) {
      toast.error(error.message || "Scan failed");
    } finally { setScanning(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8 animate-fade-in">
        <section className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%),radial-gradient(circle_at_70%_50%,hsl(var(--secondary)/0.1),transparent_50%)]" />
          <div className="relative z-10 space-y-3 max-w-3xl">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Growth Engine · v1</Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text leading-tight">Channel DNA Growth Coach</h1>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl">
              Connect your platforms and Fabuos will scan your content, learn your patterns, and tell you exactly what to do next to grow. DNA auto-refreshes every 2 days.
            </p>
          </div>
        </section>

        <Tabs defaultValue="youtube" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="youtube" className="gap-2"><Youtube className="w-4 h-4" />YouTube</TabsTrigger>
            <TabsTrigger value="instagram" className="gap-2"><Instagram className="w-4 h-4" />Instagram</TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-6">
            {!dna ? (
              <Card className="card-3d border-2">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10"><Dna className="w-6 h-6 text-primary" /></div>
                    <div>
                      <CardTitle>{hasYouTube ? "Run your Channel DNA scan" : "Connect your YouTube channel"}</CardTitle>
                      <CardDescription className="mt-1">
                        {hasYouTube
                          ? "We'll analyze your latest videos to build your creator profile. Takes about a minute."
                          : "Link YouTube first, then the Growth Engine can analyze your channel."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={runScan} disabled={scanning || loading} className="bg-gradient-to-r from-primary to-secondary text-white">
                    {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {hasYouTube ? "Analyze my channel" : "Go to YouTube Manager"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DnaPanel dna={dna} onRescan={runScan} scanning={scanning} />
            )}

            <ModuleGrid title="YouTube Growth Systems" subtitle="Channel DNA is live. The rest unlock as the Growth Engine expands." modules={ytModules} />
          </TabsContent>

          <TabsContent value="instagram" className="space-y-6">
            <Card className="card-3d border-2">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10"><Instagram className="w-6 h-6 text-pink-500" /></div>
                  <div>
                    <CardTitle>Instagram Growth Engine</CardTitle>
                    <CardDescription className="mt-1">
                      {hasInstagram
                        ? "Your Instagram is connected. Account DNA scanning is rolling out — modules below unlock as they ship."
                        : "Connect Instagram to enable Reel DNA, hook optimization, trending audio matching, and best-time posting."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/youtube-manager")} variant="outline">
                  {hasInstagram ? "Manage Instagram" : "Connect Instagram"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <ModuleGrid title="Instagram Growth Systems" subtitle="Cross-platform AI brain — your YouTube DNA also informs Reel strategy once IG DNA ships." modules={igModules} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ModuleGrid({ title, subtitle, modules }: { title: string; subtitle: string; modules: GrowthModule[] }) {
  const navigate = useNavigate();
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {modules.map((m) => (
          <Card key={m.id} className="card-3d border-2 group hover:border-primary/30 transition-all">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                  <m.icon className="w-5 h-5 text-primary" />
                </div>
                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/10">Live</Badge>
              </div>
              <h3 className="font-semibold mb-1.5">{m.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => navigate(m.route)}>
                {m.action}
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function DnaPanel({ dna, onRescan, scanning }: { dna: any; onRescan: () => void; scanning: boolean }) {
  const score = dna.growth_score ?? 0;
  return (
    <section className="space-y-4">
      <Card className="card-3d border-2">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Channel DNA</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold">{dna.channel_title}</h2>
              <p className="text-muted-foreground text-sm">
                {dna.niche}{dna.sub_niche ? ` · ${dna.sub_niche}` : ""} · {dna.videos_analyzed} videos analyzed
              </p>
              <p className="text-xs text-muted-foreground">Last updated {new Date(dna.updated_at).toLocaleString()}</p>
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
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-4 h-4 text-accent" />Primary Bottleneck</CardTitle></CardHeader>
          <CardContent className="pt-0 text-sm leading-relaxed">{dna.bottleneck || "—"}</CardContent>
        </Card>
        <Card className="card-3d border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="w-4 h-4 text-primary" />Next Action</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Viral Patterns</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dna.viral_patterns.map((p: any, i: number) => (
              <div key={i} className="border-l-4 border-primary pl-3">
                <p className="text-sm font-medium">{p.pattern}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.evidence}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {Array.isArray(dna.recommendations) && dna.recommendations.length > 0 && (
        <Card className="card-3d border-2">
          <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dna.recommendations.map((r: any, i: number) => (
              <div key={i} className="flex gap-3 items-start">
                <Badge variant="outline" className="capitalize shrink-0">{r.priority || "medium"}</Badge>
                <div>
                  <p className="text-sm font-medium">{r.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.why}</p>
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
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
              <span className="text-primary">•</span>
              <span>{typeof item === "string" ? item : JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
