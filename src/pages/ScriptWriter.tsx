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
      
      // Increment usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_scripts' }
      });
      
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

  const handleTemplateSelect = (template: { topic: string; length: string; tone: string }) => {
    setVideoTopic(template.topic);
    setVideoLength(template.length);
    setTone(template.tone);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")} 
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <FileText className="h-10 w-10" />
            AI Script Writer
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate professional video scripts with AI
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
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
                    placeholder="What's your video about?"
                    value={videoTopic}
                    onChange={(e) => setVideoTopic(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video Length</Label>
                    <RadioGroup value={videoLength} onValueChange={setVideoLength}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1min" id="1min" />
                        <Label htmlFor="1min">1 minute</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="5min" id="5min" />
                        <Label htmlFor="5min">5 minutes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10min" id="10min" />
                        <Label htmlFor="10min">10 minutes</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger id="tone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="energetic">Energetic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audience">Target Audience (Optional)</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Beginners, Tech enthusiasts"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Script
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <ScriptTemplates onSelectTemplate={handleTemplateSelect} />
          </div>

          <div className="space-y-6">
            {generatedScript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Generated Script</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyScript}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={generatedScript.script_content}
                    readOnly
                    className="min-h-[400px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            )}

            <ScriptHistory key={refreshHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptWriter;
