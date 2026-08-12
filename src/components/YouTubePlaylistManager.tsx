import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, List, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  itemCount: number;
}

const YouTubePlaylistManager = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 10000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('youtube-list-playlists');
      
      if (error) throw error;
      
      clearTimeout(timeout);
      setPlaylists(data.playlists || []);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a playlist title');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('youtube-create-playlist', {
        body: {
          title: newTitle,
          description: newDescription,
        }
      });

      if (error) throw error;
      
      // Increment YouTube operations usage
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'youtube_operations' }
      });
      
      toast.success('Playlist created successfully');
      setShowCreate(false);
      setNewTitle("");
      setNewDescription("");
      fetchPlaylists();
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
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

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowCreate(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Playlist
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <Card key={playlist.id} className="p-4">
            <img
              src={playlist.thumbnailUrl}
              alt={playlist.title}
              className="w-full h-40 object-cover rounded mb-4"
            />
            <h3 className="font-semibold mb-2">{playlist.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {playlist.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <List className="h-4 w-4" />
                {playlist.itemCount} videos
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`https://youtube.com/playlist?list=${playlist.id}`);
                  toast.success("Playlist link copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter playlist title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter playlist description"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlaylist} disabled={creating}>
              {creating ? "Creating..." : "Create Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YouTubePlaylistManager;
