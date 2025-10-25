import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Instagram, LogOut, Settings, MessageCircle, RefreshCw, Zap, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AutomationTester from "./AutomationTester";
import { useAutomationStats } from "@/hooks/useAutomationStats";
import { StatCard } from "./StatCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading, refetch } = useAutomationStats();

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

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Refreshed",
      description: "Stats updated successfully.",
    });
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Top Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Lovable Me Assistant
                </h1>
                <p className="text-xs text-muted-foreground">Instagram Automation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {stats.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={statsLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${statsLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon={Zap}
              label="Active Rules"
              value={stats.activeRules}
              loading={statsLoading}
            />
            <StatCard
              icon={MessageCircle}
              label="Comments Processed"
              value={stats.commentsProcessed}
              loading={statsLoading}
            />
            <StatCard
              icon={Activity}
              label="DMs Sent"
              value={stats.dmsSent}
              loading={statsLoading}
            />
          </div>

          {/* Quick Actions */}
          {!statsLoading && stats.activeRules === 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Sparkles className="w-12 h-12 text-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Get Started</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Connect your Instagram account and create your first automation rule to start engaging with your audience automatically.
                  </p>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button className="bg-gradient-to-r from-primary via-secondary to-accent" onClick={() => navigate("/rules")}>
                      Create First Rule
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/posts")}>
                      Add Posts
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Connection Status Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-primary" />
                <CardTitle>Instagram Connection</CardTitle>
              </div>
              <CardDescription>Connect your Instagram account to start automation</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90">
                Connect Instagram Account
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                You'll need an Instagram Business or Creator account and a Meta Developer App
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-secondary" />
                <CardTitle>Quick Actions</CardTitle>
              </div>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/rules")}>
                <Sparkles className="w-4 h-4 mr-2" />
                Manage Rules
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/posts")}>
                <Instagram className="w-4 h-4 mr-2" />
                Manage Posts
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Activity className="w-4 h-4 mr-2" />
                View Activity Logs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Testing Component */}
        <div className="mb-8">
          <AutomationTester />
        </div>

        {/* Instructions */}
        <Card className="border-2 border-accent/20">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>How to set up Instagram automation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Create a Meta Developer App</h4>
              <p className="text-sm text-muted-foreground">
                Visit{" "}
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta for Developers
                </a>{" "}
                and create a new app with Instagram Basic Display or Instagram Graph API permissions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Configure Instagram Permissions</h4>
              <p className="text-sm text-muted-foreground">
                Request these permissions: instagram_basic, instagram_manage_comments, instagram_manage_messages
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. Set Up Webhooks</h4>
              <p className="text-sm text-muted-foreground">
                Configure webhooks to receive comment notifications in real-time
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">4. Test Your Automation</h4>
              <p className="text-sm text-muted-foreground">
                Use the testing tool above to verify your rules work correctly before going live
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
