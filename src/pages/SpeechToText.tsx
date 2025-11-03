import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, MicOff, Copy, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TesterGuard from "@/components/TesterGuard";

const SpeechToText = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(true);

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
    <TesterGuard featureName="Speech to Text">
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
...
      </div>
    </TesterGuard>
  );
};

export default SpeechToText;
