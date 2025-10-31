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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 slide-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="btn-3d"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg float-animation">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">AI Script Writer</h1>
              <p className="text-muted-foreground">Generate engaging video scripts with AI</p>
            </div>
          </div>
        </div>

        {/* Templates Section */}
        <ScriptTemplates onSelectTemplate={handleTemplateSelect} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Generate Script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Script Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="My Video Script"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Video Topic *</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., How to start a YouTube channel in 2025"
                  value={videoTopic}
                  onChange={(e) => setVideoTopic(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Video Length</Label>
                  <Select value={videoLength} onValueChange={setVideoLength}>
                    <SelectTrigger id="length">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30sec">30 seconds</SelectItem>
                      <SelectItem value="1min">1 minute</SelectItem>
                      <SelectItem value="3min">3 minutes</SelectItem>
                      <SelectItem value="5min">5 minutes</SelectItem>
                      <SelectItem value="10min">10+ minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Beginners"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <RadioGroup value={tone} onValueChange={setTone} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="energetic" id="energetic" />
                    <Label htmlFor="energetic" className="cursor-pointer">Energetic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="calm" id="calm" />
                    <Label htmlFor="calm" className="cursor-pointer">Calm</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professional" id="professional" />
                    <Label htmlFor="professional" className="cursor-pointer">Professional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="funny" id="funny" />
                    <Label htmlFor="funny" className="cursor-pointer">Funny</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="educational" id="educational" />
                    <Label htmlFor="educational" className="cursor-pointer">Educational</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={loading || !videoTopic.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {generatedScript && (
            <Card className="h-fit max-h-[800px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Script</CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyScript}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap">{generatedScript.script_content}</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Section */}
        <ScriptHistory key={refreshHistory} />
      </div>
    </div>
  );
};

export default ScriptWriter;
