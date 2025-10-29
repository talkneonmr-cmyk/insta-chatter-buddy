import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Music, Loader2, Download, RotateCcw } from "lucide-react";
import MusicPresets from "./MusicPresets";
import EnhancedAudioPlayer from "./EnhancedAudioPlayer";

const PRESET_TAGS = [
  "pop", "rock", "jazz", "classical", "electronic", "rap", "country", 
  "blues", "reggae", "metal", "punk", "folk", "indie", "soul", "funk", "disco", "edm",
  "chill", "upbeat", "energetic", "relaxing", "ambient", "cinematic", "beats", "guitar"
];

const DRAFT_KEY = "music-generator-draft";

const sanitizeTags = (tags: any): string[] => {
  if (!Array.isArray(tags)) return [];
  const mapped = tags.map((t: any) => {
    const v = String(t).toLowerCase().trim();
    if (v === "lofi") return "chill";
    if (v === "hiphop") return "rap";
    return v;
  });
  return Array.from(new Set(mapped.filter(Boolean)));
};

export default function MusicGeneratorForm() {
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const base = { title: "", prompt: "", lyrics: "", tags: [], instrumental: false, numSongs: 1, outputFormat: "mp3", bpm: 120, vocalistGender: "female" };
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.tags) parsed.tags = sanitizeTags(parsed.tags);
        return { ...base, ...parsed };
      } catch {
        return base;
      }
    }
    return base;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [generationStartTime, setGenerationStartTime] = useState(0);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (updates: any) => {
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const handleApplyPreset = (preset: any) => {
    updateFormData({
      prompt: preset.prompt_template,
      tags: preset.tags,
      bpm: preset.bpm,
      instrumental: preset.instrumental,
    });
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Please enter a song title", variant: "destructive" });
      return;
    }

    if (formData.lyrics && formData.instrumental) {
      toast({ title: "Invalid combination", description: "Cannot generate instrumental music with lyrics. Please remove lyrics or turn off instrumental mode.", variant: "destructive" });
      return;
    }

    // Free plan users get limited music generation
    if (plan === 'free') {
      toast({ 
        title: "Pro Feature", 
        description: "Music generation is available for Pro subscribers. Upgrade to create unlimited AI music!", 
        variant: "destructive" 
      });
      setTimeout(() => navigate('/pricing'), 2000);
      return;
    }

    try {
      setIsGenerating(true);
      setAudioUrls([]);
      setGenerationStartTime(Date.now());

      console.log('Starting music generation with:', {
        title: formData.title,
        tags: formData.tags,
        bpm: formData.bpm,
      });

      const cleanedTags = sanitizeTags(formData.tags);
      if (JSON.stringify(cleanedTags) !== JSON.stringify(formData.tags)) {
        toast({ title: "Adjusted tags", description: "Some tags were replaced to meet generator requirements (e.g., lofi → chill, hiphop → rap)." });
        setFormData((prev: any) => ({ ...prev, tags: cleanedTags }));
      }

      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: {
          title: formData.title,
          prompt: formData.prompt || undefined,
          tags: cleanedTags.length > 0 ? cleanedTags : undefined,
          lyrics: formData.lyrics || undefined,
          instrumental: formData.instrumental,
          num_songs: formData.numSongs,
          output_format: formData.outputFormat,
          bpm: formData.bpm,
          vocalist_gender: formData.vocalistGender,
        },
      });

      if (error) {
        console.error('Generation error:', error);
        throw error;
      }

      console.log('Generation started, task_id:', data?.task_id);

      if (data?.task_id) {
        toast({ title: "Generation Started", description: "Creating your music... This may take 1-2 minutes." });
        checkStatus(data.task_id);
      } else {
        throw new Error('No task_id returned from API');
      }
    } catch (error: any) {
      console.error('Error in handleGenerate:', error);
      setIsGenerating(false);
      toast({ title: "Error", description: error.message || "Failed to generate music", variant: "destructive" });
    }
  };

  const checkStatus = async (id: string) => {
    try {
      console.log('Checking status for task:', id);
      const { data, error } = await supabase.functions.invoke("check-audio-status", { body: { task_id: id } });

      if (error) {
        console.error('Status check error:', error);
        throw error;
      }

      console.log('Status response:', data);

      if (data.status === "SUCCESS" && data.song_paths) {
        const urls = data.song_paths;
        setAudioUrls(urls);
        setIsGenerating(false);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("music_generations").insert({
            user_id: user.id,
            title: formData.title,
            prompt: formData.prompt,
            lyrics: formData.lyrics,
            tags: formData.tags,
            bpm: formData.bpm,
            instrumental: formData.instrumental,
            output_format: formData.outputFormat,
            audio_urls: urls,
            task_id: id,
            generation_time_ms: Date.now() - generationStartTime,
          });
        }

        toast({ title: "Success!", description: "Your music has been generated and saved" });
        return;
      }

      if (data.status === "failed" || data.status === "FAILURE") {
        console.error('Generation failed:', data);
        setIsGenerating(false);
        toast({ title: "Failed", description: data.error || "Music generation failed", variant: "destructive" });
        return;
      }

      // Still processing - check again
      console.log('Still processing, checking again in 3s...');
      setTimeout(() => checkStatus(id), 3000);
    } catch (error: any) {
      console.error('Error in checkStatus:', error);
      setIsGenerating(false);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to check generation status", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-8">
      <MusicPresets onApplyPreset={handleApplyPreset} />
      <Card className="p-8 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border-primary/20 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Custom Configuration
          </h3>
          {(formData.title || formData.prompt) && (
            <Button variant="outline" onClick={() => { localStorage.removeItem(DRAFT_KEY); updateFormData({ title: "", prompt: "", lyrics: "", tags: [], bpm: 120 }); }} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6">
          <div>
            <Label>Song Title *</Label>
            <Input value={formData.title} onChange={(e) => updateFormData({ title: e.target.value })} className="h-14" required />
          </div>
          <div>
            <Label>BPM: {formData.bpm}</Label>
            <Slider min={60} max={180} value={[formData.bpm]} onValueChange={(v) => updateFormData({ bpm: v[0] })} />
          </div>
          <div>
            <Label>Prompt</Label>
            <Textarea value={formData.prompt} onChange={(e) => updateFormData({ prompt: e.target.value })} className="min-h-24" placeholder="Describe the style and mood of your song..." />
          </div>
          <div>
            <Label>Lyrics (Optional)</Label>
            <Textarea value={formData.lyrics} onChange={(e) => updateFormData({ lyrics: e.target.value })} className="min-h-32" placeholder="Enter your song lyrics here..." />
          </div>
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((t: string) => (
                <button key={t} type="button" onClick={() => updateFormData({ tags: formData.tags.filter((tag: string) => tag !== t) })} className="px-3 py-1 bg-primary text-white rounded-full text-sm">{t} ×</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.filter(t => !formData.tags.includes(t)).map(t => (
                <button key={t} type="button" onClick={() => updateFormData({ tags: [...formData.tags, t] })} className="px-3 py-1 bg-background border rounded-full text-sm">{t}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Vocalist Gender</Label>
            <Select value={formData.vocalistGender} onValueChange={(v) => updateFormData({ vocalistGender: v })} disabled={formData.instrumental}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female Vocalist</SelectItem>
                <SelectItem value="male">Male Vocalist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              checked={formData.instrumental} 
              onCheckedChange={(c) => {
                if (c && formData.lyrics) {
                  toast({ title: "Lyrics cleared", description: "Instrumental mode enabled - lyrics have been removed.", variant: "default" });
                  updateFormData({ instrumental: c, lyrics: "" });
                } else {
                  updateFormData({ instrumental: c });
                }
              }} 
            />
            <Label>Instrumental (no vocals)</Label>
          </div>
          <Button type="submit" disabled={isGenerating} className="w-full h-14 text-lg">
            {isGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Music className="mr-2 h-5 w-5" /> Generate</>}
          </Button>
          {audioUrls.length > 0 && (
            <div className="space-y-4 p-6 bg-primary/5 rounded-lg">
              <h3 className="text-xl font-bold flex items-center gap-2"><Music className="h-6 w-6" /> Generated Music</h3>
              {audioUrls.map((url, i) => (
                <div key={i} className="flex items-center gap-3">
                  <EnhancedAudioPlayer src={url} />
                  <Button 
                    type="button"
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(url, '_blank');
                    }} 
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </form>
      </Card>
    </div>
  );
}
