import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Youtube, Music, Video, TrendingUp, Zap, Crown, ArrowRight, Activity, Image, FileText, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import UsageStats from "./UsageStats";

interface DashboardStats {
  totalUploads: number;
  totalCaptions: number;
  totalMusic: number;
  totalTrends: number;
  totalHashtags: number;
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
    totalTrends: 0,
    totalHashtags: 0,
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
          totalTrends: usage.ai_trends_count || 0,
          totalHashtags: usage.ai_hashtags_count || 0,
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in">
        
        {/* Hero Section with Greeting */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">
                  {getGreeting()}, {user?.email?.split("@")[0]}!
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all active:scale-[0.98]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Uploads</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalUploads}</p>
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

          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all active:scale-[0.98]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">AI Captions</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalCaptions}</p>
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

          <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 transition-all active:scale-[0.98]">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">AI Music</p>
                  <p className="text-2xl sm:text-3xl font-bold">{stats.totalMusic}</p>
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
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-1">Quick Actions</h2>
              <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">Jump into your creative workflow</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {/* YouTube Manager Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-red-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/youtube-manager")}>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
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
              <Card className="card-3d border-2 overflow-hidden group hover:border-primary/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/caption-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
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
              <Card className="card-3d border-2 overflow-hidden group hover:border-purple-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/music-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
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

              {/* Thumbnail Generator Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-blue-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/thumbnail-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                      <Image className="w-5 h-5 text-blue-500" />
                    </div>
                    <CardTitle className="text-lg">AI Thumbnail Generator</CardTitle>
                  </div>
                  <CardDescription>Create eye-catching thumbnails with AI</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Design stunning thumbnails</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Script Writer Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-green-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/script-writer")}>
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-all">
                      <FileText className="w-5 h-5 text-green-500" />
                    </div>
                    <CardTitle className="text-lg">AI Script Writer</CardTitle>
                  </div>
                  <CardDescription>Generate engaging video scripts</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Write perfect scripts</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Trend Analyzer Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-orange-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/trend-analyzer")}>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-all">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg">AI Trend Analyzer</CardTitle>
                  </div>
                  <CardDescription>Discover trending topics and content ideas</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.totalTrends} analyses generated</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Hashtag Generator Card */}
              <Card className="card-3d border-2 overflow-hidden group hover:border-indigo-500/30 cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/hashtag-generator")}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10 pb-2 sm:pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-all">
                      <Hash className="w-5 h-5 text-indigo-500" />
                    </div>
                    <CardTitle className="text-lg">AI Hashtag Generator</CardTitle>
                  </div>
                  <CardDescription>Generate optimized hashtags for your content</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{stats.totalHashtags} sets generated</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing/Upgrade Card */}
              {plan === "free" && (
                <Card className="card-3d border-2 border-yellow-500/30 overflow-hidden group hover:border-yellow-500/50 cursor-pointer bg-gradient-to-br from-yellow-500/5 to-orange-500/5 active:scale-[0.98] transition-transform" onClick={() => navigate("/pricing")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="relative z-10 pb-2 sm:pb-3">
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
