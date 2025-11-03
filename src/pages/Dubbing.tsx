import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Languages, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";

export default function Dubbing() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dubbedAudio, setDubbedAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setDubbedAudio(null);
    }
  };

  const handleDubAudio = async () => {
    if (!audioFile) {
      toast({
        title: "No file selected",
        description: "Please select an audio file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result?.toString().split(',')[1];
          if (result) resolve(result);
          else reject(new Error("Failed to read audio file"));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioFile);
      });
      
      const { data, error } = await supabase.functions.invoke('dub-audio', {
        body: { audio: base64Audio, targetLanguage }
      });

      if (error) throw error;

      if (data.status === 'processing') {
        toast({
          title: "Dubbing Started",
          description: data.message,
        });
      } else if (data.audioUrl) {
        setDubbedAudio(data.audioUrl);
        toast({
          title: "Dubbing Complete!",
          description: "Audio dubbed to target language successfully",
        });
      }
    } catch (error: any) {
      console.error('Error dubbing audio:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to dub audio",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 slide-in">
        <h1 className="text-4xl font-bold mb-2 gradient-text">AI Dubbing</h1>
        <p className="text-muted-foreground">Translate and dub audio to different languages</p>
      </div>

      <Card className="scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Dub Audio
          </CardTitle>
          <CardDescription>
            Upload audio and select target language for dubbing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Audio File</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById('audio-upload')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {audioFile ? audioFile.name : "Choose Audio File"}
              </Button>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDubAudio}
            disabled={!audioFile || isProcessing}
            className="w-full"
            variant="gradient"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Dub Audio
              </>
            )}
          </Button>

          {dubbedAudio && (
            <div className="space-y-4 fade-in">
              <h3 className="text-lg font-semibold">Dubbed Audio</h3>
              <EnhancedAudioPlayer src={dubbedAudio} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
