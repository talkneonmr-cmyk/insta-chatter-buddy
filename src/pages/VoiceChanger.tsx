import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";
import TesterGuard from "@/components/TesterGuard";
import { Layout } from "@/components/Layout";

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
      
      const { data, error } = await supabase.functions.invoke('change-voice', {
        body: { audioUrl: publicUrl, targetVoice }
      });

      if (error) throw error;

      await supabase.storage.from('voice-samples').remove([fileName]);

      setChangedAudio(data.audioUrl);
      toast({
        title: "Voice Changed!",
        description: "Voice transformation completed successfully",
      });
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
    <TesterGuard featureName="Voice Changer">
      <Layout>
        <div className="container mx-auto p-6 max-w-4xl">
...
        </div>
      </Layout>
    </TesterGuard>
  );
}
