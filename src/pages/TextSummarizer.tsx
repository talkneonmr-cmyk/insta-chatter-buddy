import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, FileText, Loader2, Copy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TesterGuard from "@/components/TesterGuard";

const TextSummarizer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summaryLength, setSummaryLength] = useState([50]);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No text to summarize",
        description: "Please enter some text first",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    toast({
      title: "Summarizing...",
      description: "AI is generating your summary"
    });

    try {
      const { data, error } = await supabase.functions.invoke('summarize-text', {
        body: { 
          text: inputText,
          maxLength: summaryLength[0]
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.summary) {
        throw new Error('No summary generated');
      }

      setSummary(data.summary);
      
      toast({
        title: "Summary complete!",
        description: "Your text has been summarized"
      });
    } catch (error: any) {
      console.error('Summarization error:', error);
      let errorMessage = "Failed to summarize text";
      
      if (error.message?.includes('Rate limit')) {
        errorMessage = "Too many requests. Please wait a moment.";
      } else if (error.message?.includes('credits')) {
        errorMessage = "AI credits depleted. Please try again later.";
      }
      
      toast({
        title: "Summarization failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard"
    });
  };

  return (
    <TesterGuard featureName="Text Summarizer">
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
...
      </div>
    </TesterGuard>
  );
};

export default TextSummarizer;
