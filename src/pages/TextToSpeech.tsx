import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
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
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v: any = (BrowserTTS as any).voices ? await (BrowserTTS as any).voices() : null;
        let list: { id: string; name: string }[] = [];
        if (Array.isArray(v)) {
          list = v.map((id: string) => ({ id, name: id }));
        } else if (v && typeof v === "object") {
          list = Object.entries(v).map(([id, name]) => ({
            id,
            name: String(name || id),
          }));
        }
        if (mounted && list.length) {
          setVoices(list);
          if (!list.find((x) => x.id === selectedVoice)) {
            setSelectedVoice(list[0].id);
          }
        }
      } catch (e) {
        console.warn("Failed to load voices", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Missing input",
        description: "Please enter text to convert to speech",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (generatedAudio) {
        URL.revokeObjectURL(generatedAudio);
        setGeneratedAudio(null);
      }

      toast({
        title: "Generating speech",
        description: "First run may take longer while the model loads",
      });

      const wavBlob: Blob = await (BrowserTTS as any).predict({
        text,
        voiceId: selectedVoice || DEFAULT_VOICE_ID,
      });

      const url = URL.createObjectURL(wavBlob);
      setGeneratedAudio(url);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
      }, 0);

      toast({
        title: "Success!",
        description: "Speech generated. You can play or download it below.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && generatedAudio) {
      audioRef.current.play();
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const a = document.createElement("a");
    a.href = generatedAudio;
    a.download = "speech.wav";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Text to Speech</h1>
          <p className="text-muted-foreground">
            Free, on-device TTS. Generate high-quality, downloadable audio (WAV). First run may take longer to load the model.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Text Input & Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label>Select Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.length ? (
                      voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value={selectedVoice} disabled>
                        Loading voices...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Text to Convert</Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to convert to speech..."
                  className="min-h-32 mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {text.length} characters
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                Tip: The first generation downloads the on-device TTS model and may take up to a minute. Subsequent runs are much faster.
              </p>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleGenerate}
                disabled={!text || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Generate Speech
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
                <div className="space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Volume2 className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-medium">Audio Ready</p>
                  <EnhancedAudioPlayer src={generatedAudio} />
                  <audio ref={audioRef} src={generatedAudio} className="hidden" />
                </div>
              ) : (
                <div className="space-y-4 py-16">
                  <Volume2 className="w-16 h-16 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {isProcessing ? "Generating speech..." : "Generated audio will appear here"}
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

        {/* Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-3">On‑device Text‑to‑Speech (Free)</h3>
          <p className="text-sm text-muted-foreground">
            Runs entirely in your browser using an open TTS model — no keys, no costs. The first generation downloads the model and may take up to a minute; subsequent generations are much faster.
          </p>
        </Card>
      </div>
    </Layout>
  );
};

export default TextToSpeech;
