import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AITemplateGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const quickPrompts = [
    "Dramatic gaming setup with RGB lights, 16:9 aspect ratio",
    "Tech product showcase on gradient background with floating elements",
    "Fitness motivation with energetic colors and dynamic pose",
    "Cooking scene with food ingredients arranged artistically",
    "Educational content with clean minimalist design and icons",
  ];

  const generateWithAI = async (promptText: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          prompt: promptText + " Ultra high quality YouTube thumbnail, professional, eye-catching",
          style: "professional",
          title: "AI Generated Template",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImages((prev) => [data.thumbnail.thumbnail_url, ...prev].slice(0, 6));
      toast.success("Template generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Template Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe your thumbnail idea..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
        <Button
          onClick={() => generateWithAI(prompt)}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Template
            </>
          )}
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrompt(qp);
                  generateWithAI(qp);
                }}
                disabled={loading}
                className="text-xs"
              >
                {qp.split(",")[0]}
              </Button>
            ))}
          </div>
        </div>

        {generatedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {generatedImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Generated ${idx}`}
                className="w-full rounded-lg border border-border cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};