import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Mic, MicOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AIAgents() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const userText = event.results[last][0].transcript;
        
        console.log('User said:', userText);
        setTranscript(prev => [...prev, { role: 'user', text: userText }]);
        
        // Get AI response
        setIsListening(false);
        try {
          const { data, error } = await supabase.functions.invoke('ai-voice-chat', {
            body: { message: userText }
          });

          if (error) throw error;

          const aiResponse = data.reply;
          setTranscript(prev => [...prev, { role: 'assistant', text: aiResponse }]);
          
          // Speak the response
          speakText(aiResponse);
        } catch (error: any) {
          console.error('AI error:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to get AI response",
            variant: "destructive",
          });
          setIsListening(true);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'service-not-allowed') {
          setServiceError('Your browser blocked speech recognition in this embedded preview. Open the app in a new tab and allow microphone access.');
          toast({
            title: "Permission Required",
            description: "Open in a new tab and allow microphone access to enable voice chat.",
            variant: "destructive",
          });
          return;
        }
        if (event.error !== 'no-speech') {
          toast({
            title: "Recognition Error",
            description: `Speech recognition error: ${event.error}`,
            variant: "destructive",
          });
        }
      };

      recognitionRef.current.onend = () => {
        if (isConnected && isListening) {
          recognitionRef.current?.start();
        }
      };
    }

    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isConnected, isListening]);

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel(); // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsListening(true);
    };
    
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const handleStartAgent = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    if (!window.speechSynthesis) {
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Requesting microphone permission...');
      
      // Start recognition immediately in the user gesture to avoid service-not-allowed
      try { recognitionRef.current?.start(); } catch (e) { console.warn('Immediate start error:', e); }
      
      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      // Stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setServiceError(null);
      setIsConnected(true);
      setIsListening(true);
      
      toast({
        title: "🎙️ Agent Active",
        description: "Listening... Start speaking now! (Completely free & real-time)",
      });
      
      // Start recognition after permission is granted
      console.log('Starting speech recognition...');
      setTimeout(() => {
        try { recognitionRef.current?.start(); } catch (e) { console.warn('Start error:', e); }
      }, 250);

      
    } catch (error: any) {
      console.error('Error starting agent:', error);
      
      let errorTitle = "Microphone Access Required";
      let errorMessage = "Please allow microphone access to use voice chat.";
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Click the 🔒 icon in your browser's address bar and allow microphone access, then try again.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone detected. Please connect a microphone and try again.";
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Microphone is being used by another app. Please close other apps and try again.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Microphone access blocked due to security settings. Please check your browser settings.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleStopAgent = () => {
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    
    toast({
      title: "Agent Disconnected",
      description: "Voice conversation ended",
    });
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] container mx-auto p-6 max-w-4xl">
      {/* Background Content - Blurred */}
      <div className="blur-md pointer-events-none select-none">
        <div className="mb-8 slide-in">
          <h1 className="text-4xl font-bold mb-2 gradient-text">AI Voice Agents</h1>
          <p className="text-muted-foreground">Conversational AI with voice interaction</p>
        </div>

        <Card className="scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Voice Agent
            </CardTitle>
            <CardDescription>
              Start a voice conversation with an AI agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center items-center min-h-[200px]">
              <Button size="lg" className="h-24 w-24 rounded-full" disabled>
                <Mic className="h-8 w-8" />
              </Button>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-semibold mb-2">✨ Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 🎙️ Browser-based voice recognition</li>
                <li>• 🔊 Natural text-to-speech</li>
                <li>• 🤖 AI-powered responses</li>
                <li>• 💬 Real-time conversation flow</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Notice Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <Card className="p-6 sm:p-8 w-full max-w-md sm:max-w-lg border-2 border-orange-500/50 shadow-2xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
              <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Feature Under Development</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                AI Voice Agents are currently in active development and testing phase.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 text-left">
              <p className="text-xs sm:text-sm font-semibold">What's Coming:</p>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <li>• Real-time voice conversations with AI</li>
                <li>• Natural language understanding</li>
                <li>• Multi-turn dialogue support</li>
                <li>• Custom voice personalities</li>
              </ul>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This feature will be available soon. Thank you for your patience!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
