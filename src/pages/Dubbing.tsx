import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Languages, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";
import TesterGuard from "@/components/TesterGuard";


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
    <TesterGuard featureName="AI Dubbing">
      
        <div className="container mx-auto p-6 max-w-4xl">
...
        </div>
      
    </TesterGuard>
  );
}
