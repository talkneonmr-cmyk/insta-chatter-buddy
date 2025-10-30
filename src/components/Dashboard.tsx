import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Youtube, Music, Video, TrendingUp, Zap, Crown, ArrowRight, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import UsageStats from "./UsageStats";

interface DashboardStats {
  totalUploads: number;
  totalCaptions: number;
  totalMusic: number;
  channelsConnected: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUploads: 0,
    totalCaptions: 0,
    totalMusic: 0,
    channelsConnected: 0,
  });
  const { plan, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      } else {
        fetchDashboardStats(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchDashboardStats(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchDashboardStats = async (userId: string) => {
    try {
      const { data: usage } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (usage) {
        setStats({
          totalUploads: usage.video_uploads_count || 0,
          totalCaptions: usage.ai_captions_count || 0,
          totalMusic: usage.ai_music_count || 0,
          channelsConnected: usage.youtube_channels_count || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
        
        {/* Hero Section with Greeting */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-8 md:p-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.1),transparent_50%),radial-gradient(circle_at_70%_50%,hsl(var(--secondary)/0.1),transparent_50%)]"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  {plan === "pro" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                      <Crown className="w-3 h-3" />
                      Pro
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                  {getGreeting()}, {user?.email?.split("@")[0]}!
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Ready to create amazing content? Your AI-powered studio is ready to help you shine.
                </p>
              </div>
              {plan === "free" && (
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary via-secondary to-accent text-white border-0 hover:opacity-90 transition-opacity shadow-lg"
                  onClick={() => navigate("/pricing")}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Uploads</p>
                  <p className="text-3xl font-bold">{stats.totalUploads}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span>Videos uploaded</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 group-hover:from-red-500/20 group-hover:to-red-600/20 transition-all">
                  <Video className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">AI Captions</p>
                  <p className="text-3xl font-bold">{stats.totalCaptions}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Activity className="w-3 h-3 text-primary" />
                    <span>Generated</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">AI Music</p>
                  <p className="text-3xl font-bold">{stats.totalMusic}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-500" />
                    <span>Tracks created</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-all">
                  <Music className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Channels</p>
                  <p className="text-3xl font-bold">{stats.channelsConnected}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-500" />
                    <span>Connected</span>
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 group-hover:from-red-500/20 group-hover:to-orange-500/20 transition-all">
                  <Youtube className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Quick Actions</h2>
              <p className="text-muted-foreground text-sm mb-4">Jump into your creative workflow</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* YouTube Manager Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-red-500/30 cursor-pointer" onClick={() => navigate("/youtube-manager")}>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-all">
                      <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <CardTitle className="text-lg">YouTube Manager</CardTitle>
                  </div>
                  <CardDescription>Upload, schedule, and manage your video content</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.totalUploads} videos uploaded</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Caption Generator Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 cursor-pointer" onClick={() => navigate("/caption-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">AI Caption Generator</CardTitle>
                  </div>
                  <CardDescription>Generate engaging captions with AI assistance</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.totalCaptions} captions created</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Music Generator Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-purple-500/30 cursor-pointer" onClick={() => navigate("/music-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-all">
                      <Music className="w-5 h-5 text-purple-500" />
                    </div>
                    <CardTitle className="text-lg">AI Music Generator</CardTitle>
                  </div>
                  <CardDescription>Create custom music tracks for your content</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.totalMusic} tracks generated</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing/Upgrade Card */}
              {plan === "free" && (
                <Card className="card-3d border-2 border-yellow-500/30 overflow-hidden group hover:border-yellow-500/50 cursor-pointer bg-gradient-to-br from-yellow-500/5 to-orange-500/5" onClick={() => navigate("/pricing")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative z-10 pb-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2.5 rounded-xl bg-yellow-500/10 group-hover:bg-yellow-500/20 transition-all">
                        <Crown className="w-5 h-5 text-yellow-500" />
                      </div>
                      <CardTitle className="text-lg text-yellow-600 dark:text-yellow-400">Upgrade to Pro</CardTitle>
                    </div>
                    <CardDescription>Unlock unlimited features and boost productivity</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">View plans</span>
                      <ArrowRight className="w-4 h-4 text-yellow-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Usage Stats Sidebar */}
          <div className="lg:col-span-1">
            <UsageStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
