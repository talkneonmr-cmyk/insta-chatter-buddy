import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles, Copy, Clock, TrendingUp, Download, Calendar, ExternalLink } from "lucide-react";
import TesterGuard from "@/components/TesterGuard";
import SubscriptionGuard from "@/components/SubscriptionGuard";

interface ShortPackage {
  moment: {
    timestamp: string;
    startTime: number;
    endTime: number;
  };
  content: {
    title: string;
    caption: string;
    hashtags: string[];
    thumbnailUrl: string;
  };
  metadata: {
    viralScore: number;
    suggestedPlatforms: string[];
    bestPostingTime: string;
  };
}

const ShortsFactory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [packages, setPackages] = useState<ShortPackage[]>([]);
  const [videoTitle, setVideoTitle] = useState("");

  const handleGenerate = async () => {
    if (!videoUrl) {
      toast({
        title: "Video URL required",
        description: "Please enter a YouTube video URL",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this feature",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setPackages([]);

    try {
      // Pre-check usage to provide friendly messaging before hitting AI
      const { data: limitCheck } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_shorts_packages' }
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

      setProgressText("Analyzing video...");
      setProgress(20);

      const { data, error } = await supabase.functions.invoke('create-shorts-package', {
        body: { videoUrl, transcript }
      });

      if (error) {
        // Handle 403 from backend gracefully
        // @ts-ignore
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

      setProgressText("Finding viral moments...");
      setProgress(40);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressText("Generating titles & captions...");
      setProgress(60);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressText("Creating thumbnails...");
      setProgress(80);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgressText("Packaging shorts...");
      setProgress(100);

      setPackages(data.packages);
      setVideoTitle(data.videoTitle);

      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_shorts_packages' }
      });

      toast({
        title: "Shorts packages created! 🎉",
        description: `Generated ${data.totalPackages} ready-to-post shorts`,
      });

    } catch (error: any) {
      console.error('Error generating shorts:', error);
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
          title: "Generation failed",
          description: msg || "Failed to create shorts packages",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setProgressText("");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: "default" as const, label: "🔥 Viral", color: "bg-red-500" };
    if (score >= 60) return { variant: "secondary" as const, label: "⚡ High", color: "bg-orange-500" };
    return { variant: "outline" as const, label: "✨ Good", color: "bg-blue-500" };
  };

  return (
    <TesterGuard>
      <SubscriptionGuard>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-3 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg float-animation shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold gradient-text">AI Shorts Factory</h1>
                  <p className="text-sm text-muted-foreground">Turn one video into multiple viral shorts automatically</p>
                </div>
              </div>
            </div>

            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Video Input</CardTitle>
                <CardDescription>
                  Enter a YouTube video URL to generate multiple shorts packages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">YouTube Video URL *</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transcript">Video Transcript (Optional)</Label>
                  <Textarea
                    id="transcript"
                    placeholder="Paste the video transcript here for better analysis..."
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    disabled={isGenerating}
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !videoUrl}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                      Generating Shorts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Shorts Package
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Loading Progress */}
            {isGenerating && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{progressText}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {packages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Your Shorts Packages</h2>
                    <p className="text-sm text-muted-foreground">
                      {packages.length} ready-to-post shorts from "{videoTitle}"
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {packages.map((pkg, index) => {
                    const scoreBadge = getScoreBadge(pkg.metadata.viralScore);
                    
                    return (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={scoreBadge.variant}>{scoreBadge.label}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {pkg.moment.timestamp}
                                </span>
                              </div>
                              <CardTitle className="text-lg line-clamp-2">{pkg.content.title}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        
                        {pkg.content.thumbnailUrl && (
                          <div className="px-6">
                            <img
                              src={pkg.content.thumbnailUrl}
                              alt="Thumbnail"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        
                        <CardContent className="space-y-4 pt-4">
                          {/* Caption */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold">Caption</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(pkg.content.caption, "Caption")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {pkg.content.caption}
                            </p>
                          </div>

                          {/* Hashtags */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold">Hashtags</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(pkg.content.hashtags.join(' '), "Hashtags")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pkg.content.hashtags.slice(0, 5).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{pkg.metadata.bestPostingTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{pkg.metadata.viralScore}%</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                const fullText = `Title: ${pkg.content.title}\n\nCaption: ${pkg.content.caption}\n\nHashtags: ${pkg.content.hashtags.join(' ')}`;
                                copyToClipboard(fullText, "Package");
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Copy All
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => navigate('/youtube-manager')}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && packages.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No shorts packages yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Enter a YouTube video URL above to automatically generate multiple ready-to-post shorts with titles, captions, thumbnails, and hashtags.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SubscriptionGuard>
    </TesterGuard>
  );
};

export default ShortsFactory;
