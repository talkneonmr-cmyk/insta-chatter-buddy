import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GeneratedCaption } from "@/pages/CaptionGenerator";

interface CaptionPreviewProps {
  caption: GeneratedCaption;
}

const CaptionPreview = ({ caption }: CaptionPreviewProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const copyFullCaption = () => {
    const fullText = `${caption.caption}\n\n${caption.hashtags.map(h => `#${h}`).join(' ')}`;
    copyToClipboard(fullText, "Full caption");
  };

  return (
    <Card className="border-2 shadow-lg sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5 text-primary" />
            Preview
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={copyFullCaption}
          >
            {copied === "Full caption" ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy All
          </Button>
        </div>
        <CardDescription>Instagram-style preview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hook Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">Hook Line</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(caption.hookLine, "Hook line")}
            >
              {copied === "Hook line" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <p className="text-sm font-medium">{caption.hookLine}</p>
        </div>

        {/* Main Caption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">Caption</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(caption.caption, "Caption")}
            >
              {copied === "Caption" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-sm whitespace-pre-wrap">{caption.caption}</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <span className="text-sm font-semibold text-primary">Call to Action</span>
          <p className="text-sm italic text-muted-foreground">{caption.callToAction}</p>
        </div>

        {/* Hashtags */}
        {caption.hashtags && caption.hashtags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">
                Hashtags ({caption.hashtags.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(caption.hashtags.map(h => `#${h}`).join(' '), "Hashtags")}
              >
                {copied === "Hashtags" ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {caption.hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Emoji Suggestions */}
        {caption.emojiSuggestions && caption.emojiSuggestions.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-semibold text-primary">Emoji Suggestions</span>
            <div className="flex flex-wrap gap-2">
              {caption.emojiSuggestions.map((emoji, index) => (
                <span key={index} className="text-2xl">{emoji}</span>
              ))}
            </div>
          </div>
        )}

        {/* AI Explanation */}
        {caption.description && (
          <div className="space-y-2 pt-4 border-t">
            <span className="text-sm font-semibold text-primary">Why This Works</span>
            <p className="text-xs text-muted-foreground">{caption.description}</p>
          </div>
        )}

        {/* Metadata */}
        {caption.metadata && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Model: {caption.metadata.model}</span>
              <span>{caption.metadata.processingTime}ms</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaptionPreview;
