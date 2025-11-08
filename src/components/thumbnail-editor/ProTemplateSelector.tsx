import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Crown, Zap, TrendingUp, Sparkles, Loader2, Download, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  emoji: string;
  basePrompt: string;
  placeholder: string;
  category: string;
}

const TEMPLATES: Template[] = [
  {
    id: "shocked",
    name: "Shocked Reaction",
    emoji: "😱",
    basePrompt: "Ultra dramatic YouTube thumbnail with person showing EXTREME shocked expression, mouth wide open, hands on face, bright vibrant colors, high contrast dramatic lighting with glow effects, professional quality, 1280x720 pixels, eye-catching",
    placeholder: "Example: 'holding iPhone 15' or 'standing in destroyed room' or 'looking at computer screen'",
    category: "viral",
  },
  {
    id: "money",
    name: "Money/Challenge",
    emoji: "💰",
    basePrompt: "Epic YouTube thumbnail with stacks of money, dollar bills flying through air, excited person in center, bright yellow and green colors, bold dramatic lighting, professional quality, 1280x720 pixels, high energy",
    placeholder: "Example: '$100,000 giveaway' or 'counting cash' or 'money everywhere'",
    category: "viral",
  },
  {
    id: "vs",
    name: "VS Battle",
    emoji: "⚔️",
    basePrompt: "Professional YouTube thumbnail split screen comparison, dramatic red vs blue color scheme, large glowing VS text in center, high contrast lighting, cinematic quality, 1280x720 pixels",
    placeholder: "Example: 'iPhone vs Android' or 'Rich vs Broke' or 'Pro vs Noob'",
    category: "comparison",
  },
  {
    id: "transformation",
    name: "Before/After",
    emoji: "✨",
    basePrompt: "Dramatic before and after YouTube thumbnail, split screen, left side dull and dark, right side bright and vibrant, large arrow pointing right, professional quality, 1280x720 pixels",
    placeholder: "Example: 'messy room to clean' or 'skinny to muscular' or 'old to new'",
    category: "transformation",
  },
  {
    id: "extreme",
    name: "Extreme Challenge",
    emoji: "🔥",
    basePrompt: "Ultra dramatic YouTube thumbnail with person mid-action, explosive energy, intense colors red and orange, dramatic lighting, high impact, professional quality, 1280x720 pixels, extreme sports style",
    placeholder: "Example: 'eating 100 burgers' or 'staying awake 48 hours' or 'impossible jump'",
    category: "challenge",
  },
  {
    id: "unboxing",
    name: "Product Showcase",
    emoji: "📦",
    basePrompt: "Professional YouTube thumbnail with product centered, clean gradient background, dramatic product lighting with glow effect, modern sleek style, 1280x720 pixels, high-end commercial look",
    placeholder: "Example: 'new iPhone' or 'gaming console' or 'expensive watch'",
    category: "tech",
  },
];

export const ProTemplateSelector = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateThumbnail = async () => {
    if (!selectedTemplate || !customPrompt.trim()) {
      toast.error("Please select a template and describe your thumbnail");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      const finalPrompt = `${selectedTemplate.basePrompt}

SPECIFIC CONTENT: ${customPrompt}

CRITICAL QUALITY REQUIREMENTS:
- Ultra high resolution 1280x720 pixels perfect for YouTube
- Professional studio lighting
- Vibrant saturated colors
- Sharp focus
- Dramatic composition
- Eye-catching and clickable
- Space for text overlay if needed`;

      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          prompt: finalPrompt,
          style: "professional",
          title: `${selectedTemplate.name} - ${customPrompt.substring(0, 30)}`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.thumbnail.thumbnail_url);
      toast.success("🔥 Pro thumbnail created!");
      
      // Increment usage
      await supabase.functions.invoke("increment-usage", {
        body: { usageType: "ai_thumbnails" },
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate thumbnail");
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

  const resetAndGenerate = () => {
    setGeneratedImage(null);
    setCustomPrompt("");
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {!selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Step 1: Choose Your Style
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select a proven viral thumbnail template
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto py-6 px-4 flex flex-col items-center gap-3 hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="text-4xl">{template.emoji}</div>
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {template.category}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customization Step */}
      {selectedTemplate && !generatedImage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{selectedTemplate.emoji}</span>
                  Step 2: Describe Your Thumbnail
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Template: {selectedTemplate.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                Change Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What should be in the thumbnail?</label>
              <Textarea
                placeholder={selectedTemplate.placeholder}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="resize-none text-base"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">💡 Pro Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Be specific about what you want to see</li>
                <li>• Mention colors if you have a preference</li>
                <li>• Include any text you want visible</li>
                <li>• Keep it simple - AI does the magic</li>
              </ul>
            </div>

            <Button
              onClick={generateThumbnail}
              disabled={loading || !customPrompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Your Viral Thumbnail...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Pro Thumbnail
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {generatedImage && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Your Pro Thumbnail
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetAndGenerate}>
                Create Another
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border-4 border-primary/20 shadow-2xl">
              <img
                src={generatedImage}
                alt="Generated thumbnail"
                className="w-full h-auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={downloadImage} size="lg" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => window.open(generatedImage, "_blank")} size="lg">
                Open Full Size
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Perfect for YouTube • 1280x720 • Pro Quality</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
