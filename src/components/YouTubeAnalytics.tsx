import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, Video, Clock, TrendingUp, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  totalVideos: number;
  scheduledVideos: number;
  uploadedVideos: number;
  failedVideos: number;
}

const YouTubeAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVideos: 0,
    scheduledVideos: 0,
    uploadedVideos: 0,
    failedVideos: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch scheduled videos
      const { data: scheduled, error: schedError } = await supabase
        .from('scheduled_videos')
        .select('status')
        .eq('user_id', user.id);

      if (schedError) throw schedError;

      // Fetch upload history
      const { data: history, error: histError } = await supabase
        .from('video_uploads_history')
        .select('status')
        .eq('user_id', user.id);

      if (histError) throw histError;

      const scheduledCount = scheduled?.filter(v => v.status === 'pending').length || 0;
      const uploadedCount = history?.filter(v => v.status === 'uploaded').length || 0;
      const failedCount = history?.filter(v => v.status === 'failed').length || 0;

      setAnalytics({
        totalVideos: (scheduled?.length || 0) + (history?.length || 0),
        scheduledVideos: scheduledCount,
        uploadedVideos: uploadedCount,
        failedVideos: failedCount,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: Video,
      label: "Total Videos",
      value: analytics.totalVideos,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Clock,
      label: "Scheduled",
      value: analytics.scheduledVideos,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Upload,
      label: "Uploaded",
      value: analytics.uploadedVideos,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: analytics.totalVideos > 0 
        ? `${Math.round((analytics.uploadedVideos / analytics.totalVideos) * 100)}%`
        : "0%",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6 slide-in">
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2 gradient-text">Channel Analytics</h3>
        <p className="text-xs md:text-sm text-muted-foreground">Track your YouTube upload performance</p>
      </div>

      {loading ? (
        <Card className="p-8 md:p-12 text-center card-glass">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 md:p-6 card-3d">
              <div className={`p-2 md:p-3 rounded-lg ${stat.bg} w-fit mb-3`}>
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      )}

      {!loading && analytics.totalVideos === 0 && (
        <Card className="p-8 md:p-12 text-center card-glass">
          <BarChart3 className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h4 className="text-lg md:text-xl font-semibold mb-2">No Data Yet</h4>
          <p className="text-sm md:text-base text-muted-foreground">
            Start uploading videos to see your analytics
          </p>
        </Card>
      )}
    </div>
  );
};

export default YouTubeAnalytics;
