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
            <div className="p-2 bg-purple-500/10 rounded-lg float-animation">
              <Image className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">AI Thumbnail Generator</h1>
              <p className="text-muted-foreground">Create eye-catching YouTube thumbnails with AI</p>
            </div>
          </div>
        </div>

        {/* Presets Section */}
        <ThumbnailPresets onSelectPreset={handlePresetSelect} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Generate Thumbnail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Thumbnail Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="My Awesome Video Thumbnail"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="vlog">Vlog</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Describe Your Thumbnail</Label>
                <Textarea
                  id="prompt"
                  placeholder="A dramatic gaming moment with bright colors and bold text saying 'EPIC WIN'..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Be specific about colors, text, emotions, and visual elements
                </p>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
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
                    Generate Thumbnail
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          {generatedThumbnail && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Generated Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={generatedThumbnail} 
                    alt="Generated thumbnail" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(generatedThumbnail, '_blank')}
                    className="flex-1"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    View Full Size
                  </Button>
                  <Button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedThumbnail;
                      link.download = 'thumbnail.png';
                      link.click();
                    }}
                    className="flex-1"
                  >
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History Section */}
        <ThumbnailHistory key={refreshHistory} />
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
