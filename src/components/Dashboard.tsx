import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, LogOut, Settings, Youtube, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import UsageStats from "./UsageStats";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { plan, isLoading: subscriptionLoading } = useSubscription();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/auth");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background animate-slide-in">
      {/* Top Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-lg sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-scale-in">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 animate-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl gradient-text">
                  Lovable Me Assistant
                </h1>
                <p className="text-xs text-muted-foreground">YouTube Manager</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/admin")} 
                  className="btn-3d gap-2"
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Admin Panel
                </Button>
              )}
              {plan === "pro" ? (
                <Button variant="outline" size="sm" className="btn-3d gap-2" disabled>
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Pro Plan
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/pricing")} className="btn-3d">
                  Upgrade to Pro
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="btn-3d">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="btn-3d">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-slide-in">
          <Card className="card-3d border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 animate-glow pointer-events-none"></div>
            <CardContent className="pt-6 relative z-10">
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-2 animate-float" />
                <h2 className="text-2xl font-bold gradient-text">YouTube Content Manager</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Manage your YouTube channel, schedule uploads, and create AI-powered content.
                </p>
                <div className="flex gap-2 justify-center pt-4">
                  <Button variant="gradient" onClick={() => navigate("/youtube-manager")} className="shadow-2xl">
                    <Youtube className="w-4 h-4 mr-2" />
                    Open YouTube Manager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Action Cards */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            <Card className="card-3d border-2 overflow-hidden group animate-scale-in" style={{animationDelay: '0.1s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300">
                    <Youtube className="w-5 h-5 text-red-500" />
                  </div>
                  <CardTitle className="group-hover:text-red-500 transition-colors duration-300">YouTube Manager</CardTitle>
                </div>
                <CardDescription>Upload and schedule your videos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-red-500/5 to-red-500/10 btn-3d" onClick={() => navigate("/youtube-manager")}>
                  <Youtube className="w-4 h-4 mr-2 text-red-500" />
                  Manage YouTube Channel
                </Button>
              </CardContent>
            </Card>

            <Card className="card-3d border-2 overflow-hidden group animate-scale-in" style={{animationDelay: '0.2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 animate-glow">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="gradient-text">AI Tools</CardTitle>
                </div>
                <CardDescription>AI-powered content creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10">
                <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-primary/5 to-secondary/5 btn-3d" onClick={() => navigate("/caption-generator")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Caption Generator
                </Button>
                <Button variant="outline" className="w-full justify-start btn-3d" onClick={() => navigate("/music-generator")}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Music Generator
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Usage Stats */}
          <div className="animate-scale-in" style={{animationDelay: '0.3s'}}>
            <UsageStats />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
