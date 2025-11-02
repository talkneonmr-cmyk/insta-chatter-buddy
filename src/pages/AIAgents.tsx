import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Mic, MicOff, Loader2 } from "lucide-react";

export default function AIAgents() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleStartAgent = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsConnected(true);
      setIsListening(true);
      
      toast({
        title: "Agent Connected",
        description: "AI voice agent is now listening",
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Process audio chunks here
          console.log('Audio chunk received:', event.data);
        }
      };
      
      mediaRecorder.start(1000);
      
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsConnected(false);
    setIsListening(false);
    
    toast({
      title: "Agent Disconnected",
      description: "Voice conversation ended",
    });
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
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
                variant="gradient"
                className="h-24 w-24 rounded-full"
              >
                <Mic className="h-8 w-8" />
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <div className={`relative h-24 w-24 mx-auto rounded-full bg-primary/20 flex items-center justify-center ${isListening ? 'animate-pulse' : ''}`}>
                  {isListening ? (
                    <Mic className="h-8 w-8 text-primary" />
                  ) : (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  )}
                </div>
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
              <div className="max-h-[300px] overflow-y-auto space-y-2 p-4 bg-muted/20 rounded-lg">
                {transcript.map((text, index) => (
                  <p key={index} className="text-sm">{text}</p>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-semibold mb-2">Features</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Real-time voice conversation</li>
              <li>• Natural language understanding</li>
              <li>• Context-aware responses</li>
              <li>• Low-latency interaction</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
