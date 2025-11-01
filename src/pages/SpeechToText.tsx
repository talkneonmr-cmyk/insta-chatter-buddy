import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, MicOff, Copy, Download, Sparkles, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SpeechToText = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      setTranscript(prev => prev + finalTranscript);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Recognition Error",
        description: `Error: ${event.error}`,
        variant: "destructive"
      });
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, [toast]);

  const toggleListening = () => {
    if (!recognition || !isSupported) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      toast({
        title: "Stopped",
        description: "Speech recognition stopped"
      });
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Start speaking now"
      });
    }
  };

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
        description: "Please upload an audio file first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      toast({
        title: "Transcribing...",
        description: "Processing with OpenAI Whisper (10-20 seconds)"
      });

      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioFile);
      });

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;
      
      setTranscript(data.text || "");
      
      toast({
        title: "Done!",
        description: "Your audio has been transcribed"
      });
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: error.message || "Please make sure OpenAI API key is configured",
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
                <h3 className="font-semibold text-green-500">Two Ways to Transcribe</h3>
                <p className="text-sm text-muted-foreground">
                  🎤 <strong>Live Speech:</strong> Free, instant using Web Speech API (Chrome/Edge)<br/>
                  📁 <strong>File Upload:</strong> Fast transcription with OpenAI Whisper API (requires API key)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Microphone Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-green-500" />
                Live Speech (Free)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-xl ${isListening ? 'bg-green-500/30 animate-pulse' : 'bg-muted/30'}`}></div>
                  <Button
                    onClick={toggleListening}
                    disabled={!isSupported}
                    size="lg"
                    className={`relative w-24 h-24 rounded-full ${
                      isListening 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90' 
                        : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:opacity-90'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="h-10 w-10" />
                    ) : (
                      <Mic className="h-10 w-10" />
                    )}
                  </Button>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">
                    {isListening ? "Listening..." : "Click to Start"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isListening 
                      ? "Speak clearly into your microphone" 
                      : isSupported 
                        ? "Real-time speech transcription" 
                        : "Not supported in this browser"
                    }
                  </p>
                </div>

                {!isSupported && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Please use Chrome or Edge browser for speech recognition
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>100% Free - Web Speech API</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Upload Audio File
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
                className="w-full h-32 border-2 border-dashed hover:border-blue-500/50 hover:bg-blue-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
                disabled={isListening}
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
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
                      <Upload className="h-5 w-5 text-blue-500" />
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
                    className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:opacity-90"
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
                        Transcribe File
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>OpenAI Whisper - Requires API Key</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Result Section */}
        {transcript && (
          <Card>
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
        )}

        {/* Use Cases - Moved to bottom */}
        <Card>
          <CardHeader>
            <CardTitle>Perfect For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">1</div>
                  <h4 className="font-semibold">Live Conversations</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time transcription of meetings, interviews, or calls
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">2</div>
                  <h4 className="font-semibold">Voice Notes</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quickly dictate notes, ideas, or reminders
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold">3</div>
                  <h4 className="font-semibold">Content Creation</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Draft scripts, articles, or social media posts by speaking
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
