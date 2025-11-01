import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
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
    <Layout>
      <div className="relative">
        {/* Background Content - Blurred */}
        <div className="blur-md pointer-events-none select-none space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Voice Cloning</h1>
            <p className="text-muted-foreground">
              Clone custom voices using advanced AI technology
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Upload Voice Sample
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload at least 30 seconds of clear audio.
                </p>
                <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Click to upload MP3, WAV, or M4A
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Text to Speak
                </label>
                <Textarea
                  placeholder="Enter the text you want the cloned voice to speak..."
                  className="min-h-32"
                  disabled
                />
              </div>

              <Button className="w-full" size="lg" disabled>
                <Mic className="w-4 h-4 mr-2" />
                Clone Voice
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Generated Audio
            </h2>
            <div className="border-2 rounded-lg p-12 text-center bg-muted/30">
              <Volume2 className="w-16 h-16 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground mt-4">
                Generated audio will appear here
              </p>
            </div>
          </Card>
        </div>

        {/* Development Notice Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="p-8 max-w-lg mx-4 border-2 border-orange-500/50 shadow-2xl">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Feature Under Development</h2>
                <p className="text-muted-foreground mb-4">
                  Voice cloning is currently in active development and testing phase.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-left">
                <p className="text-sm font-semibold">What's Coming:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Advanced voice cloning with high accuracy</li>
                  <li>• Multiple language support</li>
                  <li>• Real-time voice synthesis</li>
                  <li>• Custom voice profiles</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                This feature will be available soon. Thank you for your patience!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VoiceCloning;
