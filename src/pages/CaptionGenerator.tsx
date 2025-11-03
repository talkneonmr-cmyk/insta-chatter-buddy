import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CaptionGeneratorForm from "@/components/CaptionGeneratorForm";
import CaptionPreview from "@/components/CaptionPreview";
import CaptionHistory from "@/components/CaptionHistory";
import CaptionTemplates from "@/components/CaptionTemplates";
import TesterGuard from "@/components/TesterGuard";

export interface GeneratedCaption {
  caption: string;
  hookLine: string;
  callToAction: string;
  hashtags: string[];
  emojiSuggestions: string[];
  description: string;
  metadata?: {
    model: string;
    processingTime: number;
    contentType: string;
    brandVoice: string;
  };
}

const CaptionGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatedCaption, setGeneratedCaption] = useState<GeneratedCaption | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

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

  const handleCaptionGenerated = (caption: GeneratedCaption) => {
    setGeneratedCaption(caption);
    setRefreshHistory(prev => prev + 1);
  };

  const handleTemplateApply = (template: string) => {
    // This will be used to pre-fill the form with template
    console.log("Template applied:", template);
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
    <TesterGuard featureName="AI Caption Generator">
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Top Navigation */}
        <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
...
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Form & Templates */}
            <div className="lg:col-span-2 space-y-6">
              <CaptionGeneratorForm onCaptionGenerated={handleCaptionGenerated} />
              <CaptionTemplates onTemplateApply={handleTemplateApply} />
            </div>

            {/* Right Column - Preview & History */}
            <div className="space-y-6">
              {generatedCaption && (
                <CaptionPreview caption={generatedCaption} />
              )}
              <CaptionHistory key={refreshHistory} />
            </div>
          </div>
        </div>
      </div>
    </TesterGuard>
  );
};

export default CaptionGenerator;
