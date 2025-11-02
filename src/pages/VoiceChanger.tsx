import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";

export default function VoiceChanger() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [targetVoice, setTargetVoice] = useState("male");
  const [isProcessing, setIsProcessing] = useState(false);
  const [changedAudio, setChangedAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setChangedAudio(null);
    }
  };

  const handleChangeVoice = async () => {
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
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      reader.onload = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('change-voice', {
          body: { audio: base64Audio, targetVoice }
        });

        if (error) throw error;

        setChangedAudio(data.audioUrl);
        toast({
          title: "Voice Changed!",
          description: "Voice transformation completed successfully",
        });
      };
    } catch (error: any) {
      console.error('Error changing voice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change voice",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 slide-in">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Voice Changer</h1>
        <p className="text-muted-foreground">Transform voice characteristics while preserving speech content</p>
      </div>

      <Card className="scale-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Change Voice
          </CardTitle>
          <CardDescription>
            Upload audio and select target voice characteristics
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
            <label className="block text-sm font-medium mb-2">Target Voice Type</label>
            <Select value={targetVoice} onValueChange={setTargetVoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="elderly">Elderly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleChangeVoice}
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
                <Mic className="h-4 w-4 mr-2" />
                Change Voice
              </>
            )}
          </Button>

          {changedAudio && (
            <div className="space-y-4 fade-in">
              <h3 className="text-lg font-semibold">Changed Audio</h3>
              <EnhancedAudioPlayer src={changedAudio} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
