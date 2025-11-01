import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Play, Download, Loader2, Mic, Volume2 } from "lucide-react";
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

  const handleClone = async () => {
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
        body: { audioUrl: publicUrl, text }
      });

      if (error) throw error;

      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Success!",
        description: "Voice cloned successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to clone voice. Please try again.",
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Voice Cloning</h1>
          <p className="text-muted-foreground">
            Clone any voice using Eleven Labs - Professional quality voice synthesis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Sample & Text
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Upload Voice Sample
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload at least 30 seconds of clear audio for best results
                </p>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {audioFile ? (
                    <div className="space-y-2">
                      <Volume2 className="w-12 h-12 mx-auto text-primary" />
                      <p className="font-medium">{audioFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload MP3, WAV, or M4A
                      </p>
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
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Text to Speak
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want the cloned voice to speak..."
                  className="min-h-32"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {text.length} characters
                </p>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleClone}
                disabled={!audioFile || !text || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cloning Voice...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Clone Voice
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Generated Audio
            </h2>

            <div className="border-2 rounded-lg p-12 text-center bg-muted/30">
              {generatedAudio ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Volume2 className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-medium">Audio Generated!</p>
                  <audio ref={audioRef} src={generatedAudio} className="w-full" />
                </div>
              ) : (
                <div className="space-y-4 py-16">
                  <Volume2 className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {isProcessing ? "Cloning your voice..." : "Generated audio will appear here"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button 
                size="lg"
                onClick={handlePlay}
                disabled={!generatedAudio}
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button 
                size="lg"
                onClick={handleDownload}
                disabled={!generatedAudio}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>
        </div>

        {/* Features */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">Powered by Eleven Labs:</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl">🎤</div>
              <h4 className="font-semibold">Professional Quality</h4>
              <p className="text-sm text-muted-foreground">
                Industry-leading voice cloning technology
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🌍</div>
              <h4 className="font-semibold">29 Languages</h4>
              <p className="text-sm text-muted-foreground">
                Multilingual voice synthesis support
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🎯</div>
              <h4 className="font-semibold">Natural Emotion</h4>
              <p className="text-sm text-muted-foreground">
                Realistic intonation and expression
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📹</div>
              <h4 className="font-semibold">Content Ready</h4>
              <p className="text-sm text-muted-foreground">
                Perfect for videos and podcasts
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default VoiceCloning;
