import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Mic, MicOff, Loader2, Volume2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIAgents() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant', text: string }>>([]);
  const { toast } = useToast();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State refs to avoid stale closures inside SpeechRecognition callbacks
  const isConnectedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const recognitionRunningRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
    isProcessingRef.current = isProcessing;
    isSpeakingRef.current = isSpeaking;
  }, [isConnected, isProcessing, isSpeaking]);

  function safeStartRecognition() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (recognitionRunningRef.current) return;

    try {
      rec.start();
    } catch (e) {
      // Common on mobile when start() is called twice; ignore.
      console.warn('Recognition start error:', e);
    }
  }

  function safeStopRecognition() {
    const rec = recognitionRef.current;
    if (!rec) return;

    try {
      rec.stop();
    } catch (e) {
      console.warn('Recognition stop error:', e);
    }
  }

  useEffect(() => {
    // Initialize Speech Recognition ONCE
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;

      // Important for stability: listen -> stop on result -> restart after TTS
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        recognitionRunningRef.current = true;
        setIsListening(true);
      };

      rec.onresult = async (event: any) => {
        const last = event.results.length - 1;
        const userText = event.results[last][0].transcript;

        // Stop listening while we think/speak
        safeStopRecognition();
        setIsListening(false);

        setTranscript(prev => [...prev, { role: 'user', text: userText }]);

        setIsProcessing(true);
        isProcessingRef.current = true;

        try {
          const { data, error } = await supabase.functions.invoke('ai-voice-chat', {
            body: { message: userText }
          });

          if (error) throw error;

          const aiResponse = data.reply;
          setTranscript(prev => [...prev, { role: 'assistant', text: aiResponse }]);

          setIsProcessing(false);
          isProcessingRef.current = false;

          // Speak the response (will restart recognition after speaking)
          speakText(aiResponse);
        } catch (error: any) {
          console.error('AI error:', error);
          setIsProcessing(false);
          isProcessingRef.current = false;
          toast({
            title: "Error",
            description: error.message || "Failed to get AI response",
            variant: "destructive",
          });

          // Try to resume listening
          setTimeout(() => {
            if (isConnectedRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
              safeStartRecognition();
            }
          }, 250);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        // 'aborted' happens when we programmatically stop() while switching modes; ignore it.
        if (event.error === 'aborted' || event.error === 'no-speech') {
          return;
        }

        if (event.error === 'service-not-allowed') {
          toast({
            title: "Permission Required",
            description: "Open in a new tab and allow microphone access to enable voice chat.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Recognition Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        });
      };

      rec.onend = () => {
        recognitionRunningRef.current = false;

        // Auto-restart only when connected and not currently speaking/processing
        if (isConnectedRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
          setTimeout(() => safeStartRecognition(), 200);
        }
      };
    }

    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      safeStopRecognition();
      synthRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const speakText = (text: string) => {
    if (!synthRef.current) return;

    // Stop recognition so it doesn't pick up the agent's own voice
    safeStopRecognition();

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to get a natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice =
      voices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')) ||
      voices.find((v) => v.lang?.startsWith('en')) ||
      voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      setIsListening(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;

      // Resume listening after speaking
      setTimeout(() => {
        if (isConnectedRef.current && !isProcessingRef.current) {
          safeStartRecognition();
        }
      }, 250);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

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
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      stream.getTracks().forEach(track => track.stop());
      
      setIsConnected(true);
      setIsListening(true);
      
      toast({
        title: "🎙️ Voice Agent Active",
        description: "I'm listening! Start speaking now.",
      });
      
      // Start recognition
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
        } catch (e) {
          console.warn('Start error:', e);
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Error starting agent:', error);
      
      let errorMessage = "Please allow microphone access to use voice chat.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Click the 🔒 icon in your browser's address bar and allow microphone access.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone detected. Please connect a microphone.";
      }
      
      toast({
        title: "Microphone Access Required",
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
    setIsProcessing(false);
    
    toast({
      title: "Agent Disconnected",
      description: "Voice conversation ended",
    });
  };

  const clearTranscript = () => {
    setTranscript([]);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  const getStatusText = () => {
    if (!isConnected) return "Click to start";
    if (isProcessing) return "Thinking...";
    if (isSpeaking) return "Speaking...";
    if (isListening) return "Listening...";
    return "Ready";
  };

  const getStatusColor = () => {
    if (!isConnected) return "bg-muted";
    if (isProcessing) return "bg-yellow-500/20 text-yellow-500";
    if (isSpeaking) return "bg-blue-500/20 text-blue-500";
    if (isListening) return "bg-green-500/20 text-green-500";
    return "bg-muted";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text">AI Voice Agent</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Have a natural voice conversation with AI • 100% Free
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Voice Control Card */}
        <Card className="lg:sticky lg:top-6 lg:self-start">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bot className="h-5 w-5 text-primary" />
              Voice Agent
            </CardTitle>
            <CardDescription className="text-sm">
              Click the microphone and start talking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Microphone Button */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {/* Pulse animation when listening */}
                {isListening && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                    <div className="absolute inset-[-8px] rounded-full bg-green-500/20 animate-pulse" />
                  </>
                )}
                {/* Wave animation when speaking */}
                {isSpeaking && (
                  <>
                    <div className="absolute inset-[-4px] rounded-full border-2 border-blue-500/50 animate-pulse" />
                    <div className="absolute inset-[-12px] rounded-full border border-blue-500/30 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="absolute inset-[-20px] rounded-full border border-blue-500/20 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </>
                )}
                
                <Button 
                  size="lg" 
                  onClick={isConnected ? handleStopAgent : handleStartAgent}
                  className={`relative z-10 h-24 w-24 sm:h-28 sm:w-28 rounded-full transition-all duration-300 ${
                    isConnected 
                      ? isSpeaking 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : isListening 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin" />
                  ) : isSpeaking ? (
                    <Volume2 className="h-8 w-8 sm:h-10 sm:w-10" />
                  ) : isConnected ? (
                    <MicOff className="h-8 w-8 sm:h-10 sm:w-10" />
                  ) : (
                    <Mic className="h-8 w-8 sm:h-10 sm:w-10" />
                  )}
                </Button>
              </div>

              {/* Status Badge */}
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>

            {/* Features */}
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">✨ Powered by</h4>
              <ul className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                <li>• 🎙️ Browser Speech Recognition (Free)</li>
                <li>• 🔊 Natural Text-to-Speech (Free)</li>
                <li>• 🤖 Lovable AI (Gemini - Free)</li>
                <li>• 💬 Real-time Conversation</li>
              </ul>
            </div>

            {/* Browser Support Note */}
            <p className="text-xs text-muted-foreground text-center">
              Best experience on Chrome or Edge
            </p>
          </CardContent>
        </Card>

        {/* Conversation History Card */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Conversation</CardTitle>
              <CardDescription className="text-sm">Live transcript</CardDescription>
            </div>
            {transcript.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearTranscript}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] sm:h-[400px] pr-4" ref={scrollRef}>
              {transcript.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {isConnected 
                      ? "I'm listening... say something!" 
                      : "Start the agent to begin a conversation"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transcript.map((message, index) => (
                    <div 
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm sm:text-base ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
