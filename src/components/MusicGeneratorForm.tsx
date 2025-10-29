import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Music, Loader2, Play, Download, X } from "lucide-react";

const PRESET_TAGS = [
  "rock", "pop", "jazz", "electronic", "acoustic", "upbeat", "mellow", 
  "energetic", "calm", "guitar", "piano", "drums", "synth", "vocals"
];

export const MusicGeneratorForm = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [instrumental, setInstrumental] = useState(false);
  const [numSongs, setNumSongs] = useState("1");
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

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
    if (!prompt && selectedTags.length === 0 && !lyrics) {
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
          title: title || undefined,
          prompt: prompt || undefined,
          lyrics: lyrics || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
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
    <div className="space-y-6 animate-fade-in">
      <Card className="border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Music className="h-6 w-6 text-primary" />
            </div>
            Create Your Music
          </CardTitle>
          <CardDescription className="text-base">
            Fill in the details below to generate your custom AI music
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-medium">Song Title (optional)</Label>
            <Input
              id="title"
              placeholder="My Amazing Song"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 border-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="prompt" className="text-base font-medium">Music Style & Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the style of music you want... (e.g., 'An upbeat rock song with heavy guitar riffs')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none border-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Music Tags</Label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 border-2 border-primary/20 rounded-xl bg-primary/5 backdrop-blur-sm">
                {selectedTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    className="gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105"
                  >
                    {tag}
                    <X 
                      className="h-3.5 w-3.5 cursor-pointer hover:opacity-70 transition-opacity" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Preset Tags */}
            <div className="flex flex-wrap gap-2 p-4 border-2 border-dashed border-primary/20 rounded-xl bg-muted/30">
              {PRESET_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-110 transition-all duration-200 px-3 py-1.5 hover:shadow-lg"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {!instrumental && (
            <div className="space-y-3">
              <Label htmlFor="lyrics" className="text-base font-medium">Custom Lyrics (optional)</Label>
              <Textarea
                id="lyrics"
                placeholder="Enter custom lyrics or leave empty for AI-generated lyrics"
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={5}
                className="resize-none border-primary/20 focus:border-primary transition-colors font-mono"
              />
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-xl border border-primary/10">
            <Switch
              id="instrumental"
              checked={instrumental}
              onCheckedChange={setInstrumental}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="instrumental" className="cursor-pointer text-base font-medium">
              Instrumental Mode (no vocals)
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="numSongs" className="text-base font-medium">Number of Songs</Label>
              <Select value={numSongs} onValueChange={setNumSongs}>
                <SelectTrigger id="numSongs" className="h-11 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 song (100 credits)</SelectItem>
                  <SelectItem value="2">2 songs (150 credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="format" className="text-base font-medium">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger id="format" className="h-11 border-primary/20">
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
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Generating... ({status})
              </>
            ) : (
              <>
                <Music className="mr-3 h-5 w-5" />
                Generate Music
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {audioUrls.length > 0 && (
        <Card className="border-primary/20 shadow-xl backdrop-blur-sm bg-card/95 animate-scale-in">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Music className="h-6 w-6 text-primary" />
              </div>
              Your Generated Music
            </CardTitle>
            <CardDescription className="text-base">
              🎉 Your AI-generated songs are ready! Download or play them below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audioUrls.map((url, index) => (
              <div 
                key={index} 
                className="space-y-3 p-5 bg-muted/50 rounded-xl border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {index + 1}
                    </div>
                    Song {index + 1}
                  </Label>
                  <Button
                    variant="outline"
                    size="icon"
                    className="hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110"
                    onClick={() => window.open(url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <audio controls className="w-full h-12">
                  <source src={url} type={`audio/${outputFormat}`} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
