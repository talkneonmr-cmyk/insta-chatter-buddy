import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Image, Star, StarOff, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Thumbnail {
  id: string;
  title: string;
  thumbnail_url: string;
  style: string;
  created_at: string;
  is_favorite: boolean;
}

const ThumbnailHistory = () => {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchThumbnails = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('generated_thumbnails')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setThumbnails(data || []);
    } catch (error) {
      console.error('Error fetching thumbnails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThumbnails();

    // Set up realtime subscription
    const channel = supabase
      .channel('thumbnails-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generated_thumbnails'
        },
        () => {
          fetchThumbnails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('generated_thumbnails')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;

      setThumbnails(prev => 
        prev.map(t => t.id === id ? { ...t, is_favorite: !currentFavorite } : t)
      );

      toast({
        title: currentFavorite ? "Removed from favorites" : "Added to favorites"
      });
    } catch (error) {
      toast({
        title: "Error updating favorite",
        variant: "destructive"
      });
    }
  };

  const deleteThumbnail = async (id: string, thumbnailUrl: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('generated_thumbnails')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // Extract file path from URL and delete from storage
      const urlParts = thumbnailUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const { data: { session } } = await supabase.auth.getSession();
      const filePath = `${session?.user.id}/${fileName}`;

      await supabase.storage
        .from('thumbnails')
        .remove([filePath]);

      setThumbnails(prev => prev.filter(t => t.id !== id));

      toast({
        title: "Thumbnail deleted"
      });
    } catch (error) {
      toast({
        title: "Error deleting thumbnail",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading history...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No thumbnails yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Generate your first AI thumbnail to see it here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Thumbnail History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {thumbnails.map((thumbnail) => (
            <div key={thumbnail.id} className="group relative">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border-2 border-transparent group-hover:border-primary/50 transition-all">
                <img 
                  src={thumbnail.thumbnail_url} 
                  alt={thumbnail.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{thumbnail.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(thumbnail.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleFavorite(thumbnail.id, thumbnail.is_favorite)}
                  >
                    {thumbnail.is_favorite ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = thumbnail.thumbnail_url;
                      link.download = `${thumbnail.title}.png`;
                      link.click();
                    }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteThumbnail(thumbnail.id, thumbnail.thumbnail_url)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThumbnailHistory;
