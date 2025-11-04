import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { Video, Sparkles, Youtube, Music, Crown, Image, FileText, TrendingUp, Hash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UsageData {
  video_uploads_count: number;
  ai_captions_count: number;
  youtube_channels_count: number;
  ai_music_count: number;
  ai_thumbnails_count: number;
  ai_scripts_count: number;
  ai_trends_count: number;
  ai_hashtags_count: number;
  ai_seo_count: number;
}

const PLAN_LIMITS = {
  free: {
    video_uploads: 4,      // 4 per day
    ai_captions: 4,        // 4 per day
    youtube_channels: 4,   // 4 channels
    ai_music: 4,           // 4 per day
    ai_thumbnails: 4,      // 4 per day
    ai_scripts: 4,         // 4 per day
    ai_trends: 4,          // 4 per day
    ai_hashtags: 4,        // 4 per day
    ai_seo: 4,             // 4 per day
  },
  pro: {
    video_uploads: -1,
    ai_captions: -1,
    youtube_channels: -1,
    ai_music: 200,         // 200 per day
    ai_thumbnails: 10,     // 10 per day
    ai_scripts: -1,        // unlimited
    ai_trends: 20,         // 20 per day
    ai_hashtags: 20,       // 20 per day
    ai_seo: 20,            // 20 per day
  },
};

export default function UsageStats() {
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();

    // Set up real-time subscription for usage updates
    const channel = supabase
      .channel('usage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_tracking',
        },
        () => {
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("usage_tracking")
        .select("video_uploads_count, ai_captions_count, youtube_channels_count, ai_music_count, ai_thumbnails_count, ai_scripts_count, ai_trends_count, ai_hashtags_count, ai_seo_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching usage:", error);
        return;
      }

      if (!data) {
        // Create usage tracking if it doesn't exist
        const { error: insertError } = await supabase
          .from("usage_tracking")
          .insert({ user_id: user.id });
        
        if (insertError) {
          console.error("Error creating usage tracking:", insertError);
        }
        
        setUsage({
          video_uploads_count: 0,
          ai_captions_count: 0,
          youtube_channels_count: 0,
          ai_music_count: 0,
          ai_thumbnails_count: 0,
          ai_scripts_count: 0,
          ai_trends_count: 0,
          ai_hashtags_count: 0,
          ai_seo_count: 0,
        });
        return;
      }

      setUsage({
        video_uploads_count: data.video_uploads_count || 0,
        ai_captions_count: data.ai_captions_count || 0,
        youtube_channels_count: data.youtube_channels_count || 0,
        ai_music_count: data.ai_music_count || 0,
        ai_thumbnails_count: data.ai_thumbnails_count || 0,
        ai_scripts_count: data.ai_scripts_count || 0,
        ai_trends_count: data.ai_trends_count || 0,
        ai_hashtags_count: data.ai_hashtags_count || 0,
        ai_seo_count: data.ai_seo_count || 0,
      });
    } catch (error) {
      console.error("Error in fetchUsage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const isUnlimited = (limit: number) => limit === -1;
  const getPercentage = (used: number, limit: number) => {
    if (isUnlimited(limit)) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const UsageItem = ({
    icon: Icon,
    label,
    used,
    limit,
    color,
  }: {
    icon: any;
    label: string;
    used: number;
    limit: number;
    color: string;
  }) => {
    const percentage = getPercentage(used, limit);
    const isAtLimit = !isUnlimited(limit) && used >= limit;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {used} / {isUnlimited(limit) ? "∞" : limit}
          </span>
        </div>
        {!isUnlimited(limit) && (
          <div className="space-y-1">
            <Progress value={percentage} className="h-2" />
            {isAtLimit && (
              <p className="text-xs text-destructive">Limit reached - Upgrade to continue</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="card-3d border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Your Usage
              {plan === "pro" && <Crown className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            <CardDescription>
              {plan === "free" ? "Free Plan" : "Pro Plan"} - Current month usage
            </CardDescription>
          </div>
          {plan === "free" && (
            <Button size="sm" variant="gradient" onClick={() => navigate("/pricing")}>
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <UsageItem
          icon={Video}
          label="Video Uploads"
          used={usage?.video_uploads_count || 0}
          limit={limits.video_uploads}
          color="text-red-500"
        />
        <UsageItem
          icon={Sparkles}
          label="AI Captions"
          used={usage?.ai_captions_count || 0}
          limit={limits.ai_captions}
          color="text-primary"
        />
        <UsageItem
          icon={Image}
          label="AI Thumbnails (Daily)"
          used={usage?.ai_thumbnails_count || 0}
          limit={limits.ai_thumbnails}
          color="text-purple-500"
        />
        <UsageItem
          icon={FileText}
          label="AI Scripts (Daily)"
          used={usage?.ai_scripts_count || 0}
          limit={limits.ai_scripts}
          color="text-blue-500"
        />
        <UsageItem
          icon={Youtube}
          label="YouTube Channels"
          used={usage?.youtube_channels_count || 0}
          limit={limits.youtube_channels}
          color="text-red-600"
        />
        <UsageItem
          icon={Music}
          label="AI Music (Daily)"
          used={usage?.ai_music_count || 0}
          limit={limits.ai_music}
          color="text-pink-500"
        />
        <UsageItem
          icon={TrendingUp}
          label="AI Trend Analyses (Daily)"
          used={usage?.ai_trends_count || 0}
          limit={limits.ai_trends}
          color="text-orange-500"
        />
        <UsageItem
          icon={Hash}
          label="AI Hashtags (Daily)"
          used={usage?.ai_hashtags_count || 0}
          limit={limits.ai_hashtags}
          color="text-indigo-500"
        />
        <UsageItem
          icon={Search}
          label="AI SEO (Daily)"
          used={usage?.ai_seo_count || 0}
          limit={limits.ai_seo}
          color="text-green-500"
        />

        {plan === "free" && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Free Plan: 4 uses per day for all features. Upgrade to Pro for more: 10 thumbnails/day, unlimited scripts/captions/uploads, 200 music/day, 20 trends/hashtags/SEO per day!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
