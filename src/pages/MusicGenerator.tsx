import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MusicGeneratorForm } from "@/components/MusicGeneratorForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const MusicGenerator = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6 slide-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 btn-3d"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold mb-2 gradient-text">AI Music Generator</h1>
          <p className="text-muted-foreground">
            Create amazing music with AI using Sonauto
          </p>
        </div>
        <MusicGeneratorForm />
      </div>
    </div>
  );
};

export default MusicGenerator;
