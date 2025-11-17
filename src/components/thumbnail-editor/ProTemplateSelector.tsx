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
  const [thumbnailText, setThumbnailText] = useState("");
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const POPULAR_EMOJIS = [
    { emoji: "🔥", label: "Fire" },
    { emoji: "😱", label: "Shocked" },
    { emoji: "💯", label: "100" },
    { emoji: "⚡", label: "Lightning" },
    { emoji: "💰", label: "Money" },
    { emoji: "🎯", label: "Target" },
    { emoji: "🚨", label: "Alert" },
    { emoji: "💪", label: "Strong" },
    { emoji: "🤯", label: "Mind Blown" },
    { emoji: "😍", label: "Love" },
    { emoji: "🎉", label: "Party" },
    { emoji: "⭐", label: "Star" },
    { emoji: "👑", label: "Crown" },
    { emoji: "💎", label: "Diamond" },
    { emoji: "🏆", label: "Trophy" },
    { emoji: "❤️", label: "Heart" },
  ];

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
  };

  const generateThumbnail = async () => {
    if (!selectedTemplate || !customPrompt.trim()) {
      toast.error("Please select a template and describe your thumbnail");
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Pre-check usage to provide friendly messaging before hitting AI
      const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_thumbnails' }
      });

      if (limitCheck && limitCheck.canUse === false) {
        toast.error("Daily limit reached. Free: 5/day. Upgrade to Pro for 20/day or check back after reset.");
        return;
      }

      let finalPrompt = `${selectedTemplate.basePrompt}

SPECIFIC CONTENT: ${customPrompt}`;

      // Add text overlay instructions if user provided text
      if (thumbnailText.trim()) {
        finalPrompt += `

TEXT OVERLAY REQUIREMENTS:
- Include bold, high-contrast text that says: "${thumbnailText}"
- Use thick white text with black stroke outline for maximum readability
- Position text in top third or center for maximum impact
- Make text large and impossible to miss (40-50% of thumbnail height)
- Use bold sans-serif font (Impact or Arial Black style)
- Add subtle shadow or glow effect behind text
- Ensure text has perfect contrast against background
- Text should be the MAIN focal point`;
      }

      // Add emoji instructions if user selected emojis
      if (selectedEmojis.length > 0) {
        finalPrompt += `

EMOJI OVERLAY REQUIREMENTS:
- Include these emojis prominently in the thumbnail: ${selectedEmojis.join(" ")}
- Make emojis LARGE and clearly visible (10-15% of thumbnail size each)
- Position emojis strategically to enhance emotion and draw attention
- Use 3D rendered emoji style with slight shadow for depth
- Place emojis near corners or alongside main subject
- Ensure emojis complement the overall composition`;
      }

      finalPrompt += `

CRITICAL YOUTUBE THUMBNAIL REQUIREMENTS:
- EXACTLY 1280x720 pixels (16:9 aspect ratio)
- Ultra high resolution and sharp
- Professional studio lighting with dramatic shadows
- Maximum color saturation and contrast
- Eye-catching composition that stops scrolling
- Professional YouTube thumbnail quality
- Optimized for small preview size`;

      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          prompt: finalPrompt,
          style: "professional",
          title: `${selectedTemplate.name} - ${customPrompt.substring(0, 30)}`,
        },
      });

      if (error) {
        console.warn("Supabase function warning:", error);
        // @ts-ignore
        if (error.status === 403 || (typeof error.message === 'string' && error.message.toLowerCase().includes('daily limit'))) {
          toast.error("Daily limit reached. Free: 5/day. Upgrade to Pro for 20/day or check back after reset.");
        } else {
          toast.error(error.message || "Hey there! Your daily limit is reached. Please check back tomorrow!");
        }
        return;
      }
      
      if (data?.error) {
        console.warn("Backend warning:", data.error);
        toast.error(data.error);
        return;
      }

      setGeneratedImage(data.thumbnail.thumbnail_url);
      
      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_thumbnails' }
      });

      toast.success("🔥 Pro YouTube thumbnail created!");
    } catch (error: any) {
      console.warn("Generation warning:", error);
      const msg = (typeof (error as any)?.message === 'string' ? (error as any).message : '') as string;
      if ((error as any)?.status === 403 || msg.toLowerCase().includes('daily limit')) {
        toast.error("Daily limit reached. Free: 5/day. Upgrade to Pro for 20/day or check back after reset.");
      } else {
        toast.error(msg || "Failed to generate thumbnail");
      }
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
    setThumbnailText("");
    setSelectedEmojis([]);
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
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="text-2xl sm:text-3xl">{selectedTemplate.emoji}</span>
                  Step 2: Describe Your Thumbnail
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Template: {selectedTemplate.name}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)} className="self-start sm:self-auto">
                Change Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-4 sm:px-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">What should be in the thumbnail?</label>
              <Textarea
                placeholder={selectedTemplate.placeholder}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={4}
                className="resize-none text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Add Text Overlay (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 'I SPENT $100,000' or 'YOU WON'T BELIEVE THIS'"
                value={thumbnailText}
                onChange={(e) => setThumbnailText(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-input bg-background text-sm sm:text-base font-bold placeholder:font-normal"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                AI will automatically style and position your text for maximum impact
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Add Emojis (Optional)</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {POPULAR_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => toggleEmoji(item.emoji)}
                    className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedEmojis.includes(item.emoji)
                        ? "border-primary bg-primary/10 scale-105"
                        : "border-border hover:border-primary/50"
                    }`}
                    title={item.label}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
              {selectedEmojis.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Selected:</span>
                  <div className="flex gap-2 text-2xl">
                    {selectedEmojis.map((emoji) => (
                      <span key={emoji}>{emoji}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEmojis([])}
                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Emojis will be rendered large and prominently for maximum engagement
              </p>
            </div>

            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <span>💡</span>
                <span>Pro Tips:</span>
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                <li>• Describe the main visual you want</li>
                <li>• Add text for viral titles like MrBeast</li>
                <li>• Pick 1-3 emojis that match your emotion</li>
                <li>• Text works best with 2-6 words in ALL CAPS</li>
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
                  Creating 1280x720 Thumbnail...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate YouTube Thumbnail
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

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" />
                <span>YouTube Perfect • 1280x720 pixels</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to upload - Optimized for maximum clicks
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
