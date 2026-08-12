import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Type, Loader2, Copy, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AITextGenerator = () => {
  const [videoTopic, setVideoTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateTitles = async () => {
    if (!videoTopic.trim()) {
      toast.error("Enter your video topic first");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-caption", {
        body: {
          prompt: `Generate 5 viral, attention-grabbing YouTube thumbnail text overlays for a video about: ${videoTopic}. 
          
Requirements:
- Each should be 2-6 words maximum
- Use ALL CAPS for impact
- Include power words like: SHOCKING, INSANE, EXTREME, SECRET, FINALLY
- Make them clickable but not misleading
- Vary the emotion: shocked, curious, dramatic, excited
- Format: Just return the text phrases, one per line, no numbering

Examples:
"I SPENT $1,000,000"
"YOU WON'T BELIEVE THIS"
"DESTROYING MY FRIEND'S SETUP"

Now generate for: ${videoTopic}`,
          style: "engaging",
          length: "short",
        },
      });

      if (error) throw error;

      const generated = data.caption || "";
      const titleList = generated
        .split("\n")
        .filter((t: string) => t.trim())
        .map((t: string) => t.replace(/^[0-9]+\.?\s*/, "").replace(/^["']|["']$/g, "").trim())
        .filter((t: string) => t.length > 0);

      setSuggestions(titleList);
      toast.success("Generated viral titles!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate titles");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          AI Title Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate viral thumbnail text overlays
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Enter your video topic..."
            value={videoTopic}
            onChange={(e) => setVideoTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateTitles()}
          />
          <Button
            onClick={generateTitles}
            disabled={loading || !videoTopic.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Viral Titles
              </>
            )}
          </Button>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Titles:</p>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="flex-1 font-bold text-sm">{suggestion}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(suggestion)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p className="font-semibold">💡 Pro Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use numbers: "$1,000,000 CHALLENGE"</li>
            <li>Create curiosity: "YOU WON&apos;T BELIEVE THIS"</li>
            <li>Show transformation: "FROM BROKE TO MILLIONAIRE"</li>
            <li>Add urgency: "LAST CHANCE"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};