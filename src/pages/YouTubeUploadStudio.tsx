import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Upload, Youtube, CheckCircle, AlertCircle, Sparkles, 
  Clock, Calendar, Trash2, Play, Settings, Film, Video, 
  Loader2, Plus, X, RefreshCw, Zap, FileVideo
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { format, addDays, setHours, setMinutes } from "date-fns";
import UsageResetCountdown from "@/components/UsageResetCountdown";

interface UploadedVideo {
  id: string;
  file: File;
  title: string;
  description: string;
  tags: string;
  isShort: boolean;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  privacyStatus: 'public' | 'private' | 'unlisted';
  scheduledFor: string | null;
  status: 'pending' | 'uploading' | 'scheduled' | 'error';
  progress: number;
  aiGenerated: boolean;
}

interface ChannelInfo {
  id: string;
  channel_title: string;
  channel_id: string;
}

interface ScheduledVideo {
  id: string;
  title: string;
  description: string | null;
  scheduled_for: string;
  status: string | null;
  privacy_status: string | null;
  youtube_video_id: string | null;
  upload_error: string | null;
}

interface ScheduleSettings {
  mode: 'auto' | 'manual';
  dailyTime: string;
  startDate: string;
  videosPerDay: number;
}

const YouTubeUploadStudio = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plan } = useSubscription();
  
  // Channel state
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [channelLoading, setChannelLoading] = useState(true);
  const [connectingChannel, setConnectingChannel] = useState(false);
  
  // Upload state
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  
  // Schedule settings
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    mode: 'auto',
    dailyTime: '10:00',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    videosPerDay: 1,
  });
  
  // Usage tracking
  const [channelsUsage, setChannelsUsage] = useState(0);
  const [resetAt, setResetAt] = useState("");
  
  // Scheduled videos from database
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  useEffect(() => {
    checkChannelConnection();
    fetchScheduledVideos();
    
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleOAuthCallback(code, state);
    }
  }, []);

  const fetchScheduledVideos = async () => {
    try {
      setLoadingScheduled(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_videos')
        .select('id, title, description, scheduled_for, status, privacy_status, youtube_video_id, upload_error')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true })
        .limit(50);

      if (!error && data) {
        setScheduledVideos(data);
      }
    } catch (error) {
      console.error('Error fetching scheduled videos:', error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  const checkChannelConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('youtube_accounts')
        .select('id, channel_title, channel_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setChannelInfo(data);
      }

      // Fetch usage
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('youtube_channels_count, reset_at')
        .eq('user_id', user.id)
        .single();

      if (usageData) {
        setChannelsUsage(usageData.youtube_channels_count || 0);
        setResetAt(usageData.reset_at || "");
      }
    } catch (error) {
      console.error('Error checking channel:', error);
    } finally {
      setChannelLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      setConnectingChannel(true);
      
      const { data, error } = await supabase.functions.invoke('youtube-oauth', {
        body: { code, state, redirectOrigin: window.location.origin },
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to connect');
      }

      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_channels' }
      });

      toast({
        title: "Channel Connected!",
        description: `Connected to: ${data.channelTitle}`,
      });

      await checkChannelConnection();
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnectingChannel(false);
    }
  };

  const handleConnectChannel = async () => {
    try {
      setConnectingChannel(true);
      
      const limits = plan === 'pro' ? -1 : 4;
      if (limits !== -1 && channelsUsage >= limits) {
        toast({
          title: "Daily Limit Reached",
          description: "Upgrade to Pro for unlimited channel connections!",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('youtube-oauth/auth-url', {
        body: { redirectOrigin: window.location.origin },
      });

      if (error) throw error;

      window.location.assign(data.authUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start connection",
        variant: "destructive",
      });
    } finally {
      setConnectingChannel(false);
    }
  };

  const handleDisconnectChannel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('youtube_accounts').delete().eq('user_id', user.id);
      setChannelInfo(null);
      toast({ title: "Channel Disconnected" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isShort: boolean) => {
    const files = Array.from(e.target.files || []);
    
    const newVideos: UploadedVideo[] = files.map((file, index) => {
      return {
        id: `${Date.now()}-${index}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        tags: '',
        isShort,
        thumbnailFile: null,
        thumbnailPreview: null,
        privacyStatus: 'public',
        scheduledFor: null,
        status: 'pending',
        progress: 0,
        aiGenerated: false,
      };
    });

    setVideos(prev => [...prev, ...newVideos]);
  };

  const updateVideo = (id: string, updates: Partial<UploadedVideo>) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleThumbnailSelect = (videoId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    updateVideo(videoId, { thumbnailFile: file, thumbnailPreview: preview });
  };

  const generateAIMetadata = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    setGeneratingAI(videoId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-metadata', {
        body: {
          videoTitle: video.title,
          videoDescription: video.description,
          videoContent: video.isShort ? 'Short-form vertical video for YouTube Shorts' : 'Long-form YouTube video',
        }
      });

      if (error) throw error;

      updateVideo(videoId, {
        title: data.title || video.title,
        description: data.description || video.description,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || video.tags,
        aiGenerated: true,
      });

      toast({ title: "AI Metadata Generated!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate metadata", variant: "destructive" });
    } finally {
      setGeneratingAI(null);
    }
  };

  const generateAllAIMetadata = async () => {
    for (const video of videos.filter(v => !v.aiGenerated)) {
      await generateAIMetadata(video.id);
    }
  };

  const calculateScheduleDates = useCallback(() => {
    const { dailyTime, startDate, videosPerDay, mode } = scheduleSettings;
    const [hours, minutes] = dailyTime.split(':').map(Number);
    
    return videos.map((video, index) => {
      if (mode === 'manual') {
        return video.scheduledFor;
      }
      
      const dayOffset = Math.floor(index / videosPerDay);
      const date = addDays(new Date(startDate), dayOffset);
      const scheduledDate = setMinutes(setHours(date, hours), minutes);
      
      return scheduledDate.toISOString();
    });
  }, [scheduleSettings, videos]);

  const applyAutoSchedule = () => {
    const scheduleDates = calculateScheduleDates();
    setVideos(prev => prev.map((v, i) => ({ ...v, scheduledFor: scheduleDates[i] || null })));
    toast({ title: "Schedule Applied", description: `${videos.length} videos scheduled` });
  };

  const handleScheduleAll = async () => {
    if (!channelInfo) {
      toast({ title: "Error", description: "Connect your YouTube channel first", variant: "destructive" });
      return;
    }

    if (videos.length === 0) {
      toast({ title: "Error", description: "Add videos to upload", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Apply schedule if in auto mode
      if (scheduleSettings.mode === 'auto') {
        applyAutoSchedule();
      }

      const scheduleDates = calculateScheduleDates();

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        updateVideo(video.id, { status: 'uploading', progress: 0 });

        try {
          // Upload video file
          const videoFileName = `${user.id}/${Date.now()}_${video.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('videos')
            .upload(videoFileName, video.file, { cacheControl: '3600', upsert: false });

          if (uploadError) throw uploadError;
          updateVideo(video.id, { progress: 50 });

          // Upload thumbnail if exists
          let thumbnailPath = null;
          if (video.thumbnailFile) {
            const thumbFileName = `${user.id}/${Date.now()}_thumb_${video.thumbnailFile.name}`;
            const { error: thumbError } = await supabase.storage
              .from('videos')
              .upload(thumbFileName, video.thumbnailFile, { cacheControl: '3600', upsert: false });
            
            if (!thumbError) {
              thumbnailPath = `videos/${thumbFileName}`;
            }
          }

          updateVideo(video.id, { progress: 75 });

          // Create scheduled video entry
          const tagsArray = video.tags ? video.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
          const scheduledFor = scheduleDates[i] || new Date().toISOString();

          await supabase.from('scheduled_videos').insert({
            user_id: user.id,
            youtube_account_id: channelInfo.id,
            title: video.title + (video.isShort ? ' #shorts' : ''),
            description: video.description,
            tags: tagsArray,
            category_id: video.isShort ? '22' : '22',
            privacy_status: video.privacyStatus,
            video_file_path: `videos/${videoFileName}`,
            thumbnail_path: thumbnailPath,
            scheduled_for: scheduledFor,
            ai_generated_metadata: video.aiGenerated,
          });

          await supabase.functions.invoke('increment-usage', {
            body: { usageType: 'video_uploads' }
          });

          updateVideo(video.id, { status: 'scheduled', progress: 100 });
        } catch (error) {
          console.error('Error uploading video:', error);
          updateVideo(video.id, { status: 'error', progress: 0 });
        }
      }

      const successCount = videos.filter(v => v.status === 'scheduled').length;
      toast({
        title: "Upload Complete!",
        description: `${successCount}/${videos.length} videos scheduled successfully`,
      });

      // Refresh the scheduled videos list
      fetchScheduledVideos();
      
      // Clear successfully uploaded videos from queue
      setVideos(prev => prev.filter(v => v.status !== 'scheduled'));

    } catch (error) {
      console.error('Error in batch upload:', error);
      toast({ title: "Error", description: "Upload failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const limits = plan === 'pro' ? -1 : 4;
  const isAtLimit = limits !== -1 && channelsUsage >= limits;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-3 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/youtube-manager")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Upload className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Upload Studio</h1>
              <p className="text-sm text-muted-foreground">Bulk upload & smart scheduling for YouTube</p>
            </div>
          </div>
        </div>

        {/* Channel Connection */}
        {channelLoading ? (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Youtube className="h-5 w-5 text-red-500 animate-pulse" />
              <p className="text-sm text-muted-foreground">Checking channel connection...</p>
            </div>
          </Card>
        ) : channelInfo ? (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected to YouTube</p>
                <p className="text-sm text-muted-foreground">Channel: {channelInfo.channel_title}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnectChannel}>
                Disconnect
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <Youtube className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Connect Your YouTube Channel</h3>
                  <p className="text-sm text-muted-foreground">Required to upload and schedule videos</p>
                  {isAtLimit && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="destructive">Limit Reached</Badge>
                      <UsageResetCountdown resetAt={resetAt} className="text-xs" />
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleConnectChannel} 
                disabled={connectingChannel || isAtLimit}
                className="bg-red-600 hover:bg-red-700"
              >
                {connectingChannel ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                ) : (
                  <><Youtube className="h-4 w-4 mr-2" />Connect Channel</>
                )}
              </Button>
            </div>
          </Card>
        )}

        {channelInfo && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Video Upload & List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upload Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    Add Videos
                  </CardTitle>
                  <CardDescription>
                    Choose the video type and upload single or multiple videos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shorts Upload */}
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-purple-500/50 rounded-lg cursor-pointer hover:bg-purple-500/10 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-3 bg-purple-500/10 rounded-full mb-3 group-hover:bg-purple-500/20 transition-colors">
                          <Film className="h-8 w-8 text-purple-500" />
                        </div>
                        <p className="text-sm font-semibold text-purple-600">Upload Shorts</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vertical videos (under 60 sec)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileSelect(e, true)}
                      />
                    </label>

                    {/* Long Video Upload */}
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-red-500/50 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="p-3 bg-red-500/10 rounded-full mb-3 group-hover:bg-red-500/20 transition-colors">
                          <Video className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-sm font-semibold text-red-600">Upload Long Videos</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Standard YouTube videos
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*"
                        multiple
                        onChange={(e) => handleFileSelect(e, false)}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Video List */}
              {videos.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Videos ({videos.length})</CardTitle>
                      <CardDescription>Configure each video's metadata</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generateAllAIMetadata}
                      disabled={generatingAI !== null}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Generate All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {videos.map((video, index) => (
                          <Card key={video.id} className="p-4 relative">
                            {video.status === 'uploading' && (
                              <Progress value={video.progress} className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" />
                            )}
                            
                            <div className="flex items-start gap-4">
                              {/* Video Info Column */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant={video.isShort ? "default" : "secondary"}>
                                    {video.isShort ? (
                                      <><Film className="h-3 w-3 mr-1" />Short</>
                                    ) : (
                                      <><Video className="h-3 w-3 mr-1" />Long</>
                                    )}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {video.file.name}
                                  </span>
                                  {video.status === 'scheduled' && (
                                    <Badge variant="outline" className="text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />Scheduled
                                    </Badge>
                                  )}
                                  {video.status === 'error' && (
                                    <Badge variant="destructive">
                                      <AlertCircle className="h-3 w-3 mr-1" />Error
                                    </Badge>
                                  )}
                                  {video.aiGenerated && (
                                    <Badge variant="outline" className="text-purple-600">
                                      <Sparkles className="h-3 w-3 mr-1" />AI
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid gap-3">
                                  <div>
                                    <Label className="text-xs">Title</Label>
                                    <Input
                                      value={video.title}
                                      onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                                      placeholder="Video title"
                                      className="mt-1"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs">Description</Label>
                                    <Textarea
                                      value={video.description}
                                      onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                                      placeholder="Video description..."
                                      rows={2}
                                      className="mt-1"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Tags</Label>
                                      <Input
                                        value={video.tags}
                                        onChange={(e) => updateVideo(video.id, { tags: e.target.value })}
                                        placeholder="tag1, tag2, tag3"
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Privacy</Label>
                                      <Select
                                        value={video.privacyStatus}
                                        onValueChange={(value: 'public' | 'private' | 'unlisted') => 
                                          updateVideo(video.id, { privacyStatus: value })
                                        }
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="public">Public</SelectItem>
                                          <SelectItem value="unlisted">Unlisted</SelectItem>
                                          <SelectItem value="private">Private</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Short/Long Toggle */}
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={video.isShort}
                                      onCheckedChange={(checked) => updateVideo(video.id, { isShort: checked })}
                                    />
                                    <Label className="text-xs">
                                      {video.isShort ? 'YouTube Short (vertical)' : 'Long-form video'}
                                    </Label>
                                  </div>

                                  {/* Thumbnail */}
                                  <div>
                                    <Label className="text-xs">Thumbnail</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {video.thumbnailPreview ? (
                                        <div className="relative">
                                          <img 
                                            src={video.thumbnailPreview} 
                                            alt="Thumbnail" 
                                            className="w-20 h-12 object-cover rounded"
                                          />
                                          <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 h-5 w-5"
                                            onClick={() => updateVideo(video.id, { thumbnailFile: null, thumbnailPreview: null })}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center w-20 h-12 border rounded cursor-pointer hover:bg-accent/50">
                                          <Plus className="h-4 w-4 text-muted-foreground" />
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) handleThumbnailSelect(video.id, file);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>

                                  {/* Manual Schedule (only in manual mode) */}
                                  {scheduleSettings.mode === 'manual' && (
                                    <div>
                                      <Label className="text-xs">Schedule For</Label>
                                      <Input
                                        type="datetime-local"
                                        value={video.scheduledFor ? format(new Date(video.scheduledFor), "yyyy-MM-dd'T'HH:mm") : ''}
                                        onChange={(e) => updateVideo(video.id, { scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                        className="mt-1"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => generateAIMetadata(video.id)}
                                  disabled={generatingAI === video.id}
                                  title="Generate AI Metadata"
                                >
                                  {generatingAI === video.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeVideo(video.id)}
                                  disabled={video.status === 'uploading'}
                                  title="Remove"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Scheduled Videos from Database */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Scheduled & Uploaded Videos
                    </CardTitle>
                    <CardDescription>Your videos in queue or already uploaded</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchScheduledVideos} disabled={loadingScheduled}>
                    <RefreshCw className={`h-4 w-4 ${loadingScheduled ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent>
                  {loadingScheduled ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : scheduledVideos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No scheduled videos yet</p>
                      <p className="text-xs mt-1">Upload videos above to schedule them</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {scheduledVideos.map((video) => (
                          <div 
                            key={video.id} 
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge 
                                  variant={
                                    video.status === 'uploaded' ? 'default' :
                                    video.status === 'processing' ? 'secondary' :
                                    video.status === 'failed' ? 'destructive' :
                                    'outline'
                                  }
                                  className={
                                    video.status === 'uploaded' ? 'bg-green-500' :
                                    video.status === 'processing' ? 'bg-yellow-500' :
                                    ''
                                  }
                                >
                                  {video.status === 'uploaded' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {video.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                  {video.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                                  {video.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                  {video.status === 'scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                                  {video.status || 'pending'}
                                </Badge>
                                {video.title.includes('#shorts') && (
                                  <Badge variant="outline" className="text-purple-600">
                                    <Film className="h-3 w-3 mr-1" />Short
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium text-sm truncate">{video.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(video.scheduled_for), 'MMM dd, yyyy h:mm a')}
                              </p>
                              {video.upload_error && (
                                <p className="text-xs text-destructive mt-1">{video.upload_error}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              {video.youtube_video_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`https://youtube.com/watch?v=${video.youtube_video_id}`, '_blank')}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Watch
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Schedule Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Schedule Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode Toggle */}
                  <Tabs 
                    value={scheduleSettings.mode} 
                    onValueChange={(v) => setScheduleSettings(prev => ({ ...prev, mode: v as 'auto' | 'manual' }))}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="auto">
                        <Zap className="h-4 w-4 mr-2" />
                        Auto
                      </TabsTrigger>
                      <TabsTrigger value="manual">
                        <Calendar className="h-4 w-4 mr-2" />
                        Manual
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="auto" className="space-y-4 mt-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={scheduleSettings.startDate}
                          onChange={(e) => setScheduleSettings(prev => ({ ...prev, startDate: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Daily Upload Time</Label>
                        <Input
                          type="time"
                          value={scheduleSettings.dailyTime}
                          onChange={(e) => setScheduleSettings(prev => ({ ...prev, dailyTime: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Videos Per Day</Label>
                        <Select
                          value={String(scheduleSettings.videosPerDay)}
                          onValueChange={(v) => setScheduleSettings(prev => ({ ...prev, videosPerDay: Number(v) }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 video/day</SelectItem>
                            <SelectItem value="2">2 videos/day</SelectItem>
                            <SelectItem value="3">3 videos/day</SelectItem>
                            <SelectItem value="5">5 videos/day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={applyAutoSchedule}
                        disabled={videos.length === 0}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Preview Schedule
                      </Button>

                      {videos.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-medium mb-2">Schedule Preview:</p>
                          <div className="space-y-1 text-xs text-muted-foreground max-h-32 overflow-auto">
                            {calculateScheduleDates().slice(0, 5).map((date, i) => (
                              <div key={i} className="flex justify-between">
                                <span>Video {i + 1}</span>
                                <span>{date ? format(new Date(date), 'MMM dd, yyyy h:mm a') : 'Not set'}</span>
                              </div>
                            ))}
                            {videos.length > 5 && (
                              <p className="text-center pt-1">+ {videos.length - 5} more...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="manual" className="mt-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Set individual schedule times for each video in the video list.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  {/* Upload Button */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleScheduleAll}
                    disabled={isProcessing || videos.length === 0 || !channelInfo}
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Processing...</>
                    ) : (
                      <><Upload className="h-5 w-5 mr-2" />Schedule {videos.length} Video{videos.length !== 1 ? 's' : ''}</>
                    )}
                  </Button>

                  {videos.length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      Videos will be uploaded to your channel storage and published at scheduled times.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-2">
                  <p>• Use the purple button for Shorts, red for long videos</p>
                  <p>• Use AI to generate optimized titles & descriptions</p>
                  <p>• Schedule consistently for better algorithm performance</p>
                  <p>• Add custom thumbnails to increase click-through rate</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeUploadStudio;
