import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, Loader2, Mic, Volume2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TesterGuard from "@/components/TesterGuard";

const VoiceCloning = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setGeneratedAudio(null);
    }
  };

  const handleGenerate = async () => {
    if (!audioFile || !text) {
      toast({
        title: "Missing input",
        description: "Please upload a voice sample and enter text",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Upload audio file to Supabase storage
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-samples')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-samples')
        .getPublicUrl(fileName);

      // Call edge function to clone voice
      const { data, error } = await supabase.functions.invoke('clone-voice', {
        body: { 
          audioUrl: publicUrl, 
          text,
          usePreMadeVoice: false
        }
      });

      if (error) throw error;

      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Success!",
        description: "Voice cloned successfully",
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error?.message || "Failed to clone voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = "cloned-voice.mp3";
    link.click();
  };

  return (
    <TesterGuard featureName="Voice Cloning">
      <Layout>
...
      </Layout>
    </TesterGuard>
  );
};

export default VoiceCloning;
