import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Wand2, Upload, Loader2 } from "lucide-react";
import EnhancedAudioPlayer from "@/components/EnhancedAudioPlayer";
import TesterGuard from "@/components/TesterGuard";
import { Layout } from "@/components/Layout";

export default function VoiceIsolator() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isolatedAudio, setIsolatedAudio] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setIsolatedAudio(null);
    }
  };

  const handleIsolateVoice = async () => {
    if (!audioFile) {
      toast({
        title: "No file selected",
        description: "Please select an audio file first",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
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
      // Upload to storage first
      const fileName = `${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);
      
      const { data, error } = await supabase.functions.invoke('isolate-voice', {
        body: { audioUrl: publicUrl }
      });

      if (error) throw error;

      // Cleanup uploaded file
      await supabase.storage.from('voice-samples').remove([fileName]);

      setIsolatedAudio(data.audioUrl);
      toast({
        title: "Voice Isolated!",
        description: "Background noise removed successfully",
      });
    } catch (error: any) {
      console.error('Error isolating voice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to isolate voice",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TesterGuard featureName="Voice Isolator">
      <Layout>
        <div className="container mx-auto p-6 max-w-4xl">
...
        </div>
      </Layout>
    </TesterGuard>
  );
}
