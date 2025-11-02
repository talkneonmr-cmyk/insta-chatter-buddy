import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wand2, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";

export default function VoiceIsolator() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isolatedAudio, setIsolatedAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setIsolatedAudio(null);
    }
  };

  const handleIsolateVoice = async () => {
    if (!audioFile) {
      toast({
        title: "No file selected",
        description: "Please select an audio file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      reader.onload = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('isolate-voice', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        setIsolatedAudio(data.audioUrl);
        toast({
          title: "Voice Isolated!",
          description: "Background noise removed successfully",
        });
      };
    } catch (error: any) {
      console.error('Error isolating voice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to isolate voice",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 slide-in">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Voice Isolator</h1>
        <p className="text-muted-foreground">Remove background noise and isolate speech from audio</p>
      </div>

      <Card className="scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Isolate Voice
          </CardTitle>
          <CardDescription>
            Upload audio to remove background noise and isolate the voice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Audio File</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('audio-upload')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : "Choose Audio File"}
              </Button>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <Button
            onClick={handleIsolateVoice}
            disabled={!audioFile || isProcessing}
            className="w-full"
            variant="gradient"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Isolate Voice
              </>
            )}
          </Button>

          {isolatedAudio && (
            <div className="space-y-4 fade-in">
              <h3 className="text-lg font-semibold">Isolated Audio</h3>
              <EnhancedAudioPlayer src={isolatedAudio} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
