import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { format } from "date-fns";

interface ScheduledVideo {
  id: string;
  title: string;
  description: string | null;
  scheduled_for: string;
  status: string;
  privacy_status: string;
  youtube_video_id: string | null;
  created_at: string;
}

const ScheduledVideosList = () => {
  const [videos, setVideos] = useState<ScheduledVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('scheduled_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching scheduled videos:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== id));
      toast({
        title: "Success",
        description: "Scheduled video deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const handleUploadNow = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('youtube-upload', {
        body: { scheduledVideoId: id }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video upload initiated!",
      });
      
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading scheduled videos...</div>;
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No scheduled videos yet</p>
        <p className="text-sm text-muted-foreground">Schedule your first video upload</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <Card key={video.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(video.status)}
                <h4 className="font-semibold">{video.title}</h4>
              </div>
              
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(video.scheduled_for), 'MMM dd, yyyy hh:mm a')}
                </Badge>
                <Badge variant={video.status === 'uploaded' ? 'default' : 'secondary'}>
                  {video.status}
                </Badge>
                <Badge variant="outline">{video.privacy_status}</Badge>
              </div>

              {video.youtube_video_id && (
                <a
                  href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on YouTube
                </a>
              )}
            </div>

            <div className="flex gap-2">
              {video.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUploadNow(video.id)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Now
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(video.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ScheduledVideosList;