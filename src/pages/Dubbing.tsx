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

    const maxSize = 10 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an audio file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fileName = `${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);
      
      const { data, error } = await supabase.functions.invoke('dub-audio', {
        body: { audioUrl: publicUrl, targetLanguage }
      });

      if (error) throw error;

      await supabase.storage.from('voice-samples').remove([fileName]);

      if (data.audioUrl) {
        setDubbedAudio(data.audioUrl);
        toast({
          title: "Dubbing Complete!",
          description: "Audio dubbed successfully using free AI models",
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Languages className="h-8 w-8" />
          AI Dubbing
        </h1>
        <p className="text-muted-foreground">
          Translate and dub your audio to different languages
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Audio
            </CardTitle>
            <CardDescription>
              Select audio file to translate and dub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept="audio/*"
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  {audioFile ? audioFile.name : "Click to upload audio file"}
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV (max 10MB)
                </p>
              </label>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Target Language
              </label>
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
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleDubAudio}
              disabled={!audioFile || isProcessing}
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
                  <Languages className="mr-2 h-5 w-5" />
                  Dub Audio
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Dubbed Audio
            </CardTitle>
            <CardDescription>
              Your translated audio will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dubbedAudio ? (
              <EnhancedAudioPlayer src={dubbedAudio} />
            ) : (
              <div className="text-center py-12">
                <Languages className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Upload and process audio to see the dubbed result
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
