import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Loader2, Mic, Volume2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const VoiceCloning = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setGeneratedAudio(null);
    }
  };

  const handleGenerate = async () => {
    if (!audioFile || !text) {
      toast({
        title: "Missing input",
        description: "Please upload a voice sample and enter text",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Check usage limit
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_voice_cloning' }
      });

      if (limitError) throw limitError;
      
      if (!limitCheck.canUse) {
        toast({
          title: "Daily Limit Reached",
          description: limitCheck.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      // Upload audio file to Supabase storage
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);

      // Call edge function to clone voice
      const { data, error } = await supabase.functions.invoke('clone-voice', {
        body: { 
          audioUrl: publicUrl, 
          text,
          usePreMadeVoice: false
        }
      });

      if (error) throw error;

      setGeneratedAudio(data.audioUrl);
      
      // Increment usage tracking
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_voice_cloning' }
      });

      toast({
        title: "Success!",
        description: "Voice cloned successfully",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to clone voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = "cloned-voice.mp3";
    link.click();
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-6">
      {/* Background Content - Blurred */}
      <div className="blur-md pointer-events-none select-none">
        <div>
          <h1 className="text-3xl font-bold mb-2">Voice Cloning</h1>
          <p className="text-muted-foreground">
            Clone any voice with AI - Upload a sample and generate speech
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Voice Sample
            </h2>
            
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Mic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <div>
                <p className="text-lg font-medium">Click to upload audio</p>
                <p className="text-sm text-muted-foreground">MP3, WAV up to 10MB</p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Text to Generate
                </label>
                <Textarea
                  placeholder="Enter the text you want the cloned voice to say..."
                  rows={4}
                  disabled
                />
              </div>

              <Button 
                disabled
                className="w-full"
                size="lg"
              >
                <Volume2 className="mr-2 h-5 w-5" />
                Clone Voice
              </Button>
            </div>
          </Card>

          {/* Result Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Generated Audio
            </h2>

            <div className="text-center py-12">
              <Volume2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Your generated audio will appear here
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Development Notice Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="p-6 sm:p-8 w-full max-w-md sm:max-w-lg border-2 border-orange-500/50 shadow-2xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
              <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Feature Under Development</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Voice Cloning is currently in active development and testing phase.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 text-left">
              <p className="text-xs sm:text-sm font-semibold">What's Coming:</p>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• AI-powered voice cloning from samples</li>
                <li>• Generate speech in any cloned voice</li>
                <li>• High-quality audio output</li>
                <li>• Multiple voice profiles</li>
              </ul>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-left">
                  <span className="font-semibold text-orange-500">Ethical Use Policy:</span> Voice cloning will only be available with proper consent verification to prevent misuse.
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This feature will be available soon. Thank you for your patience!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoiceCloning;
