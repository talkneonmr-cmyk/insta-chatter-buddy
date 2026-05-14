import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Edit, Trash2, Copy, Film, Video as VideoIcon, Eye, ThumbsUp, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
  durationSec?: number;
  isShort?: boolean;
}

const YouTubeVideoManager = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 10000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('youtube-list-videos');
      
      if (error) throw error;
      
      clearTimeout(timeout);
      setVideos(data.videos || []);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo) return;

    try {
      const { error } = await supabase.functions.invoke('youtube-update-video', {
        body: {
          videoId: editingVideo.id,
          title: editTitle,
          description: editDescription,
        }
      });

      if (error) throw error;
      
      // Increment YouTube operations usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_operations' }
      });
      
      toast.success('Video updated successfully');
      setEditingVideo(null);
      fetchVideos();
    } catch (error: any) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    }
  };

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isShort = (v: Video) =>
    typeof v.isShort === "boolean"
      ? v.isShort
      : (v.durationSec ?? 0) > 0 && (v.durationSec ?? 0) <= 60;

  const shorts = filteredVideos.filter(isShort);
  const longs = filteredVideos.filter((v) => !isShort(v));

  const formatDuration = (sec?: number) => {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const renderCard = (video: Video) => (
    <Card key={video.id} className="p-4">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-40 h-24 object-cover rounded"
          />
          {video.durationSec ? (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
              {formatDuration(video.durationSec)}
            </span>
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{video.title}</h3>
            {isShort(video) && (
              <Badge variant="secondary" className="shrink-0">
                <Film className="h-3 w-3 mr-1" /> Short
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {video.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {parseInt(video.viewCount || "0").toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {parseInt(video.likeCount || "0").toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {parseInt(video.commentCount || "0").toLocaleString()}
            </span>
            <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(video)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.id}`);
              toast.success("Video link copied to clipboard");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const emptyState = (label: string) => (
    <div className="text-center py-8 text-sm text-muted-foreground">
      No {label} found.
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All <Badge variant="secondary" className="ml-2">{filteredVideos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shorts">
            <Film className="h-3 w-3 mr-1" /> Shorts
            <Badge variant="secondary" className="ml-2">{shorts.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="long">
            <VideoIcon className="h-3 w-3 mr-1" /> Long
            <Badge variant="secondary" className="ml-2">{longs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {filteredVideos.length === 0 ? emptyState("videos") : filteredVideos.map(renderCard)}
        </TabsContent>
        <TabsContent value="shorts" className="mt-4 space-y-4">
          {shorts.length === 0 ? emptyState("Shorts") : shorts.map(renderCard)}
        </TabsContent>
        <TabsContent value="long" className="mt-4 space-y-4">
          {longs.length === 0 ? emptyState("long videos") : longs.map(renderCard)}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVideo(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YouTubeVideoManager;
