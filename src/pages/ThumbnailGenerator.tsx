import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Image, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ThumbnailHistory from "@/components/ThumbnailHistory";
import ThumbnailPresets from "@/components/ThumbnailPresets";
import TesterGuard from "@/components/TesterGuard";

const ThumbnailGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("gaming");
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your thumbnail",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to generate thumbnails",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: { 
          prompt: prompt.trim(),
          style,
          title: title || 'Generated Thumbnail'
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedThumbnail(data.thumbnail.thumbnail_url);
      setRefreshHistory(prev => prev + 1);
      
      toast({
        title: "Thumbnail generated!",
        description: "Your AI thumbnail has been created successfully"
      });

      // Clear form
      setPrompt("");
      setTitle("");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate thumbnail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetPrompt: string, presetStyle: string) => {
    setPrompt(presetPrompt);
    setStyle(presetStyle);
  };

  return (
    <TesterGuard featureName="AI Thumbnail Generator">
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
...
      </div>
    </TesterGuard>
  );
};

export default ThumbnailGenerator;
