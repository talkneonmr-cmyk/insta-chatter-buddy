import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Youtube, Sparkles, Loader2, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChannelSetup {
  channelNames: string[];
  description: string;
  keywords: string[];
  contentStrategy: string;
  uploadSchedule: string;
  thumbnailTips: string;
}

const ChannelCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [niche, setNiche] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentType, setContentType] = useState("");
  const [generating, setGenerating] = useState(false);
  const [setup, setSetup] = useState<ChannelSetup | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!niche.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your channel niche",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-channel-setup', {
        body: { 
          niche: niche.trim(),
          targetAudience: targetAudience.trim(),
          contentType: contentType.trim()
        }
      });

      if (error) throw error;

      setSetup(data.setup);
      toast({
        title: "Channel Setup Generated!",
        description: "Your viral-optimized channel setup is ready",
      });
    } catch (error) {
      console.error('Error generating channel setup:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate channel setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/youtube-manager")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Youtube className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Channel Creator</h1>
              <p className="text-muted-foreground">Generate viral-optimized channel setup with AI</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="niche">Channel Niche *</Label>
              <Input
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., Gaming, Tech Reviews, Cooking, Fitness"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Teenagers, Young adults, Professionals"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Textarea
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                placeholder="e.g., Short-form tutorials, Long-form reviews, Entertainment vlogs"
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Setup...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Viral Setup
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Setup */}
        {setup && (
          <div className="space-y-6">
            {/* Channel Name Suggestions */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                Channel Name Suggestions
              </h2>
              <div className="space-y-3">
                {setup.channelNames.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(name, index)}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Channel Description */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Optimized Channel Description</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(setup.description, 100)}
                >
                  {copiedIndex === 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{setup.description}</p>
            </Card>

            {/* Keywords */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">SEO Keywords</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(setup.keywords.join(", "), 101)}
                >
                  {copiedIndex === 101 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {setup.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </Card>

            {/* Content Strategy */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Content Strategy for Viral Growth</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{setup.contentStrategy}</p>
            </Card>

            {/* Upload Schedule */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recommended Upload Schedule</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{setup.uploadSchedule}</p>
            </Card>

            {/* Thumbnail Tips */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Viral Thumbnail Tips</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{setup.thumbnailTips}</p>
            </Card>

            {/* Next Steps */}
            <Card className="p-6 bg-primary/5">
              <h2 className="text-xl font-bold mb-4">Next Steps</h2>
              <ol className="space-y-3 list-decimal list-inside">
                <li className="text-muted-foreground">Create a new YouTube channel using one of the suggested names</li>
                <li className="text-muted-foreground">Copy and paste the optimized description into your channel settings</li>
                <li className="text-muted-foreground">Add the SEO keywords to your channel</li>
                <li className="text-muted-foreground">Design thumbnails following the viral thumbnail tips</li>
                <li className="text-muted-foreground">Follow the content strategy and upload schedule for maximum growth</li>
                <li className="text-muted-foreground">Connect your new channel in the YouTube Manager to start uploading</li>
              </ol>
              <Button
                onClick={() => navigate("/youtube-manager")}
                className="w-full mt-6"
              >
                Go to YouTube Manager
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelCreator;
