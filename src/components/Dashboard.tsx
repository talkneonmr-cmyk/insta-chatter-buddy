import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, LogOut, Settings, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
                <p className="text-xs text-muted-foreground">YouTube Manager</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>
                Upgrade
              </Button>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-2" />
                <h2 className="text-2xl font-bold">YouTube Content Manager</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Manage your YouTube channel, schedule uploads, and create AI-powered content.
                </p>
                <div className="flex gap-2 justify-center pt-4">
                  <Button className="bg-gradient-to-r from-red-500 to-red-600" onClick={() => navigate("/youtube-manager")}>
                    <Youtube className="w-4 h-4 mr-2" />
                    Open YouTube Manager
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/channel-creator")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Channel Creator
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <CardTitle>YouTube Manager</CardTitle>
              </div>
              <CardDescription>Upload and schedule your videos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-red-500/5 to-red-500/10" onClick={() => navigate("/youtube-manager")}>
                <Youtube className="w-4 h-4 mr-2 text-red-500" />
                Manage YouTube Channel
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle>AI Tools</CardTitle>
              </div>
              <CardDescription>AI-powered content creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-gradient-to-r from-primary/5 to-secondary/5" onClick={() => navigate("/caption-generator")}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Caption Generator
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/channel-creator")}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Channel Creator
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/music-generator")}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Music Generator
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
