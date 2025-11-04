import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Eye, Users, Video, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface ChannelStats {
  viewCount: string;
  subscriberCount: string;
  videoCount: string;
  title: string;
  customUrl?: string;
}

const YouTubeChannelAnalytics = () => {
  const [stats, setStats] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannelAnalytics();
  }, []);

  const fetchChannelAnalytics = async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 10000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('youtube_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!account) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('youtube-analytics', {
        body: { channelId: account.channel_id }
      });

      if (error) throw error;
      
      clearTimeout(timeout);
      setStats(data);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load channel analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="p-6 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Connect your YouTube account to view analytics</p>
      </Card>
    );
  }

  const statCards = [
    { icon: Eye, label: "Total Views", value: parseInt(stats.viewCount).toLocaleString(), color: "text-blue-500" },
    { icon: Users, label: "Subscribers", value: parseInt(stats.subscriberCount).toLocaleString(), color: "text-green-500" },
    { icon: Video, label: "Total Videos", value: parseInt(stats.videoCount).toLocaleString(), color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{stats.title}</h2>
        {stats.customUrl && (
          <p className="text-muted-foreground">{stats.customUrl}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`p-2 md:p-3 rounded-lg bg-muted ${stat.color} shrink-0`}>
                <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold break-all">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Channel Performance</h3>
        </div>
        <p className="text-muted-foreground">
          Your channel is performing well! Keep uploading quality content to grow your audience.
        </p>
      </Card>
    </div>
  );
};

export default YouTubeChannelAnalytics;
