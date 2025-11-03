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
            <Image className="h-10 w-10" />
            AI Thumbnail Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create eye-catching YouTube thumbnails with AI
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Thumbnail Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Video"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Description *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your thumbnail... e.g., 'Gaming setup with RGB lights and monitors'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
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
                      <SelectItem value="tech">Tech Review</SelectItem>
                      <SelectItem value="vlog">Vlog</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="cooking">Cooking</SelectItem>
                      <SelectItem value="dramatic">Dramatic</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Generate Thumbnail
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <ThumbnailPresets onSelectPreset={handlePresetSelect} />
          </div>

          <div className="space-y-6">
            {generatedThumbnail && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <img 
                    src={generatedThumbnail} 
                    alt="Generated thumbnail" 
                    className="w-full rounded-lg"
                  />
                  <Button
                    className="w-full mt-4"
                    onClick={() => window.open(generatedThumbnail, '_blank')}
                  >
                    Download Thumbnail
                  </Button>
                </CardContent>
              </Card>
            )}

            <ThumbnailHistory key={refreshHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
