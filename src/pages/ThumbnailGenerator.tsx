import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Image, Sparkles, Loader2, Upload, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ThumbnailHistory from "@/components/ThumbnailHistory";
import ThumbnailPresets from "@/components/ThumbnailPresets";
import { removeBackground, loadImage } from "@/lib/backgroundRemoval";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ThumbnailGenerator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("gaming");
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  
  // Background removal states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = async () => {
    if (!uploadedImage) {
      toast({
        title: "No image uploaded",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    setRemovingBg(true);
    try {
      // Convert data URL to blob
      const response = await fetch(uploadedImage);
      const blob = await response.blob();
      
      // Load image
      const img = await loadImage(blob);
      
      // Remove background
      toast({
        title: "Processing...",
        description: "Removing background with AI. This may take a moment."
      });
      
      const resultBlob = await removeBackground(img);
      const resultUrl = URL.createObjectURL(resultBlob);
      
      setProcessedImage(resultUrl);
      
      toast({
        title: "Background removed!",
        description: "Your image is ready to download"
      });
    } catch (error: any) {
      console.error('Background removal error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to remove background. Make sure WebGPU is supported.",
        variant: "destructive"
      });
    } finally {
      setRemovingBg(false);
    }
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

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="generate">
              <Sparkles className="h-4 w-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="remove-bg">
              <Scissors className="h-4 w-4 mr-2" />
              Remove Background
            </TabsTrigger>
          </TabsList>

          {/* AI Generate Tab */}
          <TabsContent value="generate" className="mt-6">
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
          </TabsContent>

          {/* Remove Background Tab */}
          <TabsContent value="remove-bg" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Section */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    className="w-full h-32 border-2 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                    </div>
                  </Button>

                  {uploadedImage && (
                    <>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={uploadedImage} 
                          alt="Uploaded" 
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <Button
                        onClick={handleRemoveBackground}
                        disabled={removingBg}
                        className="w-full"
                        size="lg"
                      >
                        {removingBg ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing Background...
                          </>
                        ) : (
                          <>
                            <Scissors className="mr-2 h-4 w-4" />
                            Remove Background (Free AI)
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        🚀 100% Free • Runs in your browser • No API keys needed
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Result Section */}
              {processedImage && (
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle>Background Removed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-muted via-background to-muted">
                      <img 
                        src={processedImage} 
                        alt="Processed" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => window.open(processedImage, '_blank')}
                        className="flex-1"
                      >
                        <Image className="mr-2 h-4 w-4" />
                        View Full Size
                      </Button>
                      <Button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = processedImage;
                          link.download = 'no-background.png';
                          link.click();
                        }}
                        className="flex-1"
                      >
                        Download PNG
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* History Section */}
        <ThumbnailHistory key={refreshHistory} />
      </div>
    </div>
  );
};

export default ThumbnailGenerator;
