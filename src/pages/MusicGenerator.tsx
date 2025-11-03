import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Music, History, BarChart3 } from "lucide-react";
import MusicGeneratorForm from "@/components/MusicGeneratorForm";
import MusicHistory from "@/components/MusicHistory";
import MusicStats from "@/components/MusicStats";

export default function MusicGenerator() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const testerSession = localStorage.getItem('tester_session_token');
    const isTester = localStorage.getItem('is_tester') === 'true';

    if (testerSession && isTester) {
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !(localStorage.getItem('tester_session_token') && localStorage.getItem('is_tester') === 'true')) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/")} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Music Studio
            </h1>
            <p className="text-xl text-muted-foreground">Create, manage, and analyze your AI-generated music</p>
          </div>

          <Tabs defaultValue="generator" className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-14">
              <TabsTrigger value="generator" className="gap-2"><Music className="h-5 w-5" /> Generator</TabsTrigger>
              <TabsTrigger value="library" className="gap-2"><History className="h-5 w-5" /> Library</TabsTrigger>
              <TabsTrigger value="stats" className="gap-2"><BarChart3 className="h-5 w-5" /> Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="generator"><MusicGeneratorForm /></TabsContent>
            <TabsContent value="library"><MusicHistory /></TabsContent>
            <TabsContent value="stats"><MusicStats /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
