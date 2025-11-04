import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Download, Loader2, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";
import * as BrowserTTS from "@diffusionstudio/vits-web";

// Voice list will be loaded from the in-browser TTS engine
const DEFAULT_VOICE_ID = "en_US-hfc_female-medium";

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(DEFAULT_VOICE_ID);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<number>();
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (generatedAudio) {
        URL.revokeObjectURL(generatedAudio);
      }
    };
  }, [generatedAudio]);

  useEffect(() => {
    let mounted = true;
    const loadVoices = async () => {
      try {
        const v: any = (BrowserTTS as any).voices ? await (BrowserTTS as any).voices() : null;
        if (!mounted) return;

        let list: { id: string; name: string }[] = [];

        if (Array.isArray(v)) {
          list = v.map((item: any, idx: number) => {
            if (typeof item === 'string') {
              return { id: item, name: item };
            }
            if (item && typeof item === 'object') {
              const id = String(item.key || item.name || `voice-${idx}`);
              const name = String(item.name || item.key || `Voice ${idx + 1}`);
              return { id, name };
            }
            return { id: `voice-${idx}`, name: `Voice ${idx + 1}` };
          });
        } else if (v && typeof v === "object") {
          list = Object.entries(v).map(([id, voiceData]: [string, any]) => {
            let displayName = id;
            if (voiceData && typeof voiceData === 'object') {
              if ('name' in voiceData && typeof (voiceData as any).name === 'string') {
                displayName = (voiceData as any).name as string;
              } else if ('key' in voiceData && typeof (voiceData as any).key === 'string') {
                displayName = (voiceData as any).key as string;
              }
            } else if (typeof voiceData === 'string') {
              displayName = voiceData;
            }
            return { id: String(id), name: String(displayName) };
          });
        }

        // Dedupe by id
        const unique = Array.from(new Map(list.map((v) => [v.id, v])).values());

        if (mounted && unique.length) {
          setVoices(unique);
          const currentVoice = unique.find((x) => x.id === selectedVoice);
          if (!currentVoice) {
            setSelectedVoice(unique[0].id);
          }
        }
      } catch (e) {
        if (mounted) {
          console.warn("Failed to load voices", e);
        }
      }
    };

    loadVoices();
    
    return () => {
      mounted = false;
    };
  }, [selectedVoice]);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Missing input",
        description: "Please enter text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    if (!mountedRef.current) return;

    setIsProcessing(true);
    try {
      // Clean up previous audio
      if (generatedAudio) {
        try {
          URL.revokeObjectURL(generatedAudio);
        } catch (e) {
          console.warn("Failed to revoke URL", e);
        }
        setGeneratedAudio(null);
      }

      if (!mountedRef.current) return;

      toast({
        title: "Generating speech",
        description: "First run may take longer while the model loads",
      });

      const wavBlob: Blob = await (BrowserTTS as any).predict({
        text,
        voiceId: selectedVoice || DEFAULT_VOICE_ID,
      });

      if (!mountedRef.current) return;

      const url = URL.createObjectURL(wavBlob);
      setGeneratedAudio(url);
      
      // Use ref to clear timeout on unmount
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        if (mountedRef.current && audioRef.current && url) {
          try {
            audioRef.current.src = url;
            audioRef.current.load();
          } catch (e) {
            console.warn("Failed to load audio", e);
          }
        }
      }, 0);

      if (mountedRef.current) {
        // Increment usage
        await supabase.functions.invoke('increment-usage', {
          body: { usageType: 'ai_text_to_speech' }
        });
        
        toast({
          title: "Success!",
          description: "Speech generated. You can play or download it below.",
        });
      }
    } catch (error) {
      console.error(error);
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to generate speech. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handlePlay = () => {
    if (!mountedRef.current) return;
    if (audioRef.current && generatedAudio) {
      try {
        audioRef.current.play().catch((e) => {
          console.warn("Failed to play audio", e);
          toast({
            title: "Playback error",
            description: "Could not play audio. Try regenerating.",
            variant: "destructive",
          });
        });
      } catch (e) {
        console.warn("Play error", e);
      }
    }
  };

  const handleDownload = () => {
    if (!generatedAudio || !mountedRef.current) return;
    try {
      const a = document.createElement("a");
      a.href = generatedAudio;
      a.download = "speech.wav";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Download failed", e);
      toast({
        title: "Download error",
        description: "Failed to download audio file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Text to Speech</h1>
        <p className="text-muted-foreground">
          Convert text to natural-sounding speech in your browser - Powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Text Input
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Enter text to convert</Label>
              <Textarea
                id="text"
                placeholder="Type or paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger id="voice" className="mt-2">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.length > 0 ? (
                    voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={DEFAULT_VOICE_ID}>Loading voices...</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isProcessing || !text.trim()}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-5 w-5" />
                  Generate Speech
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Output Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Play className="w-5 h-5" />
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
                  <Play className="mr-2 h-4 w-4" />
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
                Your generated speech will appear here
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex gap-3">
          <Volume2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-500 mb-1">Browser-Based Processing</h4>
            <p className="text-sm text-muted-foreground">
              All speech generation happens locally in your browser. No data is sent to servers. The first generation may take longer as the AI model loads.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TextToSpeech;
