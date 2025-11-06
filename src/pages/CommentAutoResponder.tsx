import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, CheckCircle, XCircle, AlertCircle, ArrowLeft, Video, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default function CommentAutoResponder() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    response_style: "friendly",
    custom_instructions: "",
    blacklist_keywords: [] as string[],
    min_comment_length: 10,
    reply_delay_minutes: 5,
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, replied: 0, skipped: 0, failed: 0 });
  const [videos, setVideos] = useState<any[]>([]);
  const [monitoredVideos, setMonitoredVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSettings();
    loadLogs();
    loadMonitoredVideos();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('youtube_comment_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          enabled: data.enabled,
          response_style: data.response_style,
          custom_instructions: data.custom_instructions || "",
          blacklist_keywords: data.blacklist_keywords || [],
          min_comment_length: data.min_comment_length,
          reply_delay_minutes: data.reply_delay_minutes,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('youtube_comment_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setLogs(data || []);

      const total = data?.length || 0;
      const replied = data?.filter(l => l.status === 'replied').length || 0;
      const skipped = data?.filter(l => l.status === 'skipped').length || 0;
      const failed = data?.filter(l => l.status === 'failed').length || 0;

      setStats({ total, replied, skipped, failed });
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('youtube_comment_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.blacklist_keywords.includes(newKeyword.trim())) {
      setSettings({
        ...settings,
        blacklist_keywords: [...settings.blacklist_keywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setSettings({
      ...settings,
      blacklist_keywords: settings.blacklist_keywords.filter(k => k !== keyword),
    });
  };

  const loadMonitoredVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('youtube_monitored_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMonitoredVideos(data || []);
    } catch (error) {
      console.error('Error loading monitored videos:', error);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-list-videos');

      if (error) throw error;

      setVideos(data?.videos || []);
      toast({
        title: "Success",
        description: "Videos loaded successfully",
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load videos",
      });
    } finally {
      setLoadingVideos(false);
    }
  };

  const addMonitoredVideo = async () => {
    if (selectedVideos.size === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one video",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const videosToAdd = videos
        .filter(v => selectedVideos.has(v.id))
        .map(v => ({
          user_id: user.id,
          video_id: v.id,
          video_title: v.title,
          thumbnail_url: v.thumbnailUrl,
        }));

      const { error } = await supabase
        .from('youtube_monitored_videos')
        .insert(videosToAdd);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${videosToAdd.length} video(s) to monitoring`,
      });

      setSelectedVideos(new Set());
      setVideos([]);
      loadMonitoredVideos();
    } catch (error) {
      console.error('Error adding monitored videos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add videos",
      });
    }
  };

  const removeMonitoredVideo = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('youtube_monitored_videos')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video removed from monitoring",
      });

      loadMonitoredVideos();
    } catch (error) {
      console.error('Error removing monitored video:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove video",
      });
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/youtube-manager")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to YouTube Manager
        </Button>
        <h1 className="text-4xl font-bold mb-2">AI Comment Auto-Responder</h1>
        <p className="text-muted-foreground">
          Automatically respond to YouTube comments with AI-powered replies
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Processed</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Replied</div>
          <div className="text-2xl font-bold text-green-500">{stats.replied}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Skipped</div>
          <div className="text-2xl font-bold text-yellow-500">{stats.skipped}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
        </Card>
      </div>

      {/* Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Auto-Responder</Label>
              <p className="text-sm text-muted-foreground">
                Automatically respond to new comments every 5 minutes
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {/* Response Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Response Style</Label>
            <Select
              value={settings.response_style}
              onValueChange={(value) => setSettings({ ...settings, response_style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="E.g., Always mention my new merch store, Keep responses under 50 characters..."
              value={settings.custom_instructions}
              onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
              rows={3}
            />
          </div>

          {/* Blacklist Keywords */}
          <div className="space-y-2">
            <Label>Blacklist Keywords</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Don't reply to comments containing these words
            </p>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.blacklist_keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>

          {/* Min Comment Length */}
          <div className="space-y-2">
            <Label htmlFor="minLength">Minimum Comment Length</Label>
            <Input
              id="minLength"
              type="number"
              min="1"
              value={settings.min_comment_length}
              onChange={(e) => setSettings({ ...settings, min_comment_length: parseInt(e.target.value) })}
            />
            <p className="text-sm text-muted-foreground">
              Skip comments shorter than this many characters
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>
      </Card>

      {/* Video Selection */}
      <Card className="p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Monitored Videos</h2>
        <p className="text-muted-foreground mb-4">
          Select specific videos to monitor for comments. If no videos are selected, the system will monitor your 5 most recent videos.
        </p>

        {/* Currently Monitored Videos */}
        {monitoredVideos.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Currently Monitoring ({monitoredVideos.length} videos):</h3>
            <div className="space-y-2">
              {monitoredVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {video.thumbnail_url && (
                    <img src={video.thumbnail_url} alt={video.video_title} className="w-20 h-14 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.video_title}</p>
                    <p className="text-sm text-muted-foreground">Video ID: {video.video_id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMonitoredVideo(video.video_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Videos */}
        <div className="space-y-4">
          <Button onClick={fetchVideos} disabled={loadingVideos}>
            {loadingVideos ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Videos...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Load My Videos
              </>
            )}
          </Button>

          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer" onClick={() => toggleVideoSelection(video.id)}>
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={() => toggleVideoSelection(video.id)}
                      className="mt-1 h-4 w-4 rounded border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {video.thumbnailUrl && (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-20 h-14 object-cover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.viewCount} views</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={addMonitoredVideo} disabled={selectedVideos.size === 0}>
                Add Selected Videos ({selectedVideos.size})
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Activity Log */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity yet. Enable auto-responder to start!</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Reply</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.status === 'replied' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Replied
                      </Badge>
                    )}
                    {log.status === 'skipped' && (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" /> Skipped
                      </Badge>
                    )}
                    {log.status === 'failed' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" /> Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{log.comment_text}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.reply_text || log.skip_reason || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
