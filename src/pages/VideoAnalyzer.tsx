import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Youtube, TrendingUp, Clock, Zap, Copy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ViralMoment {
  timestamp: string;
  timeInSeconds: number;
  title: string;
  description: string;
  viralPotential: number;
  suggestedCaption: string;
  tags: string[];
}

interface Analysis {
  videoTitle: string;
  moments: ViralMoment[];
}

export default function VideoAnalyzer() {
  const [videoUrl, setVideoUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [mode, setMode] = useState<"auto" | "manual">("manual");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please enter a YouTube video URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Please sign in to use this feature",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        'analyze-youtube-video',
        {
          body: { 
            videoUrl,
            transcript: mode === "manual" && transcript ? transcript : undefined
          },
        }
      );

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis({
        videoTitle: data.videoTitle,
        moments: data.moments,
      });

      toast({
        title: "Analysis Complete!",
        description: `Found ${data.moments.length} viral moments in your video`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
    });
  };

  const getPotentialColor = (potential: number) => {
    if (potential >= 80) return "text-green-500";
    if (potential >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getPotentialBadge = (potential: number) => {
    if (potential >= 80) return "🔥 HOT";
    if (potential >= 60) return "⚡ GOOD";
    return "💡 OK";
  };

  return (
    <Layout>
      <div className="min-h-screen p-8 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Youtube className="h-10 w-10 text-red-500" />
              <h1 className="text-4xl font-bold">YouTube Video Analyzer</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find viral moments in your YouTube videos with AI. Get timestamps, captions, and 
              suggestions for creating shorts & reels that drive engagement.
            </p>
          </div>

          {/* Input Section */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-accent/20 rounded-lg w-fit">
                <Button
                  variant={mode === "manual" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("manual")}
                >
                  Manual Transcript
                </Button>
                <Button
                  variant={mode === "auto" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("auto")}
                >
                  Auto (Title-Based)
                </Button>
              </div>

              {/* Video URL Input */}
              <div className="flex gap-4">
                <Input
                  placeholder="Paste YouTube video URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && mode === "auto" && handleAnalyze()}
                  className="flex-1"
                />
                {mode === "auto" && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !videoUrl}
                    className="min-w-[140px]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Manual Transcript Input */}
              {mode === "manual" && (
                <>
                  <textarea
                    placeholder="Paste video transcript here... (Get it from YouTube: ⋮ → Show transcript → Copy)"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full min-h-[120px] p-3 border rounded-md bg-background resize-y"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !videoUrl || !transcript}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Transcript...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Analyze with Transcript
                      </>
                    )}
                  </Button>
                </>
              )}

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="text-lg">💡</div>
                <div>
                  <strong>Manual mode (recommended):</strong> Paste the video transcript for accurate timestamp analysis.<br/>
                  <strong>Auto mode:</strong> Generates suggestions based on video title only (no actual timestamps).
                </div>
              </div>
            </div>
          </Card>

          {/* Loading State */}
          {isAnalyzing && (
            <Card className="p-8">
              <div className="space-y-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Analyzing Your Video...</h3>
                <p className="text-muted-foreground">
                  Our AI is scanning the transcript to find viral moments. This may take 30-60 seconds.
                </p>
                <div className="max-w-md mx-auto space-y-2">
                  <Progress value={33} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Fetching transcript → Analyzing content → Finding viral moments
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          {analysis && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{analysis.videoTitle}</h2>
                  <p className="text-muted-foreground">
                    Found {analysis.moments.length} viral moments
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Zap className="mr-2 h-4 w-4" />
                  {analysis.moments.length} Moments
                </Badge>
              </div>

              <div className="grid gap-4">
                {analysis.moments.map((moment, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="text-base px-3 py-1">
                              <Clock className="mr-2 h-4 w-4" />
                              {moment.timestamp}
                            </Badge>
                            <span className={`text-2xl font-bold ${getPotentialColor(moment.viralPotential)}`}>
                              {moment.viralPotential}%
                            </span>
                            <span className="text-xl">{getPotentialBadge(moment.viralPotential)}</span>
                          </div>
                          <h3 className="text-xl font-bold">{moment.title}</h3>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground">{moment.description}</p>

                      {/* Caption */}
                      <div className="bg-accent/20 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-semibold mb-2 text-muted-foreground">
                              Suggested Caption:
                            </p>
                            <p className="font-medium">{moment.suggestedCaption}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(moment.suggestedCaption)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {moment.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline">
                            #{tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Action */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const url = videoUrl.includes('?') 
                            ? `${videoUrl}&t=${moment.timeInSeconds}s`
                            : `${videoUrl}?t=${moment.timeInSeconds}s`;
                          window.open(url, '_blank');
                        }}
                      >
                        <Youtube className="mr-2 h-4 w-4" />
                        Watch at {moment.timestamp}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!analysis && !isAnalyzing && (
            <Card className="p-12 text-center">
              <Youtube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Paste a YouTube video URL above and click "Analyze Video" to find viral moments 
                perfect for creating engaging shorts and reels.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
