import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Eye, 
  ThumbsUp, 
  MessageSquare,
  CheckCircle,
  Clock,
  Youtube,
  RefreshCw,
  Zap,
  Settings,
  Copy
} from "lucide-react";
import AutoPilotSettings from "./AutoPilotSettings";

interface VideoPerformance {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  engagementRate: string;
  performanceScore: number;
  needsOptimization: boolean;
}

interface Optimization {
  type: string;
  original: string;
  optimized: string;
  reasoning: string;
}

const YouTubePerformanceMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  
  const [channelAvgScore, setChannelAvgScore] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [underperformingCount, setUnderperformingCount] = useState(0);
  const [performances, setPerformances] = useState<VideoPerformance[]>([]);
  
  const [selectedVideo, setSelectedVideo] = useState<VideoPerformance | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [showOptimizations, setShowOptimizations] = useState(false);

  const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
  const [runningAutoPilot, setRunningAutoPilot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    analyzePerformance();
    loadAutoPilotSettings();
  }, []);

  const loadAutoPilotSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_pilot_settings')
        .select('enabled')
        .single();

      if (data) {
        setAutoPilotEnabled(data.enabled);
      }
    } catch (error) {
      // Settings don't exist yet, that's okay
    }
  };

  const runAutoPilot = async () => {
    setRunningAutoPilot(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-auto-pilot', {
        body: {}
      });

      if (error) throw error;

      // Increment YouTube operations usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_operations' }
      });

      if (data.videosProcessed > 0) {
        toast.success(`Auto-pilot processed ${data.videosProcessed} videos!`);
        await analyzePerformance(); // Refresh data
      } else {
        toast.info(data.message || "No videos to process");
      }
    } catch (error: any) {
      toast.error("Auto-pilot failed: " + error.message);
    } finally {
      setRunningAutoPilot(false);
    }
  };

  const analyzePerformance = async () => {
    setLoading(true);
    setAnalyzing(true);
    setNoAccount(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video-performance', {
        body: {}
      });

      if (error) {
        if (error.message?.includes('YouTube account not found')) {
          setNoAccount(true);
          return;
        }
        throw error;
      }

      setChannelAvgScore(data.channelAvgScore);
      setTotalVideos(data.totalVideos);
      setUnderperformingCount(data.underperformingCount);
      setPerformances(data.performances);
      
      toast.success(`Analyzed ${data.totalVideos} videos`);
    } catch (error: any) {
      if (error.message?.includes('YouTube account not found')) {
        setNoAccount(true);
      } else {
        toast.error("Failed to analyze performance: " + error.message);
      }
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const optimizeVideo = async (video: VideoPerformance, applyChanges: boolean = false) => {
    setOptimizing(video.videoId);
    setSelectedVideo(video);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-optimize-video', {
        body: { videoId: video.videoId, applyChanges }
      });

      if (error) {
        if (error.message?.includes('Rate limit exceeded')) {
          toast.error("Rate limit exceeded. Please wait and try again.");
          return;
        }
        if (error.message?.includes('AI credits exhausted')) {
          toast.error("AI credits exhausted. Please add credits to continue.");
          return;
        }
        throw error;
      }

      setOptimizations(data.optimizations);
      setShowOptimizations(true);
      
      // Increment YouTube operations usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_operations' }
      });
      
      if (applyChanges) {
        toast.success("Optimizations applied successfully!");
        await analyzePerformance(); // Refresh data
      } else {
        toast.success("AI suggestions generated!");
      }
    } catch (error: any) {
      toast.error("Optimization failed: " + error.message);
    } finally {
      setOptimizing(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Okay</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  if (loading && performances.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (noAccount) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-red-500/10 rounded-full">
            <Youtube className="h-12 w-12 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">YouTube Account Not Connected</h3>
            <p className="text-muted-foreground mb-4">
              Please connect your YouTube account to analyze video performance.
            </p>
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Go to Account Connection
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">AI-powered video performance analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Auto-Pilot Settings
          </Button>
          <Button onClick={analyzePerformance} disabled={analyzing}>
            {analyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Auto-Pilot Status Bar */}
      {autoPilotEnabled && (
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Auto-Pilot Enabled</p>
                <p className="text-sm text-muted-foreground">
                  Automatically optimizing underperforming videos
                </p>
              </div>
            </div>
            <Button 
              onClick={runAutoPilot} 
              disabled={runningAutoPilot}
              variant="outline"
            >
              {runningAutoPilot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Now
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Dashboard Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Channel Avg Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(channelAvgScore)}`}>
                {channelAvgScore}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <Progress value={channelAvgScore} className="mt-4 h-2" />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Videos</p>
              <p className="text-3xl font-bold">{totalVideos}</p>
            </div>
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Underperforming</p>
              <p className="text-3xl font-bold text-red-500">{underperformingCount}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Video Performance Grid */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Videos ({totalVideos})</TabsTrigger>
          <TabsTrigger value="underperforming">
            Needs Optimization ({underperformingCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {performances.map((video) => (
            <Card key={video.videoId} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    {getScoreBadge(video.performanceScore)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{video.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      <span>{video.likes.toLocaleString()} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{video.comments.toLocaleString()} comments</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement: </span>
                      <span className="font-medium">{video.engagementRate}%</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Performance Score:</span>
                      <span className={`font-bold ${getScoreColor(video.performanceScore)}`}>
                        {video.performanceScore}/100
                      </span>
                    </div>
                    <Progress value={video.performanceScore} className="h-2" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => optimizeVideo(video, false)}
                    disabled={optimizing === video.videoId}
                  >
                    {optimizing === video.videoId ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Optimize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.videoId}`);
                      toast.success("Video link copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="underperforming" className="space-y-4 mt-4">
          {performances.filter(v => v.needsOptimization).map((video) => (
            <Card key={video.videoId} className="p-4 border-red-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{video.title}</h3>
                    {getScoreBadge(video.performanceScore)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{video.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                      <span>{video.likes.toLocaleString()} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{video.comments.toLocaleString()} comments</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Engagement: </span>
                      <span className="font-medium">{video.engagementRate}%</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">Performance Score:</span>
                      <span className={`font-bold ${getScoreColor(video.performanceScore)}`}>
                        {video.performanceScore}/100
                      </span>
                    </div>
                    <Progress value={video.performanceScore} className="h-2" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => optimizeVideo(video, false)}
                    disabled={optimizing === video.videoId}
                  >
                    {optimizing === video.videoId ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Optimize
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.videoId}`);
                      toast.success("Video link copied to clipboard");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* AI Optimization Panel */}
      {showOptimizations && selectedVideo && (
        <Card className="p-6 border-primary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Optimization Suggestions
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{selectedVideo.title}</p>
            </div>
            <Button variant="outline" onClick={() => setShowOptimizations(false)}>
              Close
            </Button>
          </div>

          <div className="space-y-6">
            {optimizations.map((opt, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{opt.type}</Badge>
                  <span className="text-sm text-muted-foreground">{opt.reasoning}</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Current
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{opt.original}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Optimized
                    </p>
                    <div className="p-3 bg-primary/10 border border-primary rounded-lg">
                      <p className="text-sm">{opt.optimized}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => optimizeVideo(selectedVideo, true)}
              disabled={optimizing === selectedVideo.videoId}
              className="flex-1"
            >
              {optimizing === selectedVideo.videoId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Apply All Changes
            </Button>
            <Button variant="outline" onClick={() => setShowOptimizations(false)}>
              Review Later
            </Button>
          </div>
        </Card>
      )}

      {/* Settings Dialog */}
      <AutoPilotSettings 
        open={showSettings}
        onOpenChange={setShowSettings}
        onSettingsUpdate={loadAutoPilotSettings}
      />
    </div>
  );
};

export default YouTubePerformanceMonitor;