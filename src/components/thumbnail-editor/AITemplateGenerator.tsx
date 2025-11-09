import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AITemplateGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export const AITemplateGenerator = ({ onImageGenerated }: AITemplateGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateWithAI = async (promptText: string) => {
    setLoading(true);
    setGeneratedImage(null);
    
    try {
      // Check usage limit first
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_thumbnails' }
      });

      if (limitError) {
        toast.error("Error checking usage limit");
        return;
      }
      
      if (!limitCheck.canUse) {
        toast.error(limitCheck.message || "Daily limit reached");
        return;
      }

      const enhancedPrompt = `${promptText}

CRITICAL REQUIREMENTS:
- Ultra high resolution, 1280x720 pixels perfect for YouTube thumbnail
- Professional studio lighting with dramatic shadows
- High contrast, vibrant saturated colors
- Sharp focus on main subject
- Cinematic composition
- Text-ready space for overlay
- Professional thumbnail quality
- Eye-catching and clickable design`;

      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          prompt: enhancedPrompt,
          style: "professional",
          title: "AI Generated Pro Thumbnail",
        },
      });

      if (error) {
        console.warn("Supabase function warning:", error);
        toast.error(error.message || "Hey there! Your daily limit is reached. Please check back tomorrow!");
        return;
      }
      
      if (data?.error) {
        console.warn("Backend warning:", data.error);
        toast.error(data.error);
        return;
      }

      const imageUrl = data.thumbnail.thumbnail_url;
      setGeneratedImage(imageUrl);
      
      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_thumbnails' }
      });
      
      if (onImageGenerated) {
        onImageGenerated(imageUrl);
      }
      
      toast.success("Professional thumbnail generated!");
    } catch (error: any) {
      console.warn("Generation warning:", error);
      toast.error(error.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement("a");
    link.download = `thumbnail-${Date.now()}.png`;
    link.href = generatedImage;
    link.click();
    toast.success("Downloaded!");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Custom AI Generation
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe your perfect thumbnail in detail
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Person with shocked expression holding phone, bright yellow background, dramatic lighting, money flying through air, high energy viral style..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={() => generateWithAI(prompt)}
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Magic...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Generate Pro Thumbnail
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
              <img
                src={generatedImage}
                alt="Generated thumbnail"
                className="w-full h-auto"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={downloadImage} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => window.open(generatedImage, "_blank")}>
                Open Full Size
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};