import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Hash, Sparkles, Copy, Check } from "lucide-react";

import SubscriptionGuard from "@/components/SubscriptionGuard";
import TesterGuard from "@/components/TesterGuard";

export default function HashtagGenerator() {
  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [loading, setLoading] = useState(false);
  const [generation, setGeneration] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const copyAllHashtags = () => {
    if (generation?.hashtags?.all) {
      const hashtagsText = generation.hashtags.all.join(' ');
      navigator.clipboard.writeText(hashtagsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "All hashtags copied to clipboard",
      });
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic for your content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Pre-check usage to provide friendly messaging before hitting AI
      const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_hashtags' }
      });

      if (limitCheck && limitCheck.canUse === false) {
        toast({
          title: "Daily limit reached",
          description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
          action: (
            <Button variant="default" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          ),
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-hashtags', {
        body: { topic, niche, platform }
      });

      if (error) {
        // Handle 403 from backend gracefully
        // @ts-ignore status may be present on the error
        if (error.status === 403 || (typeof error.message === 'string' && error.message.toLowerCase().includes('daily limit'))) {
          toast({
            title: "Daily limit reached",
            description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
            action: (
              <Button variant="default" onClick={() => navigate('/pricing')}>
                Upgrade
              </Button>
            ),
          });
          return;
        }
        throw error;
      }

      if (data.generation) {
        setGeneration(data.generation);
        

        toast({
          title: "Hashtags Generated!",
          description: "Your strategic hashtag mix is ready.",
        });
      }
    } catch (error: any) {
      console.error('Error generating hashtags:', error);
      const msg = (typeof (error as any)?.message === 'string' ? (error as any).message : '') as string;
      if ((error as any)?.status === 403 || msg.toLowerCase().includes('daily limit')) {
        toast({
          title: "Daily limit reached",
          description: "Free: 5/day. Upgrade to Pro for 20/day or check back after reset.",
          action: (
            <Button variant="default" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          ),
        });
      } else {
        toast({
          title: "Generation Failed",
          description: msg || "Failed to generate hashtags",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    
      <TesterGuard featureName="Hashtag Generator">
        <SubscriptionGuard>
          <div className="max-w-6xl mx-auto p-4 space-y-8">
          <div className="text-center space-y-2 slide-in">
            <h1 className="text-4xl font-bold gradient-text flex items-center justify-center gap-2">
              <Hash className="h-10 w-10" />
              AI Hashtag Generator
            </h1>
            <p className="text-muted-foreground text-lg">
              Generate strategic hashtag mixes for maximum reach and engagement
            </p>
          </div>

          <Card className="card-3d border-2">
            <CardHeader>
              <CardTitle>Generate Hashtags</CardTitle>
              <CardDescription>
                Get AI-powered hashtag suggestions optimized for your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Content Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Morning workout routine, Budget travel tips..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Niche (Optional)</Label>
                <Input
                  id="niche"
                  placeholder="e.g., Fitness, Travel, Food..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="twitter">Twitter/X</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
                variant="gradient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Hashtags
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generation && (
            <div className="space-y-4">
              <Card className="card-3d border-primary scale-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Hashtags ({generation.hashtags?.all?.length || 0})</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllHashtags}
                    >
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      Copy All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {generation.hashtags?.all?.map((hashtag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {hashtag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {generation.hashtags?.highVolume && generation.hashtags.highVolume.length > 0 && (
                <Card className="card-3d scale-in">
                  <CardHeader>
                    <CardTitle className="text-lg">🔥 High Volume Hashtags</CardTitle>
                    <CardDescription>Popular tags with 1M+ posts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generation.hashtags.highVolume.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="default">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {generation.hashtags?.mediumVolume && generation.hashtags.mediumVolume.length > 0 && (
                <Card className="card-3d scale-in">
                  <CardHeader>
                    <CardTitle className="text-lg">⚡ Medium Volume Hashtags</CardTitle>
                    <CardDescription>Moderately popular (100K-1M posts)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generation.hashtags.mediumVolume.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {generation.hashtags?.niche && generation.hashtags.niche.length > 0 && (
                <Card className="card-3d scale-in">
                  <CardHeader>
                    <CardTitle className="text-lg">🎯 Niche-Specific Hashtags</CardTitle>
                    <CardDescription>Targeted tags (10K-100K posts)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generation.hashtags.niche.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {generation.hashtags?.branded && generation.hashtags.branded.length > 0 && (
                <Card className="card-3d scale-in">
                  <CardHeader>
                    <CardTitle className="text-lg">✨ Branded/Unique Hashtags</CardTitle>
                    <CardDescription>Build your community with these</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generation.hashtags.branded.map((hashtag: string, index: number) => (
                        <Badge key={index} variant="default">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </SubscriptionGuard>
      </TesterGuard>
    
  );
}
