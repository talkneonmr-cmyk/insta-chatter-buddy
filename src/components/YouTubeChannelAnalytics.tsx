import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Users, Video, TrendingUp, Loader2 } from "lucide-react";

interface ChannelStats {
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  channelTitle: string;
  thumbnail: string;
}

interface RecentVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

const YouTubeChannelAnalytics = () => {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('youtube-analytics');

      if (error) throw error;

      setStats(data.statistics);
      setRecentVideos(data.recentVideos || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch channel analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Connect your YouTube account to view analytics
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Channel Overview */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <img 
            src={stats.thumbnail} 
            alt={stats.channelTitle}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h3 className="text-lg font-semibold">{stats.channelTitle}</h3>
            <p className="text-sm text-muted-foreground">Channel Statistics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(stats.viewCount)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Subscribers</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(stats.subscriberCount)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Videos</span>
            </div>
            <p className="text-2xl font-bold">{stats.videoCount}</p>
          </div>
        </div>
      </Card>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recent Videos</h3>
          </div>
          <div className="space-y-3">
            {recentVideos.map((video) => (
              <div 
                key={video.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-20 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default YouTubeChannelAnalytics;