import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/useSubscription";
import { Video, Sparkles, Youtube, Music, Crown, Image, FileText, TrendingUp, Hash, Search, Mic, Volume2, UserCircle, Languages, AudioLines, Eraser, Wand2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UsageData {
  video_uploads_count: number;
  ai_captions_count: number;
  youtube_channels_count: number;
  youtube_operations_count: number;
  ai_music_count: number;
  ai_thumbnails_count: number;
  ai_scripts_count: number;
  ai_trends_count: number;
  ai_hashtags_count: number;
  ai_seo_count: number;
  ai_speech_to_text_count: number;
  ai_text_to_speech_count: number;
  ai_voice_cloning_count: number;
  ai_dubbing_count: number;
  ai_background_removal_count: number;
  ai_image_enhancement_count: number;
  ai_text_summarizer_count: number;
  ai_shorts_packages_count: number;
}

const PLAN_LIMITS = {
  free: {
    video_uploads: 3,
    ai_captions: 4,
    youtube_channels: 4,
    youtube_operations: 20,
    ai_music: 4,
    ai_thumbnails: 4,
    ai_scripts: 4,
    ai_trends: 4,
    ai_hashtags: 4,
    ai_seo: 4,
    ai_speech_to_text: 4,
    ai_text_to_speech: 4,
    ai_voice_cloning: 4,
    ai_dubbing: 4,
    ai_background_removal: 4,
    ai_image_enhancement: 4,
    ai_text_summarizer: 4,
    ai_shorts_packages: 4,
  },
  pro: {
    video_uploads: -1,
    ai_captions: -1,
    youtube_channels: -1,
    youtube_operations: -1,
    ai_music: 200,
    ai_thumbnails: 10,
    ai_scripts: -1,
    ai_trends: 20,
    ai_hashtags: 20,
    ai_seo: 20,
    ai_speech_to_text: 20,
    ai_text_to_speech: 20,
    ai_voice_cloning: 20,
    ai_dubbing: 20,
    ai_background_removal: 20,
    ai_image_enhancement: 20,
    ai_text_summarizer: 20,
    ai_shorts_packages: 20,
  },
};

export default function UsageStats() {
  const { plan, isLoading: planLoading } = useSubscription();
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
        .select("video_uploads_count, ai_captions_count, youtube_channels_count, youtube_operations_count, ai_music_count, ai_thumbnails_count, ai_scripts_count, ai_trends_count, ai_hashtags_count, ai_seo_count, ai_speech_to_text_count, ai_text_to_speech_count, ai_voice_cloning_count, ai_dubbing_count, ai_background_removal_count, ai_image_enhancement_count, ai_text_summarizer_count, ai_shorts_packages_count")
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
          youtube_operations_count: 0,
          ai_music_count: 0,
          ai_thumbnails_count: 0,
          ai_scripts_count: 0,
          ai_trends_count: 0,
          ai_hashtags_count: 0,
          ai_seo_count: 0,
          ai_speech_to_text_count: 0,
          ai_text_to_speech_count: 0,
          ai_voice_cloning_count: 0,
          ai_dubbing_count: 0,
          ai_background_removal_count: 0,
          ai_image_enhancement_count: 0,
          ai_text_summarizer_count: 0,
          ai_shorts_packages_count: 0,
        });
        return;
      }

      setUsage({
        video_uploads_count: data.video_uploads_count || 0,
        ai_captions_count: data.ai_captions_count || 0,
        youtube_channels_count: data.youtube_channels_count || 0,
        youtube_operations_count: data.youtube_operations_count || 0,
        ai_music_count: data.ai_music_count || 0,
        ai_thumbnails_count: data.ai_thumbnails_count || 0,
        ai_scripts_count: data.ai_scripts_count || 0,
        ai_trends_count: data.ai_trends_count || 0,
        ai_hashtags_count: data.ai_hashtags_count || 0,
        ai_seo_count: data.ai_seo_count || 0,
        ai_speech_to_text_count: data.ai_speech_to_text_count || 0,
        ai_text_to_speech_count: data.ai_text_to_speech_count || 0,
        ai_voice_cloning_count: data.ai_voice_cloning_count || 0,
        ai_dubbing_count: data.ai_dubbing_count || 0,
        ai_background_removal_count: data.ai_background_removal_count || 0,
        ai_image_enhancement_count: data.ai_image_enhancement_count || 0,
        ai_text_summarizer_count: data.ai_text_summarizer_count || 0,
        ai_shorts_packages_count: data.ai_shorts_packages_count || 0,
      });
    } catch (error) {
      console.error("Error in fetchUsage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || planLoading) {
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
              <p className="text-xs text-destructive">Daily limit reached - Check back tomorrow!</p>
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
              {plan === "free" ? "Free Plan - Daily limits reset every 24 hours" : "Pro Plan - Daily usage"}
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
          label="Video Uploads (Daily)"
          used={usage?.video_uploads_count || 0}
          limit={limits.video_uploads}
          color="text-red-500"
        />
        <UsageItem
          icon={Sparkles}
          label="AI Captions (Daily)"
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
          icon={Youtube}
          label="YouTube Operations (Daily)"
          used={usage?.youtube_operations_count || 0}
          limit={limits.youtube_operations}
          color="text-red-500"
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
        <UsageItem
          icon={Mic}
          label="AI Speech to Text (Daily)"
          used={usage?.ai_speech_to_text_count || 0}
          limit={limits.ai_speech_to_text}
          color="text-cyan-500"
        />
        <UsageItem
          icon={Volume2}
          label="AI Text to Speech (Daily)"
          used={usage?.ai_text_to_speech_count || 0}
          limit={limits.ai_text_to_speech}
          color="text-teal-500"
        />
        <UsageItem
          icon={UserCircle}
          label="AI Voice Cloning (Daily)"
          used={usage?.ai_voice_cloning_count || 0}
          limit={limits.ai_voice_cloning}
          color="text-violet-500"
        />
        <UsageItem
          icon={Languages}
          label="AI Dubbing (Daily)"
          used={usage?.ai_dubbing_count || 0}
          limit={limits.ai_dubbing}
          color="text-amber-500"
        />
        <UsageItem
          icon={Eraser}
          label="AI Background Removal (Daily)"
          used={usage?.ai_background_removal_count || 0}
          limit={limits.ai_background_removal}
          color="text-lime-500"
        />
        <UsageItem
          icon={Wand2}
          label="AI Image Enhancement (Daily)"
          used={usage?.ai_image_enhancement_count || 0}
          limit={limits.ai_image_enhancement}
          color="text-fuchsia-500"
        />
        <UsageItem
          icon={BookOpen}
          label="AI Text Summarizer (Daily)"
          used={usage?.ai_text_summarizer_count || 0}
          limit={limits.ai_text_summarizer}
          color="text-sky-500"
        />
        <UsageItem
          icon={Sparkles}
          label="AI Shorts Packages (Daily)"
          used={usage?.ai_shorts_packages_count || 0}
          limit={limits.ai_shorts_packages}
          color="text-purple-500"
        />

        {plan === "free" && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Free Plan: Daily limits reset every 24 hours automatically. YouTube Operations include uploads, analytics, bulk updates, playlists, and video management. Upgrade to Pro for more: 10 thumbnails/day, unlimited scripts/captions/uploads/YouTube operations, 200 music/day, 20 trends/hashtags/SEO per day!
            </p>
          </div>
        )}
        
        {plan === "pro" && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Pro Plan Active ✨ Daily limits reset every 24 hours. Billing cycle resets monthly.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
