import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Music, Loader2, Play, Download } from "lucide-react";

export const MusicGeneratorForm = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [tags, setTags] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [numSongs, setNumSongs] = useState("1");
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  const checkStatus = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-audio-status", {
        body: { task_id: id },
      });

      if (error) throw error;

      setStatus(data.status);

      if (data.status === "SUCCESS" && data.song_paths) {
        setAudioUrls(data.song_paths);
        setIsGenerating(false);
        toast({
          title: "Success!",
          description: "Your music has been generated successfully.",
        });
      } else if (data.status === "FAILURE") {
        setIsGenerating(false);
        toast({
          title: "Generation Failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } else {
        // Still processing, check again in 3 seconds
        setTimeout(() => checkStatus(id), 3000);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to check generation status",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !tags && !lyrics) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a prompt, tags, or lyrics",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setAudioUrls([]);
    setStatus("RECEIVED");

    try {
      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          prompt: prompt || undefined,
          lyrics: lyrics || undefined,
          tags: tags ? tags.split(",").map(t => t.trim()) : undefined,
          instrumental,
          num_songs: parseInt(numSongs),
          output_format: outputFormat,
        },
      });

      if (error) throw error;

      if (data.task_id) {
        setTaskId(data.task_id);
        toast({
          title: "Generation Started",
          description: "Your music is being generated. This may take a minute...",
        });
        // Start polling for status
        setTimeout(() => checkStatus(data.task_id), 3000);
      }
    } catch (error: any) {
      console.error("Error generating music:", error);
      setIsGenerating(false);
      
      // Extract error message from the error object
      let errorMessage = "Failed to start music generation";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="slide-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 float-animation" />
            AI Music Generator
          </CardTitle>
          <CardDescription>
            Generate custom music using AI. Provide a prompt, tags, or lyrics to create your song.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the style of music you want... (e.g., 'An upbeat rock song with heavy guitar riffs')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="rock, energetic, guitar, upbeat"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              <a 
                href="https://sonauto.ai/tag-explorer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                View valid tags
              </a>
            </p>
          </div>

          {!instrumental && (
            <div className="space-y-2">
              <Label htmlFor="lyrics">Lyrics (optional)</Label>
              <Textarea
                id="lyrics"
                placeholder="Enter custom lyrics or leave empty for AI-generated lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={setInstrumental}
            />
            <Label htmlFor="instrumental">Instrumental (no vocals)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numSongs">Number of Songs</Label>
              <Select value={numSongs} onValueChange={setNumSongs}>
                <SelectTrigger id="numSongs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 song (100 credits)</SelectItem>
                  <SelectItem value="2">2 songs (150 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                  <SelectItem value="m4a">M4A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="gradient"
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... ({status})
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Generate Music
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {audioUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Music</CardTitle>
            <CardDescription>Your AI-generated songs are ready!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioUrls.map((url, index) => (
              <div key={index} className="space-y-2">
                <Label>Song {index + 1}</Label>
                <div className="flex items-center gap-2">
                  <audio controls className="flex-1">
                    <source src={url} type={`audio/${outputFormat}`} />
                    Your browser does not support the audio element.
                  </audio>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
