import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Loader2, Mic, Volume2 } from "lucide-react";
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
      const { data: limitCheck, error: limitError } = await supabase.functions.invoke('check-usage-limit', {
        body: { limitType: 'ai_voice_cloning' }
      });

      if (limitError) throw limitError;
      
      if (!limitCheck.canUse) {
        toast({ title: "Daily Limit Reached", description: limitCheck.message, variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('clone-voice', {
        body: { audioUrl: publicUrl, text, usePreMadeVoice: false }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedAudio(data.audioUrl);
      
      await supabase.functions.invoke('increment-usage', {
        body: { usageType: 'ai_voice_cloning' }
      });

      toast({ title: "Success!", description: "Voice cloned successfully" });
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

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = "cloned-voice.mp3";
    link.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
          <Volume2 className="h-7 w-7 sm:h-8 sm:w-8" />
          Voice Cloning
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Clone any voice with AI - Upload a sample and generate speech
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upload Section */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Upload Voice Sample
          </h2>
          
          <div 
            className="border-2 border-dashed rounded-lg p-6 sm:p-12 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {audioFile ? (
              <div className="space-y-2">
                <Mic className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-primary" />
                <p className="text-sm sm:text-base font-medium">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">Click to change</p>
              </div>
            ) : (
              <div>
                <Mic className="w-10 h-10 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-2 sm:mb-4" />
                <p className="text-sm sm:text-lg font-medium">Click to upload audio</p>
                <p className="text-xs sm:text-sm text-muted-foreground">MP3, WAV up to 10MB</p>
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

          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Text to Generate</label>
              <Textarea
                placeholder="Enter the text you want the cloned voice to say..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isProcessing || !audioFile || !text}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Cloning Voice...</>
              ) : (
                <><Volume2 className="mr-2 h-5 w-5" /> Clone Voice</>
              )}
            </Button>
          </div>
        </Card>

        {/* Result Section */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            Generated Audio
          </h2>

          {generatedAudio ? (
            <div className="space-y-4">
              <audio ref={audioRef} controls className="w-full" src={generatedAudio} />
              <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download Audio
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Volume2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">
                {isProcessing ? "Generating cloned audio..." : "Your generated audio will appear here"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VoiceCloning;
