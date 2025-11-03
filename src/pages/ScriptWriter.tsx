import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, FileText, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ScriptHistory from "@/components/ScriptHistory";
import ScriptTemplates from "@/components/ScriptTemplates";
import TesterGuard from "@/components/TesterGuard";

const ScriptWriter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [videoTopic, setVideoTopic] = useState("");
  const [title, setTitle] = useState("");
  const [videoLength, setVideoLength] = useState("5min");
  const [tone, setTone] = useState("energetic");
  const [targetAudience, setTargetAudience] = useState("");
  const [generatedScript, setGeneratedScript] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleGenerate = async () => {
    if (!videoTopic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter your video topic",
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
          description: "Please sign in to generate scripts",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { 
          videoTopic: videoTopic.trim(),
          videoLength,
          tone,
          targetAudience: targetAudience.trim() || 'General audience',
          title: title || `${videoTopic.substring(0, 50)} Script`
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setGeneratedScript(data.script);
      setRefreshHistory(prev => prev + 1);
      
      toast({
        title: "Script generated!",
        description: "Your AI script has been created successfully"
      });

      // Clear form
      setVideoTopic("");
      setTitle("");
      setTargetAudience("");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript.script_content);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Script copied successfully"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setVideoTopic(template.topic);
    setVideoLength(template.length);
    setTone(template.tone);
  };

  return (
    <TesterGuard featureName="AI Script Writer">
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
...
      </div>
    </TesterGuard>
  );
};

export default ScriptWriter;
