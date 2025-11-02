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
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsConnected(true);
      setIsListening(true);
      
      toast({
        title: "Agent Connected",
        description: "AI voice agent is now listening (completely free!)",
      });
      
      recognitionRef.current?.start();
      
    } catch (error: any) {
      console.error('Error starting agent:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
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
    <div className="container mx-auto p-6 max-w-4xl">
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
            {!isConnected ? (
              <Button
                onClick={handleStartAgent}
                size="lg"
                className="h-24 w-24 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`relative h-24 w-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                  {isSpeaking ? (
                    <Bot className="h-8 w-8 text-primary animate-pulse" />
                  ) : isListening ? (
                    <Mic className="h-8 w-8 text-primary" />
                  ) : (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSpeaking ? "AI is speaking..." : isListening ? "Listening..." : "Processing..."}
                </p>
                <Button
                  onClick={handleStopAgent}
                  variant="destructive"
                  size="lg"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  End Conversation
                </Button>
              </div>
            )}
          </div>

          {transcript.length > 0 && (
            <div className="space-y-2 fade-in">
              <h3 className="text-lg font-semibold">Conversation</h3>
              <div className="max-h-[300px] overflow-y-auto space-y-3 p-4 bg-muted/20 rounded-lg">
                {transcript.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm font-medium mb-1">
                        {msg.role === 'user' ? 'You' : 'AI'}
                      </p>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-semibold mb-2">✨ Completely Free Features</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 🎙️ Browser-based voice recognition (Web Speech API)</li>
              <li>• 🔊 Natural text-to-speech (Web Speech API)</li>
              <li>• 🤖 AI-powered responses (Lovable AI)</li>
              <li>• 💬 Real-time conversation flow</li>
              <li>• 🌐 Works in Chrome, Edge, and Safari</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
