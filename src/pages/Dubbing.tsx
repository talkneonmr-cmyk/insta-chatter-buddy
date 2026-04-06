import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Upload, Download, Loader2, FileAudio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "hi", label: "Hindi" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
];

export default function Dubbing() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ audioUrl: string; transcript?: string; translation?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setResult(null);
    }
  };

  const handleDub = async () => {
    if (!targetLanguage) {
      toast({ title: "Select a language", description: "Choose a target language for dubbing", variant: "destructive" });
      return;
    }
    if (!audioFile && !transcript) {
      toast({ title: "Missing input", description: "Upload an audio file or enter a transcript", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_dubbing' }
      });
      if (limitError) throw limitError;
      if (!limitCheck.canUse) {
        toast({ title: "Daily Limit Reached", description: limitCheck.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      let audioUrl = "";
      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `dub-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('voice-samples')
          .upload(fileName, audioFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('voice-samples')
          .getPublicUrl(fileName);
        audioUrl = publicUrl;
      }

      const { data, error } = await supabase.functions.invoke('dub-audio', {
        body: { 
          audioUrl: audioUrl || undefined,
          transcript: transcript || undefined,
          targetLanguage 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);

      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_dubbing' }
      });

      toast({ title: "Success!", description: "Audio dubbed successfully" });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to dub audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
          <Languages className="h-7 w-7 sm:h-8 sm:w-8" />
          AI Dubbing
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Translate and dub your audio to different languages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Section */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload Audio
          </h2>

          <div 
            className="border-2 border-dashed rounded-lg p-6 sm:p-10 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {audioFile ? (
              <div className="space-y-2">
                <FileAudio className="w-10 h-10 mx-auto text-primary" />
                <p className="text-sm font-medium">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to change</p>
              </div>
            ) : (
              <div>
                <FileAudio className="w-10 h-10 sm:w-14 sm:h-14 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm sm:text-base font-medium">Click to upload audio</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, M4A</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="text-center text-xs text-muted-foreground">— OR enter transcript directly —</div>

          <Textarea
            placeholder="Paste your transcript here if you don't have audio..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Target Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleDub} disabled={isProcessing || (!audioFile && !transcript) || !targetLanguage} className="w-full" size="lg">
            {isProcessing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Dubbing...</>
            ) : (
              <><Languages className="mr-2 h-5 w-5" /> Start Dubbing</>
            )}
          </Button>
        </Card>

        {/* Result Section */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            Dubbed Audio
          </h2>

          {result ? (
            <div className="space-y-4">
              <audio controls className="w-full" src={result.audioUrl} />

              {result.transcript && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">Original Transcript:</p>
                  <p className="text-xs text-muted-foreground">{result.transcript}</p>
                </div>
              )}
              {result.translation && (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">Translation:</p>
                  <p className="text-xs text-muted-foreground">{result.translation}</p>
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = result.audioUrl;
                  link.download = "dubbed-audio.mp3";
                  link.click();
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Languages className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isProcessing ? "Translating and dubbing..." : "Your dubbed audio will appear here"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
