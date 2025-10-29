import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Download, Heart, Trash2, Search, Filter, Loader2 } from "lucide-react";
import { format } from "date-fns";
import EnhancedAudioPlayer from "./EnhancedAudioPlayer";

interface MusicGeneration {
  id: string;
  title: string;
  prompt: string;
  lyrics: string;
  tags: string[];
  bpm: number;
  instrumental: boolean;
  output_format: string;
  audio_urls: string[];
  generation_time_ms: number;
  is_favorite: boolean;
  created_at: string;
}

export default function MusicHistory() {
  const [generations, setGenerations] = useState<MusicGeneration[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<MusicGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerations();
  }, []);

  useEffect(() => {
    filterGenerations();
  }, [generations, searchQuery, showFavoritesOnly, selectedFormat]);

  const fetchGenerations = async () => {
    try {
      const { data, error } = await supabase
        .from("music_generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGenerations(data || []);
    } catch (error) {
      console.error("Error fetching generations:", error);
      toast({
        title: "Error",
        description: "Failed to load music history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterGenerations = () => {
    let filtered = [...generations];

    if (searchQuery) {
      filtered = filtered.filter(
        (gen) =>
          gen.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gen.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter((gen) => gen.is_favorite);
    }

    if (selectedFormat) {
      filtered = filtered.filter((gen) => gen.output_format === selectedFormat);
    }

    setFilteredGenerations(filtered);
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("music_generations")
        .update({ is_favorite: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setGenerations(
        generations.map((gen) =>
          gen.id === id ? { ...gen, is_favorite: !currentStatus } : gen
        )
      );

      toast({
        title: currentStatus ? "Removed from favorites" : "Added to favorites",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const deleteGeneration = async (id: string) => {
    try {
      const { error } = await supabase
        .from("music_generations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setGenerations(generations.filter((gen) => gen.id !== id));
      toast({
        title: "Deleted",
        description: "Music generation has been deleted",
      });
    } catch (error) {
      console.error("Error deleting generation:", error);
      toast({
        title: "Error",
        description: "Failed to delete generation",
        variant: "destructive",
      });
    }
  };

  const downloadAudio = (url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.mp3`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formats = [...new Set(generations.map((g) => g.output_format))];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Music Library
        </h3>
        <p className="text-muted-foreground">
          All your generated music in one place
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className="gap-2"
        >
          <Heart className="h-4 w-4" />
          Favorites
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedFormat(null)}
            className={!selectedFormat ? "bg-primary/10" : ""}
          >
            All
          </Button>
          {formats.map((format) => (
            <Button
              key={format}
              variant="outline"
              onClick={() => setSelectedFormat(format)}
              className={selectedFormat === format ? "bg-primary/10" : ""}
            >
              {format.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {filteredGenerations.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchQuery || showFavoritesOnly || selectedFormat
              ? "No music found matching your filters"
              : "No music generated yet. Start creating!"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGenerations.map((generation) => (
            <Card key={generation.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold mb-2">{generation.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {format(new Date(generation.created_at), "PPP 'at' p")}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {generation.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {generation.bpm && <span>{generation.bpm} BPM</span>}
                      <span>{generation.output_format.toUpperCase()}</span>
                      <span>{generation.instrumental ? "Instrumental" : "With Vocals"}</span>
                      {generation.generation_time_ms && (
                        <span>{(generation.generation_time_ms / 1000).toFixed(1)}s</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant={generation.is_favorite ? "default" : "outline"}
                      onClick={() => toggleFavorite(generation.id, generation.is_favorite)}
                    >
                      <Heart className={`h-4 w-4 ${generation.is_favorite ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => deleteGeneration(generation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {generation.audio_urls && generation.audio_urls.length > 0 && (
                  <div className="space-y-3">
                    {generation.audio_urls.map((url, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <EnhancedAudioPlayer src={url} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadAudio(url, `${generation.title}-${index + 1}`)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
