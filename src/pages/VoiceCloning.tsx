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
    <div className="space-y-6">
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
          
          <div 
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Mic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <div>
              <p className="text-lg font-medium">Click to upload audio</p>
              <p className="text-sm text-muted-foreground">MP3, WAV up to 10MB</p>
              {audioFile && (
                <p className="text-sm text-primary mt-2">Selected: {audioFile.name}</p>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Text to Generate
              </label>
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
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-5 w-5" />
                  Clone Voice
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Result Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Generated Audio
          </h2>

          {generatedAudio ? (
            <div className="space-y-4">
              <audio 
                ref={audioRef}
                src={generatedAudio} 
                controls 
                className="w-full"
              />
              
              <div className="flex gap-2">
                <Button 
                  onClick={handlePlay}
                  variant="outline"
                  className="flex-1"
                >
                  <Volume2 className="mr-2 h-4 w-4" />
                  Play
                </Button>
                <Button 
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Volume2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Your generated audio will appear here
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Warning */}
      <Card className="p-4 bg-orange-500/10 border-orange-500/20">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-500 mb-1">Ethical Use Only</h4>
            <p className="text-sm text-muted-foreground">
              Voice cloning should only be used with consent. Do not use this technology to impersonate others without permission.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VoiceCloning;
