import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Mic, Loader2, Copy, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SpeechToText = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setTranscript("");
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast({
        title: "No audio file",
        description: "Please upload an audio or video file first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      toast({
        title: "Transcribing...",
        description: "Processing your audio with OpenAI Whisper"
      });

      // Convert audio file to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;
      
      setTranscript(data.text || "");
      
      toast({
        title: "Transcription complete!",
        description: "Your audio has been transcribed successfully"
      });
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "Failed to transcribe audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    toast({
      title: "Copied!",
      description: "Transcript copied to clipboard"
    });
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transcript.txt';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 slide-in">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="btn-3d"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg float-animation">
              <Mic className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Speech-to-Text</h1>
              <p className="text-muted-foreground">Transcribe audio & video with Whisper AI - 100% Free!</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="font-semibold text-green-500">OpenAI Whisper AI - Fast & Accurate</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by OpenAI's Whisper model. Perfect for transcribing YouTube videos, 
                  podcasts, or any audio content. Fast processing in 10-20 seconds!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-500" />
                Upload Audio/Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                className="w-full h-32 border-2 border-dashed hover:border-green-500/50 hover:bg-green-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Mic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload audio or video
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP3, WAV, M4A, MP4, WebM
                  </p>
                </div>
              </Button>

              {audioFile && (
                <>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-green-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleTranscribe}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:opacity-90"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transcribing...
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Transcribe Audio
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Powered by OpenAI Whisper API - Fast & Reliable</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Result Section */}
          {transcript ? (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-green-500" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={12}
                  className="resize-none font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={copyToClipboard}
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button 
                    onClick={downloadTranscript}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-fit">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 backdrop-blur-xl">
                      <Mic className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ready to Transcribe</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload audio/video to get instant transcription
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">1</div>
                  <h4 className="font-semibold">YouTube Videos</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Transcribe your videos to create subtitles or blog posts
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">2</div>
                  <h4 className="font-semibold">Podcast Scripts</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Convert podcast episodes into written content automatically
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold">3</div>
                  <h4 className="font-semibold">Meeting Notes</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Record meetings and get instant text transcripts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SpeechToText;
