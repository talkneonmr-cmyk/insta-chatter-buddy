import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { Video, Sparkles, Youtube, Music, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UsageData {
  video_uploads_count: number;
  ai_captions_count: number;
  youtube_channels_count: number;
}

const PLAN_LIMITS = {
  free: {
    video_uploads: 5,
    ai_captions: 10,
    youtube_channels: 1,
    music_generations: 0,
  },
  pro: {
    video_uploads: -1, // unlimited
    ai_captions: -1,
    youtube_channels: 3,
    music_generations: -1,
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
        .select("video_uploads_count, ai_captions_count, youtube_channels_count")
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
        });
        return;
      }

      setUsage(data);
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
          icon={Youtube}
          label="YouTube Channels"
          used={usage?.youtube_channels_count || 0}
          limit={limits.youtube_channels}
          color="text-red-600"
        />
        {plan === "pro" && (
          <UsageItem
            icon={Music}
            label="Music Generations"
            used={0}
            limit={limits.music_generations}
            color="text-purple-500"
          />
        )}

        {plan === "free" && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Want unlimited access? Upgrade to Pro for just ₹699/month
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
