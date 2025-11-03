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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an audio file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Upload to storage first
      const fileName = `${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);
      
      const { data, error } = await supabase.functions.invoke('isolate-voice', {
        body: { audioUrl: publicUrl }
      });

      if (error) throw error;

      // Cleanup uploaded file
      await supabase.storage.from('voice-samples').remove([fileName]);

      setIsolatedAudio(data.audioUrl);
      toast({
        title: "Voice Isolated!",
        description: "Background noise removed successfully",
      });
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
    <div className="relative min-h-[calc(100vh-4rem)] container mx-auto p-6 max-w-4xl">
      {/* Background Content - Blurred */}
      <div className="blur-md pointer-events-none select-none">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Voice Isolation
            </CardTitle>
            <CardDescription>
              Remove background noise and isolate voice from audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload audio file (MP3, WAV, up to 10MB)
                </p>
              </div>

              <Button className="w-full" size="lg" disabled>
                <Wand2 className="mr-2 h-5 w-5" />
                Isolate Voice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Notice Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="p-6 sm:p-8 w-full max-w-md sm:max-w-lg border-2 border-orange-500/50 shadow-2xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
              <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Feature Under Development</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Voice Isolation is currently in active development and testing phase.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 text-left">
              <p className="text-xs sm:text-sm font-semibold">What's Coming:</p>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• AI-powered noise reduction</li>
                <li>• Remove background music and sounds</li>
                <li>• Crystal clear voice isolation</li>
                <li>• Professional audio quality</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This feature will be available soon. Thank you for your patience!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
